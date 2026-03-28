import React, { useEffect, useRef } from 'react';
import { LevelConfig, Point } from '../../types';
import { TILE_SIZE } from '../../constants/levels';

interface CanvasRendererProps {
  level: LevelConfig;
  playerPos: Point;
  shadowPos: Point;
  shadowActive: boolean;
  isShadowStunned: boolean;
  isInvisible: boolean;
  isFlashActive: boolean;
  flashTimer: number;
  lightRadius: number;
  decoyActive: boolean;
  decoyPos: Point;
  glitchEffect: Point | null;
  shakeIntensity: number;
}

export const CanvasRenderer: React.FC<CanvasRendererProps> = ({
  level,
  playerPos,
  shadowPos,
  shadowActive,
  isShadowStunned,
  isInvisible,
  isFlashActive,
  flashTimer,
  lightRadius,
  decoyActive,
  decoyPos,
  glitchEffect,
  shakeIntensity
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Apply Screen Shake
    ctx.save();
    if (shakeIntensity > 0) {
      const dx = (Math.random() - 0.5) * shakeIntensity;
      const dy = (Math.random() - 0.5) * shakeIntensity;
      ctx.translate(dx, dy);
    }

    // Clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Map
    for (let y = 0; y < level.gridSize; y++) {
      for (let x = 0; x < level.gridSize; x++) {
        const tile = level.map[y][x];
        if (tile === 1) {
          ctx.fillStyle = (glitchEffect?.x === x && glitchEffect?.y === y) ? '#ff0000' : '#2a2a2a';
          if (glitchEffect?.x === x && glitchEffect?.y === y && Math.random() > 0.5) ctx.fillStyle = '#ff5555';
          ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        } else if (tile === 2) {
          ctx.fillStyle = '#00ff00';
          ctx.globalAlpha = 0.3;
          ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          ctx.globalAlpha = 1.0;
        } else if (tile === 3) {
          ctx.fillStyle = '#00ffff';
          ctx.beginPath();
          ctx.arc(x * TILE_SIZE + TILE_SIZE/2, y * TILE_SIZE + TILE_SIZE/2, 5, 0, Math.PI * 2);
          ctx.fill();
        } else if (tile === 4) {
           ctx.fillStyle = Math.random() > 0.5 ? '#2a2a2a' : '#131313';
           ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    // Draw Decoy
    if (decoyActive) {
      ctx.save();
      ctx.globalAlpha = Math.random() * 0.5 + 0.2;
      ctx.fillStyle = '#00ffff';
      ctx.beginPath();
      ctx.arc(decoyPos.x, decoyPos.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw Shadow
    if (shadowActive) {
      ctx.fillStyle = isShadowStunned ? 'rgba(100, 100, 255, 0.6)' : 'rgba(255, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.arc(shadowPos.x, shadowPos.y, 15, 0, Math.PI * 2);
      ctx.fill();
      const grad = ctx.createRadialGradient(shadowPos.x, shadowPos.y, 0, shadowPos.x, shadowPos.y, 30);
      grad.addColorStop(0, isShadowStunned ? 'rgba(100, 100, 255, 0.4)' : 'rgba(255, 0, 0, 0.4)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(shadowPos.x, shadowPos.y, 30, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Player
    if (isInvisible) {
      ctx.fillStyle = 'rgba(150, 150, 150, 0.5)';
      ctx.beginPath();
      ctx.arc(playerPos.x, playerPos.y, 10, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 10; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#000';
        ctx.fillRect(playerPos.x - 10 + Math.random() * 20, playerPos.y - 10 + Math.random() * 20, 1, 1);
      }
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(playerPos.x, playerPos.y, 10, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fog of War
    if (!isFlashActive) {
      const offscreen = document.createElement('canvas');
      offscreen.width = canvas.width;
      offscreen.height = canvas.height;
      const offCtx = offscreen.getContext('2d')!;
      offCtx.fillStyle = 'black';
      offCtx.fillRect(0, 0, canvas.width, canvas.height);
      offCtx.globalCompositeOperation = 'destination-out';
      const gradient = offCtx.createRadialGradient(playerPos.x, playerPos.y, 0, playerPos.x, playerPos.y, lightRadius);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.5)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      offCtx.fillStyle = gradient;
      offCtx.beginPath();
      offCtx.arc(playerPos.x, playerPos.y, lightRadius, 0, Math.PI * 2);
      offCtx.fill();
      ctx.drawImage(offscreen, 0, 0);
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, ' + (flashTimer / 60) + ')';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.restore();
  }, [level, playerPos, shadowPos, shadowActive, isShadowStunned, isInvisible, isFlashActive, flashTimer, lightRadius, decoyActive, decoyPos, glitchEffect, shakeIntensity]);

  return (
    <div className="relative border border-[#474747] shadow-2xl shadow-black">
      <canvas 
        ref={canvasRef} 
        width={level.gridSize * TILE_SIZE} 
        height={level.gridSize * TILE_SIZE}
        className="block"
      />
      <div className="scanline" />
    </div>
  );
};
