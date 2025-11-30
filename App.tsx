
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Entity, Room, GameState, Direction, Vector2, Projectile, GameStats, Item, ItemType 
} from './types';
import { 
  CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_SIZE, PLAYER_BASE_SPEED, 
  PROJECTILE_SPEED, TILE_SIZE, FLAVOR_TEXT, PROJECTILE_SIZE, 
  ENEMY_SIZE, ENEMY_SPEED, ITEM_SIZE, ITEM_TYPES 
} from './constants';
import GameRenderer from './components/GameRenderer';
import HUD from './components/HUD';
import Joystick from './components/Joystick';
import { generateItemDescription, generateBossTaunt } from './services/geminiService';

// --- Utilities ---
/**
 * Calculates the Euclidean distance between two points.
 * @param {Vector2} a - The first point.
 * @param {Vector2} b - The second point.
 * @returns {number} The distance between a and b.
 */
const getDistance = (a: Vector2, b: Vector2) => Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));

/**
 * Checks if two entities are colliding based on their positions and sizes (circle collision).
 * @param {Entity} a - The first entity.
 * @param {Entity} b - The second entity.
 * @returns {boolean} True if the entities overlap, false otherwise.
 */
const checkCollision = (a: Entity, b: Entity) => {
  const dist = getDistance(a.position, b.position);
  return dist < (a.size / 2 + b.size / 2);
};

/**
 * Calculates the 8-way direction index (0-7) from a velocity vector.
 */
const getFacingFromVelocity = (vx: number, vy: number, currentFacing: number): number => {
    if (Math.abs(vx) < 0.1 && Math.abs(vy) < 0.1) return currentFacing;

    // Angle in radians, 0 is East, increasing clockwise (since Y is down)
    const angle = Math.atan2(vy, vx);
    let deg = angle * (180 / Math.PI);
    if (deg < 0) deg += 360;

    const index = Math.floor(((deg + 22.5) % 360) / 45);

    // 0(East) -> 6, 2(South) -> 0, 4(West) -> 2, 6(North) -> 4
    return (index - 2 + 8) % 8;
};

// --- Initial State Generators ---

/**
 * Creates a new player entity with default starting stats.
 * @returns {Entity} The initialized player entity.
 */
const createPlayer = (): Entity => ({
  id: 'player',
  type: 'PLAYER',
  position: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
  velocity: { x: 0, y: 0 },
  size: PLAYER_SIZE,
  color: 'pink',
  health: 6, // 3 Hearts
  maxHealth: 6,
  damage: 3.5,
  speed: PLAYER_BASE_SPEED,
  isActive: true,
  modifiers: [],
  facing: 0
});

/**
 * Generates a dungeon layout with a specified number of rooms.
 * Uses a random walk algorithm to place rooms, ensuring connectivity.
 * Also assigns special rooms (Boss, Item).
 *
 * @param {number} targetCount - The number of rooms to generate.
 * @returns {Room[]} An array of generated Room objects, linked by coordinates.
 */
const generateDungeon = (targetCount: number): Room[] => {
  const rooms: Room[] = [];
  const visited = new Map<string, {x: number, y: number}>();
  
  // Start at 0,0
  visited.set("0,0", {x: 0, y: 0});
  
  let candidates = [{x: 0, y: 0}];

  while (visited.size < targetCount) {
    if (candidates.length === 0) break; 
    
    const parentIdx = Math.floor(Math.random() * candidates.length);
    const parent = candidates[parentIdx];
    
    const dirs = [
        {dx: 0, dy: -1}, {dx: 0, dy: 1}, {dx: -1, dy: 0}, {dx: 1, dy: 0}
    ];
    dirs.sort(() => Math.random() - 0.5);
    
    for (const dir of dirs) {
        const nx = parent.x + dir.dx;
        const ny = parent.y + dir.dy;
        const id = `${nx},${ny}`;
        
        if (!visited.has(id)) {
            visited.set(id, {x: nx, y: ny});
            candidates.push({x: nx, y: ny});
            break; 
        }
    }
  }
  
  // Identify Boss Room (furthest)
  let maxDist = -1;
  let bossId = "";
  
  visited.forEach((pos, id) => {
      const dist = Math.abs(pos.x) + Math.abs(pos.y);
      if (dist > maxDist && id !== "0,0") {
          maxDist = dist;
          bossId = id;
      }
  });

  // Identify Item Room (Random non-start, non-boss)
  const possibleItemRooms = Array.from(visited.keys()).filter(id => id !== "0,0" && id !== bossId);
  const itemRoomId = possibleItemRooms.length > 0 
    ? possibleItemRooms[Math.floor(Math.random() * possibleItemRooms.length)] 
    : "";

  visited.forEach((pos, id) => {
      const isBoss = id === bossId;
      const isItemRoom = id === itemRoomId;
      const isStart = id === "0,0";
      
      const enemies: Entity[] = [];
      const items: Item[] = [];
      
      // Logic for populating rooms
      if (isItemRoom) {
        // Item Room: 0 Enemies, 1 Item in center
        const randomType = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
        let name = "Mewing Manual";
        let statDesc = "Health Up";

        if (randomType === 'DAMAGE') { name = "Grimace Shake"; statDesc = "Damage +1.5"; }
        if (randomType === 'SPEED') { name = "Energy Drink"; statDesc = "Speed +0.5"; }
        if (randomType === 'TRIPLE_SHOT') { name = "The Squad"; statDesc = "Shoots 3 tears at once"; }
        if (randomType === 'PIERCING') { name = "Fanum's Fork"; statDesc = "Shots pass through enemies"; }
        if (randomType === 'BIG_TEARS') { name = "Mogger Mode"; statDesc = "Massive Tears + Damage Up"; }
        if (randomType === 'HEALTH') { name = "Lunchly Meal"; statDesc = "Health Up + Full Heal"; }

        items.push({
            id: `item-${id}`,
            type: 'ITEM',
            itemType: randomType,
            position: { x: CANVAS_WIDTH/2, y: CANVAS_HEIGHT/2 },
            velocity: { x: 0, y: 0 },
            size: ITEM_SIZE,
            color: 'gold',
            health: 1,
            maxHealth: 1,
            damage: 0,
            speed: 0,
            isActive: true,
            name: name,
            description: "Free loot",
            statDescription: statDesc,
            modifiers: []
        });
      } else if (isBoss) {
        // Boss Room
        enemies.push({
           id: `boss-${id}`,
           type: 'BOSS',
           position: { x: CANVAS_WIDTH/2, y: 150 },
           velocity: { x: 0, y: 0 },
           size: ENEMY_SIZE * 2.5,
           color: 'darkred',
           health: 150,
           maxHealth: 150,
           damage: 2,
           speed: ENEMY_SPEED * 1.5,
           isActive: true,
           modifiers: [],
           attackCooldown: 0
        });
      } else if (!isStart) {
        // Normal Room
        const distFactor = Math.abs(pos.x) + Math.abs(pos.y);
        const count = Math.floor(Math.random() * 3) + 1 + Math.floor(distFactor / 4);
        
        for(let j=0; j<count; j++) {
           // Randomize Enemy Type
           const rand = Math.random();
           let variant: 'BASIC' | 'SHOOTER' | 'DASHER' | 'TANK' = 'BASIC';
           let hp = 10 + (distFactor * 2);
           let spd = ENEMY_SPEED;
           let size = ENEMY_SIZE;
           let color = 'red';

           if (rand > 0.85) {
               variant = 'TANK';
               hp *= 2;
               spd *= 0.6;
               size *= 1.3;
               color = 'green';
           } else if (rand > 0.65) {
               variant = 'SHOOTER';
               hp *= 0.7;
               spd *= 0.8;
               color = 'purple';
           } else if (rand > 0.5) {
               variant = 'DASHER';
               hp *= 0.8;
               spd *= 1.2;
               color = 'yellow';
           }

           enemies.push({
             id: `enemy-${id}-${j}`,
             type: 'ENEMY',
             variant,
             position: { 
               x: 100 + Math.random() * (CANVAS_WIDTH - 200), 
               y: 100 + Math.random() * (CANVAS_HEIGHT - 200) 
             },
             velocity: { x: 0, y: 0 },
             size: size,
             color: color,
             health: hp,
             maxHealth: 10,
             damage: 1,
             speed: spd,
             isActive: true,
             modifiers: [],
             attackCooldown: Math.random() * 2000, // Random start time
             facing: 0
           });
        }
      }

      rooms.push({
        id,
        gridX: pos.x,
        gridY: pos.y,
        cleared: isStart || isItemRoom, // Item rooms start cleared
        enemies,
        items,
        doors: {},
        isBossRoom: isBoss,
        isItemRoom: isItemRoom
      });
  });
  
  // Link doors
  rooms.forEach(r => {
    const up = rooms.find(n => n.gridX === r.gridX && n.gridY === r.gridY - 1);
    const down = rooms.find(n => n.gridX === r.gridX && n.gridY === r.gridY + 1);
    const left = rooms.find(n => n.gridX === r.gridX - 1 && n.gridY === r.gridY);
    const right = rooms.find(n => n.gridX === r.gridX + 1 && n.gridY === r.gridY);
    
    if(up) r.doors[Direction.UP] = true;
    if(down) r.doors[Direction.DOWN] = true;
    if(left) r.doors[Direction.LEFT] = true;
    if(right) r.doors[Direction.RIGHT] = true;
  });

  return rooms;
};

/**
 * The main application component.
 * Manages the entire game state, game loop, input handling, and UI coordination.
 *
 * @returns {JSX.Element} The root component of the game.
 */
const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [player, setPlayer] = useState<Entity>(createPlayer());
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [keysPressed, setKeysPressed] = useState<Set<string>>(new Set());
  const [scale, setScale] = useState(1);
  
  const [modalMessage, setModalMessage] = useState<{title: string, desc: string, stat: string} | null>(null);

  // Refs
  const playerRef = useRef(player);
  const roomsRef = useRef(rooms);
  const currentRoomIndexRef = useRef(currentRoomIndex);
  const projectilesRef = useRef(projectiles);
  const gameStateRef = useRef(gameState);
  const keysPressedRef = useRef(keysPressed);
  const lastShotTimeRef = useRef(0);
  
  const moveInputRef = useRef<Vector2>({ x: 0, y: 0 });
  const shootInputRef = useRef<Vector2>({ x: 0, y: 0 });
  const loopRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  useEffect(() => { playerRef.current = player; }, [player]);
  useEffect(() => { roomsRef.current = rooms; }, [rooms]);
  useEffect(() => { currentRoomIndexRef.current = currentRoomIndex; }, [currentRoomIndex]);
  useEffect(() => { projectilesRef.current = projectiles; }, [projectiles]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  useEffect(() => {
    const handleResize = () => {
        const scaleX = window.innerWidth / CANVAS_WIDTH;
        const scaleY = window.innerHeight / CANVAS_HEIGHT;
        const s = Math.min(scaleX, scaleY); 
        setScale(s * 0.98); 
    };
    handleResize();
    
    const handleContextMenu = (e: Event) => e.preventDefault();
    window.addEventListener('resize', handleResize);
    document.addEventListener('contextmenu', handleContextMenu, { passive: false });
    return () => {
        window.removeEventListener('resize', handleResize);
        document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  const handleKeyDown = useCallback((key: string) => {
    setKeysPressed(prev => {
        const next = new Set(prev).add(key);
        keysPressedRef.current = next;
        return next;
    });
  }, []);

  const handleKeyUp = useCallback((key: string) => {
    setKeysPressed(prev => {
      const next = new Set(prev);
      next.delete(key);
      keysPressedRef.current = next;
      return next;
    });
  }, []);

  const handleJoystickMove = (v: Vector2) => { moveInputRef.current = v; };
  const handleJoystickShoot = (v: Vector2) => { shootInputRef.current = v; };

  const startGame = () => {
    const dungeon = generateDungeon(15);
    setRooms(dungeon);
    setCurrentRoomIndex(0);
    setPlayer(createPlayer());
    setProjectiles([]);
    setGameState(GameState.PLAYING);
    setModalMessage(null);
    lastShotTimeRef.current = 0;
  };

  const spawnItem = useCallback(async (roomIndex: number, x: number, y: number) => {
    const randomType = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
    let name = "Mystery Loot";
    let statDesc = "";
    
    if (randomType === 'DAMAGE') { name = "Grimace Shake"; statDesc = "Damage +1.5"; }
    if (randomType === 'SPEED') { name = "Energy Drink"; statDesc = "Speed +0.5"; }
    if (randomType === 'TRIPLE_SHOT') { name = "The Squad"; statDesc = "Shoots 3 tears at once"; }
    if (randomType === 'PIERCING') { name = "Fanum's Fork"; statDesc = "Shots pass through enemies"; }
    if (randomType === 'BIG_TEARS') { name = "Mogger Mode"; statDesc = "Massive Tears + Damage Up"; }
    if (randomType === 'HEALTH') { name = "Lunchly Meal"; statDesc = "Health Up + Full Heal"; }
    
    const newItem: Item = {
        id: `item-${Date.now()}`,
        type: 'ITEM',
        itemType: randomType,
        position: { x, y },
        velocity: { x: 0, y: 0 },
        size: ITEM_SIZE,
        color: 'gold',
        health: 1,
        maxHealth: 1,
        damage: 0,
        speed: 0,
        isActive: true,
        name: name,
        description: 'Loading rizz...',
        statDescription: statDesc,
        modifiers: []
    };

    setRooms(prev => {
        const newRooms = [...prev];
        if (newRooms[roomIndex]) {
            newRooms[roomIndex].items.push(newItem);
        }
        return newRooms;
    });
  }, []);

  const handleItemPickup = async (item: Item) => {
    setGameState(GameState.ITEM_PICKUP_ANIMATION);
    
    setPlayer(p => {
        const newP = { ...p };
        if (item.itemType === 'HEALTH') {
            newP.maxHealth += 2; // Grant 1 full heart container
            newP.health = newP.maxHealth; // Full heal
        }
        if (item.itemType === 'DAMAGE') newP.damage += 1.5;
        if (item.itemType === 'SPEED') newP.speed += 0.5;
        
        // Modifier based items
        if (item.itemType === 'TRIPLE_SHOT') newP.modifiers = [...newP.modifiers, 'TRIPLE_SHOT'];
        if (item.itemType === 'PIERCING') newP.modifiers = [...newP.modifiers, 'PIERCING'];
        if (item.itemType === 'BIG_TEARS') {
            newP.damage += 2; 
            newP.modifiers = [...newP.modifiers, 'BIG_TEARS'];
        }
        return newP;
    });

    const desc = await generateItemDescription(item.name, item.itemType);
    
    setModalMessage({
        title: item.name.toUpperCase(),
        desc: desc,
        stat: item.statDescription
    });

    setTimeout(() => {
        setModalMessage(null);
        setGameState(GameState.PLAYING);
    }, 3000); // Slightly longer to read stats
  };

  const update = (dt: number) => {
    if (gameStateRef.current !== GameState.PLAYING) return;

    const currentRoom = roomsRef.current[currentRoomIndexRef.current];
    const playerState = playerRef.current;
    
    if (!currentRoom) return;

    // --- 1. Player Movement & Collision ---
    let dx = moveInputRef.current.x;
    let dy = moveInputRef.current.y;
    
    const keys = keysPressedRef.current;
    if (keys.has('KeyW')) dy -= 1;
    if (keys.has('KeyS')) dy += 1;
    if (keys.has('KeyA')) dx -= 1;
    if (keys.has('KeyD')) dx += 1;

    const len = Math.sqrt(dx*dx + dy*dy);
    if (len > 1.0) { dx /= len; dy /= len; } 
    else if (len < 0.1) { dx = 0; dy = 0; }

    // Update Facing
    const nextFacing = getFacingFromVelocity(dx, dy, playerState.facing);

    let nextX = playerState.position.x + dx * playerState.speed;
    let nextY = playerState.position.y + dy * playerState.speed;

    // Walls & Doors
    const wallThickness = 50;
    const minSafe = wallThickness + playerState.size/2;
    const maxSafeX = CANVAS_WIDTH - minSafe;
    const maxSafeY = CANVAS_HEIGHT - minSafe;
    const doorHalfWidth = 60;

    const isRoomCleared = currentRoom.cleared || currentRoom.enemies.every(e => !e.isActive);
    const inVerticalDoorZone = Math.abs(nextX - CANVAS_WIDTH / 2) < doorHalfWidth;
    const inHorizontalDoorZone = Math.abs(nextY - CANVAS_HEIGHT / 2) < doorHalfWidth;

    // Clamp Player unless entering door
    if (nextY < minSafe && (!isRoomCleared || !currentRoom.doors[Direction.UP] || !inVerticalDoorZone)) nextY = minSafe;
    if (nextY > maxSafeY && (!isRoomCleared || !currentRoom.doors[Direction.DOWN] || !inVerticalDoorZone)) nextY = maxSafeY;
    if (nextX < minSafe && (!isRoomCleared || !currentRoom.doors[Direction.LEFT] || !inHorizontalDoorZone)) nextX = minSafe;
    if (nextX > maxSafeX && (!isRoomCleared || !currentRoom.doors[Direction.RIGHT] || !inHorizontalDoorZone)) nextX = maxSafeX;

    // --- 2. Shooting Logic ---
    let nextProjectiles = [...projectilesRef.current];
    const now = Date.now();
    const fireRate = 400; 

    if (now - lastShotTimeRef.current > fireRate) {
      let sx = shootInputRef.current.x;
      let sy = shootInputRef.current.y;
      if (keys.has('ArrowUp')) sy = -1;
      else if (keys.has('ArrowDown')) sy = 1;
      else if (keys.has('ArrowLeft')) sx = -1;
      else if (keys.has('ArrowRight')) sx = 1;
      
      const shotMag = Math.sqrt(sx*sx + sy*sy);

      if (shotMag > 0.4) {
        const baseAngle = Math.atan2(sy, sx);
        const hasTriple = playerState.modifiers.includes('TRIPLE_SHOT');
        const hasPiercing = playerState.modifiers.includes('PIERCING');
        const hasBigTears = playerState.modifiers.includes('BIG_TEARS');

        const angles = hasTriple ? [baseAngle - 0.25, baseAngle, baseAngle + 0.25] : [baseAngle];

        angles.forEach((angle, idx) => {
             const vx = Math.cos(angle) * PROJECTILE_SPEED;
             const vy = Math.sin(angle) * PROJECTILE_SPEED;
             
             nextProjectiles.push({
                id: `p-${now}-${idx}`,
                owner: 'PLAYER',
                type: 'PROJECTILE',
                position: { x: nextX, y: nextY },
                velocity: { x: vx, y: vy },
                size: hasBigTears ? PROJECTILE_SIZE * 2.2 : PROJECTILE_SIZE,
                color: 'blue',
                health: 1,
                maxHealth: 1,
                damage: playerState.damage,
                speed: PROJECTILE_SPEED,
                isActive: true,
                piercing: hasPiercing,
                hitIds: [],
                modifiers: []
            });
        });

        lastShotTimeRef.current = now;
      }
    }

    // --- 3. Entity Logic (Enemies) ---
    let roomEnemies = [...currentRoom.enemies];
    let roomItems = [...currentRoom.items];
    let playerHit = false;
    let nextPlayerHealth = playerState.health;

    roomEnemies = roomEnemies.map(enemy => {
        if (!enemy.isActive) return enemy;
        
        // Initialize or decay cooldown
        enemy.attackCooldown = (enemy.attackCooldown || 0) - dt;

        // AI BEHAVIOR
        const dx = nextX - enemy.position.x;
        const dy = nextY - enemy.position.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        let vx = 0, vy = 0;
        let moveSpeed = enemy.speed;

        if (enemy.variant === 'SHOOTER') {
            // SHOOTER: Maintain distance ~200
            if (dist > 250) {
                // Approach
                vx = (dx / dist) * moveSpeed;
                vy = (dy / dist) * moveSpeed;
            } else if (dist < 150) {
                // Retreat
                vx = -(dx / dist) * moveSpeed;
                vy = -(dy / dist) * moveSpeed;
            }
            // Else stand still and shoot

            if (enemy.attackCooldown <= 0) {
                // Fire projectile
                const angle = Math.atan2(dy, dx);
                nextProjectiles.push({
                    id: `ep-${Date.now()}-${Math.random()}`,
                    owner: 'ENEMY',
                    type: 'PROJECTILE',
                    position: { x: enemy.position.x, y: enemy.position.y },
                    velocity: { x: Math.cos(angle) * 4, y: Math.sin(angle) * 4 },
                    size: PROJECTILE_SIZE,
                    color: 'red',
                    health: 1,
                    maxHealth: 1,
                    damage: 1,
                    speed: 4,
                    isActive: true,
                    piercing: false,
                    hitIds: [],
                    modifiers: []
                });
                enemy.attackCooldown = 2000; // 2s cooldown
            }

        } else if (enemy.variant === 'DASHER') {
            // DASHER: Cycle -> Chase (slow) -> Charge (Stop) -> Dash (Fast)
            // Using cooldown to track state. 
            // Let's say cycle is 2500ms total.
            // 2500-500: Chase. 500-200: Charge/Stop. 200-0: Dash.
            
            if (enemy.attackCooldown <= 0) enemy.attackCooldown = 2500;

            if (enemy.attackCooldown > 600) {
                // Normal chase
                vx = (dx / dist) * moveSpeed;
                vy = (dy / dist) * moveSpeed;
            } else if (enemy.attackCooldown > 200) {
                // Stop/Windup
                vx = 0; vy = 0;
            } else {
                // DASH!
                vx = (dx / dist) * (moveSpeed * 4);
                vy = (dy / dist) * (moveSpeed * 4);
            }

        } else {
            // BASIC & TANK & BOSS: Just chase
            if (dist > 5) {
                vx = (dx / dist) * moveSpeed;
                vy = (dy / dist) * moveSpeed;
            }
        }

        // Calculate Enemy Facing
        const enemyFacing = getFacingFromVelocity(vx, vy, enemy.facing);

        let eX = enemy.position.x + vx;
        let eY = enemy.position.y + vy;

        // Wall collisions for enemies (keep them in bounds)
        if (eX < 50) eX = 50;
        if (eX > CANVAS_WIDTH - 50) eX = CANVAS_WIDTH - 50;
        if (eY < 50) eY = 50;
        if (eY > CANVAS_HEIGHT - 50) eY = CANVAS_HEIGHT - 50;

        // Player Body Collision (Contact Damage)
        if (checkCollision({ ...playerState, position: {x: nextX, y: nextY} }, { ...enemy, position: {x: eX, y: eY} })) {
            playerHit = true;
        }

        // Player Projectiles Hit Enemy
        nextProjectiles.forEach(proj => {
            if (proj.isActive && proj.owner === 'PLAYER') {
                if (proj.piercing && proj.hitIds.includes(enemy.id)) return;

                if (checkCollision(proj, { ...enemy, position: {x: eX, y: eY} })) {
                    enemy.health -= proj.damage;
                    if (proj.piercing) {
                        proj.hitIds.push(enemy.id);
                    } else {
                        proj.isActive = false;
                    }
                    // Knockback
                    if (enemy.variant !== 'TANK' && enemy.type !== 'BOSS') {
                        eX -= vx * 6;
                        eY -= vy * 6;
                    }
                }
            }
        });

        // Enemy Death
        if (enemy.health <= 0) {
            enemy.isActive = false;
            if (!currentRoom.isBossRoom && !currentRoom.isItemRoom && Math.random() > 0.75) {
                spawnItem(currentRoomIndexRef.current, eX, eY);
            }
            if (currentRoom.isBossRoom) {
                 spawnItem(currentRoomIndexRef.current, CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
                 setModalMessage({ title: "VICTORY", desc: "NO CAP YOU ARE THE GOAT", stat: "Run Completed" });
                 setGameState(GameState.VICTORY);
            }
        }

        return { ...enemy, position: { x: eX, y: eY }, facing: enemyFacing };
    });

    // Move Projectiles & Check Enemy Projectiles vs Player
    nextProjectiles = nextProjectiles.map(p => ({
        ...p,
        position: { x: p.position.x + p.velocity.x, y: p.position.y + p.velocity.y }
    })).filter(p => {
        const inBounds = p.isActive && 
            p.position.x > 0 && p.position.x < CANVAS_WIDTH &&
            p.position.y > 0 && p.position.y < CANVAS_HEIGHT;

        if (!inBounds) return false;

        // Check Collision with Player if it's an enemy projectile
        if (p.owner === 'ENEMY') {
             if (checkCollision(p, { ...playerState, position: {x: nextX, y: nextY} })) {
                 playerHit = true;
                 return false; // Destroy projectile
             }
        }
        return true;
    });

    // Item Pickup
    roomItems = roomItems.map(item => {
        if (item.isActive && checkCollision({ ...playerState, position: {x: nextX, y: nextY} }, item)) {
            item.isActive = false;
            handleItemPickup(item);
        }
        return item;
    });

    // Apply Player Damage (I-Frames logic simplified to chance)
    if (playerHit && Math.random() < 0.05) {
         nextPlayerHealth -= 1;
         if (nextPlayerHealth <= 0) setGameState(GameState.GAME_OVER);
    }

    // --- 4. Room Switching ---
    let switchedRoom = false;
    let nextGridX = currentRoom.gridX;
    let nextGridY = currentRoom.gridY;
    let spawnX = nextX;
    let spawnY = nextY;

    if (nextY < 20 && currentRoom.doors[Direction.UP]) { 
        nextGridY--; switchedRoom = true; spawnY = CANVAS_HEIGHT - 80; spawnX = CANVAS_WIDTH / 2;
    } else if (nextY > CANVAS_HEIGHT - 20 && currentRoom.doors[Direction.DOWN]) { 
        nextGridY++; switchedRoom = true; spawnY = 80; spawnX = CANVAS_WIDTH / 2;
    } else if (nextX < 20 && currentRoom.doors[Direction.LEFT]) { 
        nextGridX--; switchedRoom = true; spawnX = CANVAS_WIDTH - 80; spawnY = CANVAS_HEIGHT / 2;
    } else if (nextX > CANVAS_WIDTH - 20 && currentRoom.doors[Direction.RIGHT]) { 
        nextGridX++; switchedRoom = true; spawnX = 80; spawnY = CANVAS_HEIGHT / 2;
    }

    // --- 5. Sync State ---
    if (switchedRoom) {
        if (isRoomCleared) { 
             const newRooms = [...roomsRef.current];
             // Mark current fully complete
             newRooms[currentRoomIndexRef.current].cleared = true; 
             
             const nextRoomIndex = newRooms.findIndex(r => r.gridX === nextGridX && r.gridY === nextGridY);
             if (nextRoomIndex !== -1) {
                setCurrentRoomIndex(nextRoomIndex);
                setPlayer(p => ({ ...p, position: { x: spawnX, y: spawnY } }));
                setProjectiles([]);
                setRooms(newRooms);
                
                if (newRooms[nextRoomIndex].isBossRoom && !newRooms[nextRoomIndex].cleared) {
                    generateBossTaunt().then(taunt => {
                        setModalMessage({ title: "WARNING: SKIBIDI BOSS", desc: taunt, stat: "Survive." });
                        setTimeout(() => setModalMessage(null), 2000);
                    });
                }
             }
        } else {
             // Bounce back
             setPlayer(p => ({ ...p, position: { x: nextX, y: nextY }, health: nextPlayerHealth }));
        }
    } else {
        // Normal Frame
        setPlayer(p => ({ ...p, position: { x: nextX, y: nextY }, health: nextPlayerHealth, facing: nextFacing }));
        
        const newRooms = [...roomsRef.current];
        if (newRooms[currentRoomIndexRef.current]) {
            newRooms[currentRoomIndexRef.current].enemies = roomEnemies;
            newRooms[currentRoomIndexRef.current].items = roomItems;
            // Auto clear logic
            if (roomEnemies.every(e => !e.isActive)) newRooms[currentRoomIndexRef.current].cleared = true;
            setRooms(newRooms);
        }
        setProjectiles(nextProjectiles);
    }
  };

  useEffect(() => {
    const loop = (time: number) => {
      const dt = time - lastTimeRef.current;
      lastTimeRef.current = time;
      update(dt);
      loopRef.current = requestAnimationFrame(loop);
    };
    loopRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(loopRef.current!);
  }, []);

  if (gameState === GameState.MENU) {
      return (
          <div className="h-screen w-full bg-stone-900 flex flex-col items-center justify-center font-[Press_Start_2P] p-4 select-none">
              <h1 className="text-4xl md:text-6xl text-red-600 mb-8 font-bold text-center tracking-tighter">THE BINDING OF<br/><span className="text-white">SIGMA</span></h1>
              <p className="text-yellow-400 mb-8 text-lg md:text-xl text-center">Ohio Dungeon Edition</p>
              <button 
                onClick={startGame}
                className="px-8 py-4 bg-red-700 text-white text-xl md:text-2xl hover:bg-red-600 border-4 border-red-900 animate-pulse"
              >
                  START RUN (NO CAP)
              </button>
              <div className="mt-8 text-gray-500 text-xs max-w-md text-center">
                  WASD/Left Stick to Move • Arrows/Right Stick to Shoot<br/>Don't get Fanum Taxed
              </div>
          </div>
      )
  }

  if (gameState === GameState.GAME_OVER) {
      return (
          <div className="h-screen w-full bg-black flex flex-col items-center justify-center font-[Press_Start_2P] space-y-6 select-none">
              <h1 className="text-4xl md:text-6xl text-gray-500">YOU DIED</h1>
              <p className="text-red-500 text-lg md:text-2xl">L + Ratio + Skill Issue</p>
              <button onClick={startGame} className="text-white underline mt-10 p-4">RESTART?</button>
          </div>
      )
  }

  if (gameState === GameState.VICTORY) {
    return (
        <div className="h-screen w-full bg-yellow-900 flex flex-col items-center justify-center font-[Press_Start_2P] space-y-6 select-none">
            <h1 className="text-4xl md:text-6xl text-yellow-300 animate-bounce text-center">ABSOLUTE CINEMA</h1>
            <p className="text-white text-lg md:text-2xl text-center">You have the Gyatt of Gold</p>
            <button onClick={startGame} className="text-white underline mt-10 p-4">GO AGAIN?</button>
        </div>
    )
}

  return (
    <div className="fixed inset-0 bg-stone-900 flex items-center justify-center overflow-hidden touch-none">
      <div 
        style={{ 
            width: CANVAS_WIDTH, 
            height: CANVAS_HEIGHT, 
            transform: `scale(${scale})`,
            transformOrigin: 'center center'
        }}
        className="relative shadow-2xl"
      >
        <GameRenderer 
           player={player}
           currentRoom={rooms[currentRoomIndex] || {}}
           projectiles={projectiles}
           onKeyDown={handleKeyDown}
           onKeyUp={handleKeyUp}
        />
        
        <HUD 
            stats={{
                tears: 10,
                rizz: player.damage,
                speed: player.speed,
                range: 10,
                shotSpeed: 10,
                fanumTax: 0
            }}
            currentRoom={rooms[currentRoomIndex]}
            rooms={rooms}
            health={player.health}
            maxHealth={player.maxHealth}
        />

        {modalMessage && (
            <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/80 backdrop-blur-sm p-8">
                <div className="text-center flex flex-col items-center">
                    <h2 className="text-3xl md:text-4xl text-yellow-400 mb-2 stroke-black drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">{modalMessage.title}</h2>
                    <div className="bg-gray-800/90 border-2 border-gray-600 p-4 rounded-lg max-w-md">
                         <p className="text-gray-300 text-sm md:text-base mb-2 italic border-b border-gray-600 pb-2">"{modalMessage.desc}"</p>
                         <p className="text-green-400 text-lg md:text-xl font-bold">{modalMessage.stat}</p>
                    </div>
                </div>
            </div>
        )}
      </div>

      <div className="absolute inset-0 pointer-events-none flex justify-between items-end pb-8 px-8 md:px-24">
          <div className="pointer-events-auto opacity-70 hover:opacity-100 transition-opacity">
            <Joystick onMove={handleJoystickMove} color="#e8bfb5" label="MOVE" />
          </div>
          <div className="pointer-events-auto opacity-70 hover:opacity-100 transition-opacity">
            <Joystick onMove={handleJoystickShoot} color="#8ae5ff" label="SHOOT" />
          </div>
      </div>
    </div>
  );
};

export default App;
