import { LevelConfig, Point } from '../types';
import { findPathAStar } from '../utils/pathfinding';

export const TILE_SIZE = 40;

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: "TREZIREA (TUTORIAL)",
    gridSize: 10,
    map: [
      [1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,1,0,0,0,3,1],
      [1,0,1,0,1,0,1,1,0,1],
      [1,0,1,0,0,0,0,1,0,1],
      [1,0,1,1,1,1,0,1,0,1],
      [1,0,0,0,0,1,0,0,0,1],
      [1,1,1,1,0,1,1,1,0,1],
      [1,3,0,0,0,0,0,1,0,1],
      [1,0,1,1,1,1,0,0,2,1],
      [1,1,1,1,1,1,1,1,1,1],
    ],
    playerStart: { x: 1, y: 1 },
    exitPos: { x: 8, y: 8 },
    memories: [{ x: 8, y: 1 }, { x: 1, y: 7 }],
    shadowSpeed: 0,
    shadowSpawnDelay: 999999,
    initialLightRadius: 220,
    lightDecay: 0,
    lightRadiusAtLevel: 220,
    playerSpeed: 3.5,
    logs: ["Subiectul #42 detectat.", "Simularea se inițializează...", "Găsește fragmentele de memorie pentru a stabiliza sistemul."]
  },
  {
    id: 2,
    name: "ANOMALIA",
    gridSize: 15,
    map: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,1,0,0,0,0,0,0,3,1],
      [1,0,1,1,1,0,1,0,1,1,1,1,1,0,1],
      [1,0,1,0,0,0,0,0,0,0,0,0,1,0,1],
      [1,0,1,0,1,1,1,1,1,1,1,0,1,0,1],
      [1,0,0,0,1,0,0,0,0,0,1,0,0,0,1],
      [1,1,1,0,1,0,1,1,1,0,1,1,1,1,1],
      [1,0,0,0,0,0,1,3,1,0,0,0,0,0,1],
      [1,0,1,1,1,1,1,0,1,1,1,1,1,0,1],
      [1,0,1,0,0,0,0,0,0,0,0,0,1,0,1],
      [1,0,1,0,1,1,1,0,1,1,1,0,1,0,1],
      [1,0,0,0,1,3,0,0,0,1,0,0,0,0,1],
      [1,1,1,1,1,0,1,1,1,1,0,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,2,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
    playerStart: { x: 1, y: 1 },
    exitPos: { x: 13, y: 13 },
    memories: [{ x: 13, y: 1 }, { x: 7, y: 7 }, { x: 5, y: 11 }],
    shadowSpeed: 1.5,
    shadowSpawnDelay: 15,
    initialLightRadius: 180,
    lightDecay: 0.1,
    lightRadiusAtLevel: 180,
    playerSpeed: 3.0,
    logs: ["Sistem corupt detectat.", "Umbra a fost eliberată.", "Nu te lăsa prins."]
  },
  {
    id: 3,
    name: "SISTEM INSTABIL",
    gridSize: 20,
    map: [], // Will be generated below
    playerStart: { x: 1, y: 1 },
    exitPos: { x: 18, y: 18 },
    memories: [{ x: 5, y: 5 }, { x: 15, y: 5 }, { x: 5, y: 15 }],
    shadowSpeed: 2.2,
    shadowSpawnDelay: 10,
    initialLightRadius: 150,
    lightDecay: 0.2,
    lightRadiusAtLevel: 150,
    playerSpeed: 2.6,
    logs: ["Integritatea sistemului: 45%.", "Lumina se stinge.", "Timpul expiră."]
  },
  {
    id: 4,
    name: "COȘMARUL (FINAL)",
    gridSize: 40,
    map: [], // Will be generated below
    playerStart: { x: 1, y: 1 },
    exitPos: { x: 38, y: 38 },
    memories: [{ x: 20, y: 5 }, { x: 5, y: 35 }, { x: 35, y: 15 }],
    shadowSpeed: 3.0,
    shadowSpawnDelay: 15,
    initialLightRadius: 120,
    lightDecay: 0.3,
    lightRadiusAtLevel: 120,
    playerSpeed: 2.2,
    logs: ["SIMULARE CRITICĂ.", "REALITATEA SE DESCOMPUNE.", "EVADEAZĂ ACUM."]
  },
  {
    id: 5,
    name: "ULTIMUL PROTOCOL",
    gridSize: 50,
    map: [],
    playerStart: { x: 1, y: 1 },
    exitPos: { x: 48, y: 48 },
    memories: [{ x: 25, y: 5 }, { x: 5, y: 45 }, { x: 45, y: 15 }, { x: 25, y: 25 }],
    shadowSpeed: 3.5,
    shadowSpawnDelay: 15,
    initialLightRadius: 90,
    lightDecay: 0.4,
    lightRadiusAtLevel: 90,
    playerSpeed: 1.8,
    logs: ["ULTIMA ȘANSĂ.", "SISTEMUL SE ÎNCHIDE.", "ALEGE DRUMUL CORECT."]
  }
];

// Helper to generate a valid procedural map using a maze algorithm
function generateValidMap(gridSize: number, wallChance: number, start: Point, end: Point, memories: Point[], hasGlitchWalls = false, isLevel5 = false): { map: number[][], start: Point, end: Point, memories: Point[] } {
  let map: number[][] = [];
  let valid = false;
  let attempts = 0;
  const maxAttempts = 100;
  
  while (!valid && attempts < maxAttempts) {
    attempts++;
    // 1. Initialize map with walls
    map = Array(gridSize).fill(0).map(() => Array(gridSize).fill(1));
    
    // 2. Recursive Backtracker Maze Generation
    const stack: Point[] = [];
    // Start carving from start position
    const startCarve = { x: start.x, y: start.y };
    // Ensure startCarve is on an odd coordinate if possible, or just start
    map[startCarve.y][startCarve.x] = 0;
    stack.push(startCarve);

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const neighbors = [
        { x: current.x, y: current.y - 2 },
        { x: current.x, y: current.y + 2 },
        { x: current.x - 2, y: current.y },
        { x: current.x + 2, y: current.y }
      ].filter(n => n.x > 0 && n.x < gridSize - 1 && n.y > 0 && n.y < gridSize - 1 && map[n.y][n.x] === 1);

      if (neighbors.length > 0) {
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        // Carve path to neighbor
        map[next.y][next.x] = 0;
        map[(current.y + next.y) / 2][(current.x + next.x) / 2] = 0;
        stack.push(next);
      } else {
        stack.pop();
      }
    }

    // 3. Punch a FEW extra holes to create 1-2 alternate routes (NOT a fully open braid)
    // wallChance = 0.12~0.15: only ~8-12% of dead walls are punched through
    const braidFactor = wallChance * 0.6; // e.g. 0.15 * 0.6 = 0.09 -> 9% of walls get removed
    for (let y = 1; y < gridSize - 1; y++) {
      for (let x = 1; x < gridSize - 1; x++) {
        if (map[y][x] === 1 && Math.random() < braidFactor) {
          map[y][x] = 0;
        }
      }
    }


    // 4. Ensure borders are solid walls
    for (let i = 0; i < gridSize; i++) {
      map[0][i] = 1;
      map[gridSize - 1][i] = 1;
      map[i][0] = 1;
      map[i][gridSize - 1] = 1;
    }

    // 5. Add Glitch/Temporal walls
    for (let y = 1; y < gridSize - 1; y++) {
      for (let x = 1; x < gridSize - 1; x++) {
        if (map[y][x] === 0) {
          if (hasGlitchWalls && Math.random() < 0.02) map[y][x] = 4;
        }
      }
    }

    if (isLevel5) {
      for (let i = 0; i < 20; i++) {
        const tx = Math.floor(Math.random() * (gridSize - 2)) + 1;
        const ty = Math.floor(Math.random() * (gridSize - 2)) + 1;
        if (map[ty][tx] === 0) map[ty][tx] = 5;
      }
    }

    // Temporarily set start/end/memories to 0 for pathfinding check
    const checkMap = map.map(row => [...row]);
    checkMap[start.y][start.x] = 0;
    checkMap[end.y][end.x] = 0;
    memories.forEach(m => checkMap[m.y][m.x] = 0);
    
    // Pathfinding should treat Tile 5 as passable for now (0)
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        if (checkMap[y][x] === 5) checkMap[y][x] = 0;
      }
    }

    // Validate path to exit and memories
    if (findPathAStar(start, end, checkMap).length > 0) {
      valid = true;
      for (const m of memories) {
        if (findPathAStar(start, m, checkMap).length === 0) {
          valid = false;
          break;
        }
      }
    }
  }
  
  if (!valid) {
    console.warn("Could not generate valid map, using fallback grid");
    map = Array(gridSize).fill(0).map((_, y) => Array(gridSize).fill(0).map((_, x) => {
        if (x === 0 || x === gridSize - 1 || y === 0 || y === gridSize - 1) return 1;
        if (x % 2 === 0 && y % 2 === 0) return 1;
        return 0;
    }));
  }
  
  // Set the final values
  map[start.y][start.x] = 0;
  map[end.y][end.x] = 2;
  memories.forEach(m => map[m.y][m.x] = 3);
  
  return { map, start, end, memories };
}

// The four corners (offset by 1 to avoid border walls)
function getRandomCorners(gridSize: number): { start: Point; end: Point } {
  const corners: Point[] = [
    { x: 1, y: 1 },
    { x: gridSize - 2, y: 1 },
    { x: 1, y: gridSize - 2 },
    { x: gridSize - 2, y: gridSize - 2 },
  ];
  
  // Pick a random exit corner
  const exitIdx = Math.floor(Math.random() * corners.length);
  const end = corners[exitIdx];
  
  // Pick the most opposite corner for start (maximise distance)
  const opposites = [3, 2, 1, 0]; // opposite index mapping
  const start = corners[opposites[exitIdx]];
  
  return { start, end };
}

// Place N memories at random open tiles reachable from start
function placeMemories(map: number[][], gridSize: number, start: Point, end: Point, count: number): Point[] {
  const memories: Point[] = [];
  const checkMap = map.map(row => [...row]);
  checkMap[end.y][end.x] = 0;

  let attempts = 0;
  while (memories.length < count && attempts < 500) {
    attempts++;
    const mx = Math.floor(Math.random() * (gridSize - 2)) + 1;
    const my = Math.floor(Math.random() * (gridSize - 2)) + 1;
    if (checkMap[my][mx] !== 0) continue;
    
    // Must be reachable AND not too close to start or end
    const distToStart = Math.hypot(mx - start.x, my - start.y);
    const distToEnd = Math.hypot(mx - end.x, my - end.y);
    if (distToStart < 3 || distToEnd < 3) continue;
    
    // Must not overlap existing memories
    if (memories.some(m => m.x === mx && m.y === my)) continue;
    
    if (findPathAStar(start, { x: mx, y: my }, checkMap).length > 0) {
      memories.push({ x: mx, y: my });
    }
  }
  
  return memories;
}

// Generate maps for Level 3, 4 and 5
(function() {
  // Level 3
  const corners3 = getRandomCorners(LEVELS[2].gridSize);
  const result3 = generateValidMap(LEVELS[2].gridSize, 0.15, corners3.start, corners3.end, [], false, false);
  const mems3 = placeMemories(result3.map, LEVELS[2].gridSize, result3.start, result3.end, 3);
  mems3.forEach(m => result3.map[m.y][m.x] = 3);
  LEVELS[2].map = result3.map;
  LEVELS[2].playerStart = result3.start;
  LEVELS[2].exitPos = result3.end;
  LEVELS[2].memories = mems3;

  // Level 4
  const corners4 = getRandomCorners(LEVELS[3].gridSize);
  const result4 = generateValidMap(LEVELS[3].gridSize, 0.15, corners4.start, corners4.end, [], true, false);
  const mems4 = placeMemories(result4.map, LEVELS[3].gridSize, result4.start, result4.end, 12);
  mems4.forEach(m => result4.map[m.y][m.x] = 3);
  LEVELS[3].map = result4.map;
  LEVELS[3].playerStart = result4.start;
  LEVELS[3].exitPos = result4.end;
  LEVELS[3].memories = mems4;

  // Level 5
  const corners5 = getRandomCorners(LEVELS[4].gridSize);
  const result5 = generateValidMap(LEVELS[4].gridSize, 0.12, corners5.start, corners5.end, [], true, true);
  const mems5 = placeMemories(result5.map, LEVELS[4].gridSize, result5.start, result5.end, 15);
  mems5.forEach(m => result5.map[m.y][m.x] = 3);
  LEVELS[4].map = result5.map;
  LEVELS[4].playerStart = result5.start;
  LEVELS[4].exitPos = result5.end;
  LEVELS[4].memories = mems5;
})();
