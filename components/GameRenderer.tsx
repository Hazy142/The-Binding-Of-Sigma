
import React, { useEffect, useRef, useState } from 'react';
import { Entity, Room, Vector2, Direction, Projectile, Item } from '../types';
import { 
  CANVAS_WIDTH, CANVAS_HEIGHT, COLOR_BG, COLOR_WALL, COLOR_DOOR, 
  COLOR_PLAYER, COLOR_TEAR, COLOR_ENEMY, COLOR_BOSS, COLOR_ITEM, 
  COLOR_ENEMY_SHOOTER, COLOR_ENEMY_DASHER, COLOR_ENEMY_TANK,
  PLAYER_SIZE, ENEMY_SIZE, PROJECTILE_SIZE, ITEM_SIZE 
} from '../constants';

/**
 * Props for the GameRenderer component.
 */
interface GameRendererProps {
  /** The player entity to render. */
  player: Entity;
  /** The current room data (walls, enemies, items). */
  currentRoom: Room;
  /** List of active projectiles to render. */
  projectiles: Projectile[];
  /** Callback for key down events (forwarded from window listeners). */
  onKeyDown: (key: string) => void;
  /** Callback for key up events (forwarded from window listeners). */
  onKeyUp: (key: string) => void;
}

// Asset Paths
const ASSETS = {
  player: '/assets/characters/player/player1_',
  enemyBasic: '/assets/characters/enemy_basic/char01_',
  enemyShooter: '/assets/characters/enemy_shooter/char02_',
  enemyDasher: '/assets/characters/enemy_dasher/char03_',
  enemyTank: '/assets/characters/enemy_tank/char04_',
  floor: '/assets/environment/floors/ground02_0001.png', // Main floor tile
  floorVariations: [
    '/assets/environment/floors/ground02_0000.png',
    '/assets/environment/floors/ground02_0001.png',
    '/assets/environment/floors/ground02_0002.png',
    '/assets/environment/floors/ground02_0003.png',
    '/assets/environment/floors/ground02_0004.png',
    '/assets/environment/floors/ground02_0005.png',
    '/assets/environment/floors/ground02_0006.png',
    '/assets/environment/floors/ground02_0007.png'
  ],
  walls: {
      v: '/assets/environment/walls/wallStone01_0004.png', // Vertical (Side)
      h: '/assets/environment/walls/wallStone01_0001.png', // Horizontal (Top/Bottom)
      corner: '/assets/environment/walls/wallStone01_0000.png' // Corner? Just guessing or reusing
  },
  door: {
      closed: '/assets/environment/doors/doorA0001.png', // Using one sprite for now
      open: '/assets/environment/doors/doorA0000.png'
  }
};

/**
 * Helper to get sprite path based on facing.
 * Format: path + 000X + .png
 */
const getSpritePath = (base: string, facing: number) => {
    return `${base}000${facing}.png`;
};

/**
 * Renders the game world onto a generic HTML5 Canvas.
 * Handles the main render loop using requestAnimationFrame and manages input event listeners.
 *
 * @param {GameRendererProps} props - The component props.
 * @returns {JSX.Element} A canvas element containing the game visual.
 */
const GameRenderer: React.FC<GameRendererProps> = ({ 
  player, 
  currentRoom, 
  projectiles, 
  onKeyDown, 
  onKeyUp 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());

  // Load Assets
  useEffect(() => {
    const loadImages = async () => {
        const pathsToLoad: string[] = [];

        // Characters (0-7)
        for(let i=0; i<8; i++) {
            pathsToLoad.push(getSpritePath(ASSETS.player, i));
            pathsToLoad.push(getSpritePath(ASSETS.enemyBasic, i));
            pathsToLoad.push(getSpritePath(ASSETS.enemyShooter, i));
            pathsToLoad.push(getSpritePath(ASSETS.enemyDasher, i));
            pathsToLoad.push(getSpritePath(ASSETS.enemyTank, i));
        }

        // Environment
        ASSETS.floorVariations.forEach(p => pathsToLoad.push(p));
        pathsToLoad.push(ASSETS.walls.v);
        pathsToLoad.push(ASSETS.walls.h);
        pathsToLoad.push(ASSETS.door.closed);
        pathsToLoad.push(ASSETS.door.open);

        const promises = pathsToLoad.map(path => {
            return new Promise<void>((resolve, reject) => {
                const img = new Image();
                img.src = path;
                img.onload = () => {
                    imageCache.current.set(path, img);
                    resolve();
                };
                img.onerror = () => {
                    console.warn(`Failed to load asset: ${path}`);
                    resolve(); // Continue anyway
                };
            });
        });

        await Promise.all(promises);
        setImagesLoaded(true);
    };
    loadImages();
  }, []);

  // Input listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => onKeyDown(e.code);
    const handleKeyUp = (e: KeyboardEvent) => onKeyUp(e.code);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onKeyDown, onKeyUp]);

  // Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      // Clear Screen
      ctx.fillStyle = '#1a1a1a'; // Darker background for outside room
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      if (!imagesLoaded) {
          ctx.fillStyle = 'white';
          ctx.fillText("Loading Assets...", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
          animationFrameId = requestAnimationFrame(render);
          return;
      }

      // --- Draw Environment ---

      const WALL_THICKNESS = 50;
      const START_X = WALL_THICKNESS;
      const START_Y = WALL_THICKNESS;
      const ROOM_W = CANVAS_WIDTH - WALL_THICKNESS * 2;
      const ROOM_H = CANVAS_HEIGHT - WALL_THICKNESS * 2;

      // Draw Floor (Tiled)
      const floorImg = imageCache.current.get(ASSETS.floor);
      if (floorImg) {
          const pattern = ctx.createPattern(floorImg, 'repeat');
          if (pattern) {
              ctx.fillStyle = pattern;
              ctx.save();
              ctx.translate(START_X, START_Y);
              ctx.fillRect(0, 0, ROOM_W, ROOM_H);
              ctx.restore();
          }
      } else {
          ctx.fillStyle = COLOR_BG;
          ctx.fillRect(START_X, START_Y, ROOM_W, ROOM_H);
      }

      // Draw Walls (Perimeter)
      // Top & Bottom
      const wallH = imageCache.current.get(ASSETS.walls.h);
      if (wallH) {
         for(let x = 0; x < CANVAS_WIDTH; x += 64) {
             ctx.drawImage(wallH, x, 0, 64, WALL_THICKNESS); // Top
             ctx.drawImage(wallH, x, CANVAS_HEIGHT - WALL_THICKNESS, 64, WALL_THICKNESS); // Bottom
         }
      }

      // Left & Right
      const wallV = imageCache.current.get(ASSETS.walls.v);
      if (wallV) {
         for(let y = 0; y < CANVAS_HEIGHT; y += 64) {
             ctx.drawImage(wallV, 0, y, WALL_THICKNESS, 64); // Left
             ctx.drawImage(wallV, CANVAS_WIDTH - WALL_THICKNESS, y, WALL_THICKNESS, 64); // Right
         }
      }

      // Draw Doors
      const doorSize = 80;
      const doorImgClosed = imageCache.current.get(ASSETS.door.closed);
      const doorImgOpen = imageCache.current.get(ASSETS.door.open);
      
      // Logic: If room cleared, use Open sprite? Or generic visual for "Open Doorway"?
      // For now, let's use the door sprite.
      // Note: Door sprites usually have specific orientation.
      // Assuming 'doorA0001' is generic closed, 'doorA0000' is generic open.
      const doorSprite = currentRoom.cleared ? doorImgOpen : doorImgClosed;

      if (doorSprite) {
        if (currentRoom.doors[Direction.UP]) {
            ctx.drawImage(doorSprite, (CANVAS_WIDTH - doorSize)/2, 0, doorSize, 60);
        }
        if (currentRoom.doors[Direction.DOWN]) {
            ctx.drawImage(doorSprite, (CANVAS_WIDTH - doorSize)/2, CANVAS_HEIGHT - 60, doorSize, 60);
        }
        if (currentRoom.doors[Direction.LEFT]) {
            ctx.save();
            ctx.translate(60, (CANVAS_HEIGHT - doorSize)/2 + doorSize);
            ctx.rotate(-Math.PI/2);
            ctx.drawImage(doorSprite, 0, 0, doorSize, 60);
            ctx.restore();
        }
        if (currentRoom.doors[Direction.RIGHT]) {
            ctx.save();
            ctx.translate(CANVAS_WIDTH - 60, (CANVAS_HEIGHT - doorSize)/2);
            ctx.rotate(Math.PI/2);
            ctx.drawImage(doorSprite, 0, 0, doorSize, 60);
            ctx.restore();
        }
      }


      // Draw Items
      currentRoom.items.forEach(item => {
        if (item.isActive) {
          ctx.save();
          
          // Float Animation
          const floatY = Math.sin(Date.now() / 300) * 5;
          ctx.translate(item.position.x, item.position.y + floatY);
          
          // Glow effect
          ctx.shadowBlur = 20;
          ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';

          // --- UNIQUE ITEM RENDERING (Canvas Fallbacks for Memes) ---
          
          if (item.itemType === 'HEALTH') {
            // HEART
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            const s = ITEM_SIZE / 2;
            ctx.moveTo(0, s * 0.3);
            ctx.bezierCurveTo(s, -s * 0.5, s * 2, s * 0.5, 0, s * 1.5);
            ctx.bezierCurveTo(-s * 2, s * 0.5, -s, -s * 0.5, 0, s * 0.3);
            ctx.fill();
            ctx.fillStyle = '#fff'; // Shine
            ctx.beginPath();
            ctx.arc(-5, -5, 3, 0, Math.PI * 2);
            ctx.fill();

          } else if (item.itemType === 'DAMAGE') {
            // GRIMACE SHAKE (Purple Cup)
            ctx.fillStyle = '#7e22ce'; // Purple
            ctx.beginPath();
            ctx.moveTo(-10, -15);
            ctx.lineTo(10, -15);
            ctx.lineTo(8, 15);
            ctx.lineTo(-8, 15);
            ctx.fill();
            // Whipped Cream
            ctx.fillStyle = '#f3e8ff';
            ctx.beginPath();
            ctx.arc(0, -15, 10, Math.PI, 0);
            ctx.fill();
            // Straw
            ctx.strokeStyle = '#16a34a';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(5, -15);
            ctx.lineTo(10, -25);
            ctx.stroke();

          } else if (item.itemType === 'SPEED') {
            // ENERGY DRINK
            ctx.fillStyle = '#1e40af'; // Blue Can
            ctx.fillRect(-8, -15, 16, 30);
            ctx.fillStyle = '#bfdbfe'; // Lid
            ctx.fillRect(-8, -15, 16, 4);
            // Lightning Bolt Label
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.moveTo(2, -8);
            ctx.lineTo(-4, 0);
            ctx.lineTo(0, 0);
            ctx.lineTo(-2, 8);
            ctx.lineTo(4, 0);
            ctx.lineTo(0, 0);
            ctx.fill();

          } else if (item.itemType === 'TRIPLE_SHOT') {
            // THREE ORBS
            ctx.fillStyle = '#60a5fa';
            const orbSize = 6;
            // Top
            ctx.beginPath(); ctx.arc(0, -10, orbSize, 0, Math.PI*2); ctx.fill();
            // Left
            ctx.beginPath(); ctx.arc(-10, 8, orbSize, 0, Math.PI*2); ctx.fill();
            // Right
            ctx.beginPath(); ctx.arc(10, 8, orbSize, 0, Math.PI*2); ctx.fill();
            
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0,0, 12, 0, Math.PI*2);
            ctx.stroke();

          } else if (item.itemType === 'PIERCING') {
            // FANUM'S FORK
            ctx.fillStyle = '#94a3b8'; // Silver
            // Handle
            ctx.fillRect(-2, 0, 4, 15);
            // Base
            ctx.fillRect(-8, -5, 16, 5);
            // Tines
            ctx.fillRect(-8, -20, 3, 15);
            ctx.fillRect(-1.5, -20, 3, 15);
            ctx.fillRect(5, -20, 3, 15);

          } else if (item.itemType === 'BIG_TEARS') {
            // MOGGER MODE (Jawline / Flex)
            ctx.fillStyle = '#000'; // Sunglasses
            ctx.fillRect(-12, -5, 10, 6);
            ctx.fillRect(2, -5, 10, 6);
            ctx.fillRect(0, -3, 2, 2); // Bridge
            // Jawline
            ctx.strokeStyle = '#e8bfb5';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-15, -5);
            ctx.lineTo(-10, 10);
            ctx.lineTo(0, 15); // Chin
            ctx.lineTo(10, 10);
            ctx.lineTo(15, -5);
            ctx.stroke();

          } else {
             // FALLBACK
             ctx.fillStyle = COLOR_ITEM;
             ctx.beginPath();
             ctx.arc(0, 0, ITEM_SIZE / 2, 0, Math.PI * 2);
             ctx.fill();
             ctx.fillStyle = '#000';
             ctx.font = 'bold 16px monospace';
             ctx.textAlign = 'center';
             ctx.textBaseline = 'middle';
             ctx.fillText('?', 0, 0);
          }
          
          ctx.restore();
        }
      });

      // Draw Enemies
      let activeBoss: Entity | null = null;

      currentRoom.enemies.forEach(enemy => {
        if (!enemy.isActive) return;
        if (enemy.type === 'BOSS') activeBoss = enemy;

        ctx.save();
        
        // Simple wobble animation
        // const wobble = Math.sin(Date.now() / 200) * 2;
        // ctx.translate(enemy.position.x, enemy.position.y + wobble);
        ctx.translate(enemy.position.x, enemy.position.y);

        let color = COLOR_ENEMY;
        let size = enemy.size;

        if (enemy.type === 'BOSS') {
            // ... Boss rendering (Custom) ...
            color = COLOR_BOSS;
            size = enemy.size * 1.5;
            ctx.scale(1.5, 1.5);
            
            // SKULL KING (Canvas)
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(0, -10, size/2, 0, Math.PI, true);
            ctx.lineTo(size/2, 15);
            ctx.quadraticCurveTo(0, 25, -size/2, 15);
            ctx.lineTo(-size/2, -10);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.ellipse(-12, -5, 8, 10, -0.2, 0, Math.PI*2);
            ctx.ellipse(12, -5, 8, 10, 0.2, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = '#ff0000';
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'red';
            ctx.beginPath();
            ctx.arc(-12, -5, 3, 0, Math.PI*2);
            ctx.arc(12, -5, 3, 0, Math.PI*2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.moveTo(0, 5);
            ctx.lineTo(-4, 12);
            ctx.lineTo(4, 12);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.fillRect(-10, 18, 4, 6);
            ctx.fillRect(-4, 18, 4, 6);
            ctx.fillRect(2, 18, 4, 6);
            ctx.fillRect(8, 18, 4, 6);

        } else {
            // SPRITE ENEMIES
            let basePath = ASSETS.enemyBasic;
            if (enemy.variant === 'SHOOTER') basePath = ASSETS.enemyShooter;
            if (enemy.variant === 'DASHER') basePath = ASSETS.enemyDasher;
            if (enemy.variant === 'TANK') basePath = ASSETS.enemyTank;

            const spritePath = getSpritePath(basePath, enemy.facing);
            const img = imageCache.current.get(spritePath);
            
            if (img) {
                // Determine scale (sprites might be large)
                // Assuming sprites are reasonably sized, but let's constrain them to size * 2 for visual pop
                const drawSize = size * 2.5;
                ctx.drawImage(img, -drawSize/2, -drawSize/2 - 20, drawSize, drawSize); // -20 offset for pseudo-3D anchor at feet
            } else {
                // Fallback
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(0, 0, size/2, 0, Math.PI*2);
                ctx.fill();
            }
        }

        ctx.restore();
      });

      // Draw Player
      ctx.save();
      ctx.translate(player.position.x, player.position.y);
      
      const playerSpritePath = getSpritePath(ASSETS.player, player.facing);
      const playerImg = imageCache.current.get(playerSpritePath);
      
      if (playerImg) {
          const drawSize = player.size * 2.5;
          ctx.drawImage(playerImg, -drawSize/2, -drawSize/2 - 20, drawSize, drawSize);
      } else {
          // Fallback
          ctx.fillStyle = COLOR_PLAYER;
          ctx.beginPath();
          ctx.arc(0, 0, PLAYER_SIZE / 2, 0, Math.PI * 2);
          ctx.fill();
      }

      ctx.restore();

      // Draw Projectiles
      projectiles.forEach(proj => {
        if (proj.isActive) {
          ctx.fillStyle = proj.owner === 'PLAYER' ? COLOR_TEAR : '#ff0000';
          ctx.beginPath();
          ctx.arc(proj.position.x, proj.position.y, proj.size / 2, 0, Math.PI * 2);
          ctx.fill();
          
          // Projectile Shine
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          ctx.beginPath();
          ctx.arc(proj.position.x - proj.size/4, proj.position.y - proj.size/4, proj.size/5, 0, Math.PI*2);
          ctx.fill();
        }
      });

      // --- UI OVERLAYS ---

      // Boss Health Bar (Cinematic Style)
      if (activeBoss) {
          const boss = activeBoss as Entity;
          const barWidth = CANVAS_WIDTH * 0.6;
          const barHeight = 20;
          const barX = (CANVAS_WIDTH - barWidth) / 2;
          const barY = CANVAS_HEIGHT - 50;
          const hpPct = Math.max(0, boss.health / boss.maxHealth);

          // Background
          ctx.fillStyle = '#111';
          ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
          
          // Red Fill
          ctx.fillStyle = '#800';
          ctx.fillRect(barX, barY, barWidth, barHeight);
          ctx.fillStyle = '#f00';
          ctx.fillRect(barX, barY, barWidth * hpPct, barHeight);

          // Skull Icon
          ctx.font = '20px sans-serif';
          ctx.fillStyle = '#fff';
          ctx.textAlign = 'center';
          ctx.fillText('☠️ ALPHA SIGMA BOSS ☠️', CANVAS_WIDTH / 2, barY - 10);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [player, currentRoom, projectiles, imagesLoaded]);

  return (
    <canvas 
      ref={canvasRef} 
      width={CANVAS_WIDTH} 
      height={CANVAS_HEIGHT} 
      className="rounded-lg shadow-2xl border-4 border-gray-800 bg-black cursor-none"
    />
  );
};

export default GameRenderer;
