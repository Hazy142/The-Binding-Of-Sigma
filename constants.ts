
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const TILE_SIZE = 40;

export const PLAYER_SIZE = 30;
export const PROJECTILE_SIZE = 10;
export const ENEMY_SIZE = 35;
export const ITEM_SIZE = 25;

export const PLAYER_BASE_SPEED = 3.5;
export const PROJECTILE_SPEED = 7;
export const ENEMY_SPEED = 1.5;

// Colors
export const COLOR_BG = '#2e211b'; // Basement brown
export const COLOR_WALL = '#1a120e';
export const COLOR_DOOR = '#4a3b32';
export const COLOR_PLAYER = '#e8bfb5'; // Pale Isaac skin
export const COLOR_TEAR = '#8ae5ff'; // Blue tear
export const COLOR_ENEMY = '#ff4d4d';
export const COLOR_BOSS = '#590000';
export const COLOR_ITEM = '#ffd700';
export const COLOR_ITEM_ROOM = '#ffd700';

// Enemy Variant Colors
export const COLOR_ENEMY_SHOOTER = '#a855f7'; // Purple
export const COLOR_ENEMY_DASHER = '#facc15'; // Yellow
export const COLOR_ENEMY_TANK = '#14532d'; // Dark Green

// Gen Alpha Flavor Text
export const FLAVOR_TEXT = {
  DEATH: ["L + Ratio", "Skill Issue", "You got Fanum Taxed", "Not very Sigma of you", "Go touch grass"],
  WIN: ["Absolute Gigachad", "W Rizz", "Main Character Energy", "Mogged the dungeon"],
  START: "Enter the Ohio Dungeon"
};

export const ITEM_TYPES = ['HEALTH', 'DAMAGE', 'SPEED', 'TRIPLE_SHOT', 'PIERCING', 'BIG_TEARS'] as const;
