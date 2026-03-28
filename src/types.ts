export type TileType = 0 | 1 | 2 | 3 | 4;

export interface Point {
  x: number;
  y: number;
}

export interface Perks {
  phase: number;
  flash: number;
  glitch: number;
  decoy: number;
}

export interface LevelConfig {
  id: number;
  name: string;
  gridSize: number;
  map: number[][];
  playerStart: Point;
  exitPos: Point;
  memories: Point[];
  shadowSpeed: number;
  shadowSpawnDelay: number;
  initialLightRadius: number;
  lightDecay: number;
  logs: string[];
}

export type GameState = 'MENU' | 'PLAYING' | 'GAMEOVER' | 'WIN';
