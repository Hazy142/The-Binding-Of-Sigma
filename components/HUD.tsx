import React from 'react';
import { GameStats, Room } from '../types';
import { COLOR_ITEM_ROOM } from '../constants';

/**
 * Props for the HUD component.
 */
interface HUDProps {
  /** The current player statistics (Damage, Speed, etc.). */
  stats: GameStats;
  /** The room the player is currently in. */
  currentRoom: Room;
  /** List of all rooms in the dungeon (for the minimap). */
  rooms: Room[];
  /** Current player health. */
  health: number;
  /** Maximum player health. */
  maxHealth: number;
}

/**
 * Heads-Up Display (HUD) component.
 * Renders the player's health (hearts), current stats, and a minimap of the dungeon.
 *
 * @param {HUDProps} props - The component props.
 * @returns {JSX.Element} The rendered HUD overlay.
 */
const HUD: React.FC<HUDProps> = ({ stats, currentRoom, rooms, health, maxHealth }) => {
  return (
    <div className="absolute top-0 left-0 w-full p-4 flex justify-between pointer-events-none text-white">
      {/* Stats / Health */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-1">
          {Array.from({ length: Math.ceil(maxHealth / 2) }).map((_, i) => {
             // 1 Heart = 2 HP units.
             const heartValue = (i + 1) * 2;
             const isFull = health >= heartValue;
             const isHalf = health === heartValue - 1;
             
             return (
               <span key={i} className="text-3xl drop-shadow-md">
                 {isFull ? '❤️' : isHalf ? '💔' : '🖤'}
               </span>
             )
          })}
        </div>
        <div className="bg-black/50 p-2 rounded text-xs font-mono border border-gray-700">
           <div className="text-red-400">DMG(Rizz): {stats.rizz.toFixed(1)}</div>
           <div className="text-blue-400">SPD(Zoom): {stats.speed.toFixed(1)}</div>
           <div className="text-yellow-400">TRS(Yap): {(100 / stats.tears).toFixed(1)}/s</div>
        </div>
      </div>

      {/* Minimap */}
      <div className="bg-black/30 p-2 rounded">
        <div className="grid relative" style={{ width: '100px', height: '100px' }}>
           {rooms.map(r => {
             // Simple offset map logic
             const centerX = 50;
             const centerY = 50;
             const size = 12;
             const gap = 2;
             const x = centerX + (r.gridX * (size + gap));
             const y = centerY + (r.gridY * (size + gap));

             const isCurrent = r.id === currentRoom.id;
             
             // Color logic: Boss = Red, Item Room = Gold, Cleared = Gray, Visited = Dark Gray
             let color = 'bg-gray-600';
             if (r.isBossRoom) color = 'bg-red-600';
             else if (r.isItemRoom) color = 'bg-yellow-500';
             else if (r.cleared) color = 'bg-gray-400';

             const border = isCurrent ? 'border-2 border-white' : '';

             return (
               <div 
                 key={r.id}
                 className={`absolute ${color} ${border}`}
                 style={{ 
                   width: size, 
                   height: size, 
                   left: x, 
                   top: y 
                  }}
               />
             );
           })}
        </div>
      </div>
    </div>
  );
};

export default HUD;