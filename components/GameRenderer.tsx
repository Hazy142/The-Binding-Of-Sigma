
import React, { useEffect, useRef } from 'react';
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
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw Room Floor
      ctx.fillStyle = COLOR_BG;
      ctx.fillRect(50, 50, CANVAS_WIDTH - 100, CANVAS_HEIGHT - 100);

      // Draw Walls (Visual only, logic handled in parent)
      ctx.strokeStyle = COLOR_WALL;
      ctx.lineWidth = 10;
      ctx.strokeRect(50, 50, CANVAS_WIDTH - 100, CANVAS_HEIGHT - 100);

      // Draw Doors
      const doorSize = 60;
      ctx.fillStyle = currentRoom.cleared ? COLOR_DOOR : '#2a2a2a'; // Locked vs Open visual
      
      if (currentRoom.doors[Direction.UP]) ctx.fillRect((CANVAS_WIDTH / 2) - (doorSize / 2), 20, doorSize, 40);
      if (currentRoom.doors[Direction.DOWN]) ctx.fillRect((CANVAS_WIDTH / 2) - (doorSize / 2), CANVAS_HEIGHT - 60, doorSize, 40);
      if (currentRoom.doors[Direction.LEFT]) ctx.fillRect(20, (CANVAS_HEIGHT / 2) - (doorSize / 2), 40, doorSize);
      if (currentRoom.doors[Direction.RIGHT]) ctx.fillRect(CANVAS_WIDTH - 60, (CANVAS_HEIGHT / 2) - (doorSize / 2), 40, doorSize);

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

          // --- UNIQUE ITEM RENDERING ---
          
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
        const wobble = Math.sin(Date.now() / 200) * 2;
        ctx.translate(enemy.position.x, enemy.position.y + wobble);

        let color = COLOR_ENEMY;
        let size = enemy.size;

        if (enemy.type === 'BOSS') {
            color = COLOR_BOSS;
            size = enemy.size * 1.5; // Visual scale
            ctx.scale(1.5, 1.5); // Scale the context for boss
        } else if (enemy.variant === 'SHOOTER') {
            color = COLOR_ENEMY_SHOOTER;
        } else if (enemy.variant === 'DASHER') {
            color = COLOR_ENEMY_DASHER;
        } else if (enemy.variant === 'TANK') {
            color = COLOR_ENEMY_TANK;
        }

        // --- SKINS ---
        
        if (enemy.variant === 'SHOOTER') {
            // CULTIST / WIZARD
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(0, -size/2);
            ctx.lineTo(size/2, size/2);
            ctx.lineTo(-size/2, size/2);
            ctx.fill();

            // Hood Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.moveTo(0, -size/2 + 5);
            ctx.lineTo(size/4, size/2);
            ctx.lineTo(-size/4, size/2);
            ctx.fill();

            // Cyclops Eye
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(0, -2, 5, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(0, -2, 2, 0, Math.PI*2);
            ctx.fill();

        } else if (enemy.variant === 'DASHER') {
            // SPIKE / HORNET
            ctx.fillStyle = color;
            // Diamond body
            ctx.beginPath();
            ctx.moveTo(0, -size/2);
            ctx.lineTo(size/2, 0);
            ctx.lineTo(0, size/2);
            ctx.lineTo(-size/2, 0);
            ctx.fill();

            // Spikes/Wings
            ctx.fillStyle = '#b45309'; // Dark orange/brown
            ctx.beginPath();
            ctx.moveTo(-size/2, 0);
            ctx.lineTo(-size, -10); // Wing tip left
            ctx.lineTo(-size/2 + 5, -5);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(size/2, 0);
            ctx.lineTo(size, -10); // Wing tip right
            ctx.lineTo(size/2 - 5, -5);
            ctx.fill();

            // Angry Eyes
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.moveTo(-8, -5);
            ctx.lineTo(-2, 0); 
            ctx.lineTo(-8, 2);
            ctx.moveTo(8, -5);
            ctx.lineTo(2, 0); 
            ctx.lineTo(8, 2);
            ctx.fill();

        } else if (enemy.variant === 'TANK') {
            // BLOCKY GOLEM
            ctx.fillStyle = color;
            // Main body
            ctx.fillRect(-size/2, -size/2, size, size);
            
            // Armor Plates
            ctx.strokeStyle = '#0f3d1e';
            ctx.lineWidth = 2;
            ctx.strokeRect(-size/2 + 4, -size/2 + 4, size - 8, size - 8);

            // Rivets
            ctx.fillStyle = '#0f3d1e';
            const r = 3;
            ctx.fillRect(-size/2 + 2, -size/2 + 2, r, r);
            ctx.fillRect(size/2 - 5, -size/2 + 2, r, r);
            ctx.fillRect(-size/2 + 2, size/2 - 5, r, r);
            ctx.fillRect(size/2 - 5, size/2 - 5, r, r);

            // Visor
            ctx.fillStyle = '#000';
            ctx.fillRect(-10, -4, 20, 6);
            ctx.fillStyle = 'red';
            ctx.fillRect(-2, -4, 4, 6); // Cylon eye

        } else if (enemy.type === 'BOSS') {
            // SKULL KING
            ctx.fillStyle = color; // Dark Red
            
            // Skull Shape
            ctx.beginPath();
            ctx.arc(0, -10, size/2, 0, Math.PI, true); // Cranium
            ctx.lineTo(size/2, 15); // Jaw Right
            ctx.quadraticCurveTo(0, 25, -size/2, 15); // Jaw Bottom
            ctx.lineTo(-size/2, -10); // Jaw Left
            ctx.fill();

            // Eye Sockets
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.ellipse(-12, -5, 8, 10, -0.2, 0, Math.PI*2);
            ctx.ellipse(12, -5, 8, 10, 0.2, 0, Math.PI*2);
            ctx.fill();

            // Glowing Red Pupils
            ctx.fillStyle = '#ff0000';
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'red';
            ctx.beginPath();
            ctx.arc(-12, -5, 3, 0, Math.PI*2);
            ctx.arc(12, -5, 3, 0, Math.PI*2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Nose
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.moveTo(0, 5);
            ctx.lineTo(-4, 12);
            ctx.lineTo(4, 12);
            ctx.fill();

            // Teeth
            ctx.fillStyle = '#fff';
            ctx.fillRect(-10, 18, 4, 6);
            ctx.fillRect(-4, 18, 4, 6);
            ctx.fillRect(2, 18, 4, 6);
            ctx.fillRect(8, 18, 4, 6);

        } else {
            // BASIC BLOB
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(0, 0, size/2, 0, Math.PI*2);
            ctx.fill();

            // Dead Eyes
            ctx.fillStyle = '#000';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('x  x', 0, -2);
            
            // Mouth
            ctx.beginPath();
            ctx.arc(0, 8, 4, 0, Math.PI, true); // Frown
            ctx.stroke();
        }

        ctx.restore();
      });

      // Draw Player
      ctx.save();
      ctx.translate(player.position.x, player.position.y);
      
      ctx.fillStyle = COLOR_PLAYER;
      // Head
      ctx.beginPath();
      ctx.arc(0, 0, PLAYER_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();
      // Body
      ctx.fillStyle = '#e8bfb5';
      ctx.fillRect(-10, 10, 20, 12);
      
      // Tears (Eyes)
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(-6, -2, 4, 0, Math.PI * 2);
      ctx.arc(6, -2, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Reflection in eyes (Cute factor)
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-5, -3, 1.5, 0, Math.PI * 2);
      ctx.arc(7, -3, 1.5, 0, Math.PI * 2);
      ctx.fill();

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
  }, [player, currentRoom, projectiles]);

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
