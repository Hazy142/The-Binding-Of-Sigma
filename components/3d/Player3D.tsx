import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { Entity } from '../../types';
import { loadOBJModel, CHARACTER_MODELS } from '../../utils/OBJLoader';

interface Player3DProps {
    player: Entity;
    position: [number, number, number];
}

export const Player3D: React.FC<Player3DProps> = ({ player, position }) => {
    const group = useRef<Group>(null);
    const [model, setModel] = useState<Group | null>(null);

    useEffect(() => {
        loadOBJModel(CHARACTER_MODELS.PLAYER)
            .then((loadedModel) => {
                setModel(loadedModel);
            })
            .catch((error) => {
                console.error('Failed to load player model:', error);
            });
    }, []);

    useFrame(() => {
        if (group.current) {
            group.current.position.set(position[0], position[1], position[2]);
            // Rotate based on facing (facing is in radians)
            group.current.rotation.y = player.facing - Math.PI / 23;
            group.current.rotation.x = 100;
        }
    });

    if (!model) {
        return null; // Or a loading placeholder
    }

    return (
        <group ref={group} dispose={null}>
            <primitive object={model.clone()} scale={0.5} />
        </group>
    );
};
