
/** The width of the game canvas in pixels. */
export const CANVAS_WIDTH = 800;
/** The height of the game canvas in pixels. */
export const CANVAS_HEIGHT = 600;
/** The size of a grid tile in pixels (used for map generation visualization). */
export const TILE_SIZE = 40;

/** The diameter of the player entity in pixels. */
export const PLAYER_SIZE = 30;
/** The diameter of projectile entities in pixels. */
export const PROJECTILE_SIZE = 10;
/** The standard diameter of enemy entities in pixels. */
export const ENEMY_SIZE = 35;
/** The diameter of item entities in pixels. */
export const ITEM_SIZE = 25;

/** The base movement speed of the player in pixels per frame. */
export const PLAYER_BASE_SPEED = 3.5;
/** The speed of projectiles in pixels per frame. */
export const PROJECTILE_SPEED = 7;
/** The base movement speed of enemies in pixels per frame. */
export const ENEMY_SPEED = 1.5;

// Colors
/** Background color for the dungeon floor (Basement brown). */
export const COLOR_BG = '#2e211b'; // Basement brown
/** Color for the walls. */
export const COLOR_WALL = '#1a120e';
/** Color for the doors. */
export const COLOR_DOOR = '#4a3b32';
/** Color for the player character (Pale Isaac skin). */
export const COLOR_PLAYER = '#e8bfb5'; // Pale Isaac skin
/** Color for player tears (projectiles). */
export const COLOR_TEAR = '#8ae5ff'; // Blue tear
/** Base color for standard enemies. */
export const COLOR_ENEMY = '#ff4d4d';
/** Base color for the boss enemy. */
export const COLOR_BOSS = '#590000';
/** Color for items. */
export const COLOR_ITEM = '#ffd700';
/** Color indicator for item rooms. */
export const COLOR_ITEM_ROOM = '#ffd700';

// Enemy Variant Colors
/** Color for Shooter type enemies (Purple). */
export const COLOR_ENEMY_SHOOTER = '#a855f7'; // Purple
/** Color for Dasher type enemies (Yellow). */
export const COLOR_ENEMY_DASHER = '#facc15'; // Yellow
/** Color for Tank type enemies (Dark Green). */
export const COLOR_ENEMY_TANK = '#14532d'; // Dark Green

// Gen Alpha Flavor Text
/**
 * Collection of flavor text strings used in various game states, themed around Gen Alpha slang.
 */
export const FLAVOR_TEXT = {
  /** Messages displayed on death. */
  DEATH: ["L + Ratio", "Skill Issue", "You got Fanum Taxed", "Not very Sigma of you", "Go touch grass"],
  /** Messages displayed on victory. */
  WIN: ["Absolute Gigachad", "W Rizz", "Main Character Energy", "Mogged the dungeon"],
  /** Message displayed at game start. */
  START: "Enter the Ohio Dungeon"
};

/** List of all available item types in the game. */
export const ITEM_TYPES = ['HEALTH', 'DAMAGE', 'SPEED', 'TRIPLE_SHOT', 'PIERCING', 'BIG_TEARS'] as const;
