
import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, useGLTF, PerspectiveCamera, OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';
import { Entity, Room, Vector2, Direction, Projectile, Item } from '../types';
import {
    CANVAS_WIDTH, CANVAS_HEIGHT,
    PLAYER_SIZE, ENEMY_SIZE, PROJECTILE_SIZE, ITEM_SIZE
} from '../constants';
import { Player3D } from './3d/Player3D';
import { Enemy3D } from './3d/Enemy3D';
import { Projectile3D } from './3d/Projectile3D';
import { ErrorBoundary } from './ErrorBoundary';

// --- Types ---
interface GameRenderer3DProps {
    player: Entity;
    currentRoom: Room;
    projectiles: Projectile[];
    onKeyDown: (key: string) => void;
    onKeyUp: (key: string) => void;
}

// --- Constants ---
const TILE_SIZE = 1; // 3D units
const ROOM_WIDTH = 13; // 13x9 grid roughly matches the 800x600 aspect
const ROOM_HEIGHT = 9;

// --- Assets ---
// Preload models
useGLTF.preload('/assets/3d/floor_tile_small.gltf');
useGLTF.preload('/assets/3d/wall.gltf');
useGLTF.preload('/assets/3d/wall_doorway.gltf');
useGLTF.preload('/assets/3d/player.gltf');
useGLTF.preload('/assets/3d/enemy.gltf');

// --- Components ---

const FloorTile = ({ position }: { position: [number, number, number] }) => {
    const { scene } = useGLTF('/assets/3d/floor_tile_small.gltf');
    const clone = scene.clone();
    return <primitive object={clone} position={position} />;
};

const WallTile = ({ position, rotation = [0, 0, 0] }: { position: [number, number, number], rotation?: [number, number, number] }) => {
    const { scene } = useGLTF('/assets/3d/wall.gltf');
    const clone = scene.clone();
    return <primitive object={clone} position={position} rotation={rotation} />;
};

const DoorTile = ({ position, rotation = [0, 0, 0] }: { position: [number, number, number], rotation?: [number, number, number] }) => {
    const { scene } = useGLTF('/assets/3d/wall_doorway.gltf');
    const clone = scene.clone();
    return <primitive object={clone} position={position} rotation={rotation} />;
};



// --- Main Scene ---
const GameScene: React.FC<GameRenderer3DProps> = ({ player, currentRoom, projectiles }) => {

    // Convert 2D game coords (pixels) to 3D world coords
    // Game: 0,0 is top-left. 800x600.
    // 3D: 0,0,0 is center.
    const to3D = (x: number, y: number): [number, number, number] => {
        const x3d = (x / CANVAS_WIDTH) * ROOM_WIDTH - ROOM_WIDTH / 2;
        const z3d = (y / CANVAS_HEIGHT) * ROOM_HEIGHT - ROOM_HEIGHT / 2;
        return [x3d, 0, z3d];
    };

    return (
        <>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 20, 10]} intensity={1} castShadow />

            {/* Floor */}
            {Array.from({ length: ROOM_HEIGHT }).map((_, z) =>
                Array.from({ length: ROOM_WIDTH }).map((_, x) => (
                    <FloorTile
                        key={`floor-${x}-${z}`}
                        position={[x - ROOM_WIDTH / 2 + 0.5, 0, z - ROOM_HEIGHT / 2 + 0.5]}
                    />
                ))
            )}

            {/* Walls (Perimeter) */}
            {/* Top & Bottom */}
            {Array.from({ length: ROOM_WIDTH }).map((_, x) => (
                <React.Fragment key={`wall-x-${x}`}>
                    <WallTile position={[x - ROOM_WIDTH / 2 + 0.5, 0, -ROOM_HEIGHT / 2]} />
                    <WallTile position={[x - ROOM_WIDTH / 2 + 0.5, 0, ROOM_HEIGHT / 2]} rotation={[0, Math.PI, 0]} />
                </React.Fragment>
            ))}
            {/* Left & Right */}
            {Array.from({ length: ROOM_HEIGHT }).map((_, z) => (
                <React.Fragment key={`wall-z-${z}`}>
                    <WallTile position={[-ROOM_WIDTH / 2, 0, z - ROOM_HEIGHT / 2 + 0.5]} rotation={[0, Math.PI / 2, 0]} />
                    <WallTile position={[ROOM_WIDTH / 2, 0, z - ROOM_HEIGHT / 2 + 0.5]} rotation={[0, -Math.PI / 2, 0]} />
                </React.Fragment>
            ))}

            {/* Doors */}
            {currentRoom.doors[Direction.UP] && <DoorTile position={[0, 0, -ROOM_HEIGHT / 2]} />}
            {currentRoom.doors[Direction.DOWN] && <DoorTile position={[0, 0, ROOM_HEIGHT / 2]} rotation={[0, Math.PI, 0]} />}
            {currentRoom.doors[Direction.LEFT] && <DoorTile position={[-ROOM_WIDTH / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]} />}
            {currentRoom.doors[Direction.RIGHT] && <DoorTile position={[ROOM_WIDTH / 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]} />}

            {/* Player */}
            <Player3D
                player={player}
                position={to3D(player.position.x, player.position.y)}
            />

            {/* Enemies */}
            {currentRoom.enemies.map(enemy => (
                enemy.isActive && <Enemy3D key={enemy.id} enemy={enemy} position={to3D(enemy.position.x, enemy.position.y)} />
            ))}

            {/* Projectiles */}
            {projectiles.map(proj => (
                proj.isActive && <Projectile3D key={proj.id} projectile={proj} position={to3D(proj.position.x, proj.position.y)} />
            ))}
        </>
    );
};

const GameRenderer3D: React.FC<GameRenderer3DProps> = (props) => {
    // Input handling remains in App.tsx, passed via props
    // But we need to attach listeners if we want to support input here? 
    // Actually App.tsx handles window listeners, so we are good.

    // Re-attach listeners just in case, or rely on App.tsx?
    // The original GameRenderer attached listeners. Let's do the same.
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => props.onKeyDown(e.code);
        const handleKeyUp = (e: KeyboardEvent) => props.onKeyUp(e.code);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [props.onKeyDown, props.onKeyUp]);

    return (
        <ErrorBoundary>
            <div style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, background: '#212121ff' }}>
                <Canvas shadows>
                    <OrthographicCamera makeDefault position={[0, 100, 20]} zoom={40} />
                    <OrbitControls enableRotate={false} enableZoom={false} />
                    <Suspense fallback={null}>
                        <GameScene {...props} />
                    </Suspense>
                </Canvas>
            </div>
        </ErrorBoundary>
    );
};

export default GameRenderer3D;
