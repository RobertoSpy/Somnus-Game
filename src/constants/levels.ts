import { LevelConfig } from '../types';

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
    initialLightRadius: 150,
    lightDecay: 0,
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
    logs: ["Sistem corupt detectat.", "Umbra a fost eliberată.", "Nu te lăsa prins."]
  },
  {
    id: 3,
    name: "SISTEM INSTABIL",
    gridSize: 20,
    map: Array(20).fill(0).map((_, y) => Array(20).fill(0).map((_, x) => {
        if (x === 0 || x === 19 || y === 0 || y === 19) return 1;
        if (x % 2 === 0 && y % 2 === 0) return 1;
        if (Math.random() < 0.2) return 1;
        return 0;
    })),
    playerStart: { x: 1, y: 1 },
    exitPos: { x: 18, y: 18 },
    memories: [{ x: 5, y: 5 }, { x: 15, y: 5 }, { x: 5, y: 15 }],
    shadowSpeed: 2.2,
    shadowSpawnDelay: 10,
    initialLightRadius: 200,
    lightDecay: 0.2,
    logs: ["Integritatea sistemului: 45%.", "Lumina se stinge.", "Timpul expiră."]
  },
  {
    id: 4,
    name: "COȘMARUL (FINAL)",
    gridSize: 25,
    map: Array(25).fill(0).map((_, y) => Array(25).fill(0).map((_, x) => {
        if (x === 0 || x === 24 || y === 0 || y === 24) return 1;
        if (x % 2 === 0 && y % 2 === 0) return 1;
        if (Math.random() < 0.25) return 1;
        if (Math.random() < 0.05) return 4; // Glitch walls
        return 0;
    })),
    playerStart: { x: 1, y: 1 },
    exitPos: { x: 23, y: 23 },
    memories: [{ x: 12, y: 12 }, { x: 2, y: 22 }, { x: 22, y: 2 }],
    shadowSpeed: 3.0,
    shadowSpawnDelay: 5,
    initialLightRadius: 250,
    lightDecay: 0.3,
    logs: ["SIMULARE CRITICĂ.", "REALITATEA SE DESCOMPUNE.", "EVADEAZĂ ACUM."]
  }
];

// Initialize maps
LEVELS.forEach(l => {
  l.map[l.playerStart.y][l.playerStart.x] = 0;
  l.map[l.exitPos.y][l.exitPos.x] = 2;
  l.memories.forEach(m => l.map[m.y][m.x] = 3);
});
