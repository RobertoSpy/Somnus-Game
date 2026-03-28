import { Point } from '../types';

interface Node extends Point {
  g: number; // Cost from start
  h: number; // Heuristic cost to end
  f: number; // Total cost (g + h)
  parent: Node | null;
}

/**
 * A* Pathfinding Algorithm
 * Optimized for grid-based movement.
 */
export function findPathAStar(start: Point, end: Point, map: number[][]): Point[] {
  const openSet: Node[] = [];
  const closedSet = new Set<string>();

  const startNode: Node = { ...start, g: 0, h: manhattan(start, end), f: 0, parent: null };
  startNode.f = startNode.h;
  openSet.push(startNode);

  while (openSet.length > 0) {
    // Get node with lowest f cost
    let currentIndex = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].f < openSet[currentIndex].f) {
        currentIndex = i;
      }
    }

    const current = openSet[currentIndex];

    // Found the goal
    if (current.x === end.x && current.y === end.y) {
      const path: Point[] = [];
      let temp: Node | null = current;
      while (temp.parent) {
        path.push({ x: temp.x, y: temp.y });
        temp = temp.parent;
      }
      return path.reverse();
    }

    // Move current from open to closed
    openSet.splice(currentIndex, 1);
    closedSet.add(`${current.x},${current.y}`);

    // Check neighbors
    const neighbors = [
      { x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }
    ];

    for (const dir of neighbors) {
      const nx = current.x + dir.x;
      const ny = current.y + dir.y;

      if (nx < 0 || nx >= map[0].length || ny < 0 || ny >= map.length) continue;
      if (map[ny][nx] === 1) continue; // Wall
      if (closedSet.has(`${nx},${ny}`)) continue;

      const gScore = current.g + 1;
      let neighborNode = openSet.find(n => n.x === nx && n.y === ny);

      if (!neighborNode) {
        neighborNode = {
          x: nx,
          y: ny,
          g: gScore,
          h: manhattan({ x: nx, y: ny }, end),
          f: 0,
          parent: current
        };
        neighborNode.f = neighborNode.g + neighborNode.h;
        openSet.push(neighborNode);
      } else if (gScore < neighborNode.g) {
        neighborNode.g = gScore;
        neighborNode.f = neighborNode.g + neighborNode.h;
        neighborNode.parent = current;
      }
    }
  }

  return []; // No path found
}

function manhattan(p1: Point, p2: Point): number {
  return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
}
