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
  isDying: boolean;
  gameTime: number;
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
  shakeIntensity,
  isDying,
  gameTime
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Viewport dimensions
    const VIEWPORT_W = 800;
    const VIEWPORT_H = 600;
    canvas.width = VIEWPORT_W;
    canvas.height = VIEWPORT_H;

    // Clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    
    // Apply Screen Shake
    if (shakeIntensity > 0) {
      const dx = (Math.random() - 0.5) * shakeIntensity;
      const dy = (Math.random() - 0.5) * shakeIntensity;
      ctx.translate(dx, dy);
    }

    // Camera Translation (center on player)
    // Constrain camera to map boundaries
    let camX = playerPos.x - VIEWPORT_W / 2;
    let camY = playerPos.y - VIEWPORT_H / 2;
    
    const maxCamX = level.gridSize * TILE_SIZE - VIEWPORT_W;
    const maxCamY = level.gridSize * TILE_SIZE - VIEWPORT_H;
    
    camX = Math.max(0, Math.min(camX, maxCamX));
    camY = Math.max(0, Math.min(camY, maxCamY));

    // If map is smaller than viewport, center it
    if (maxCamX < 0) camX = maxCamX / 2;
    if (maxCamY < 0) camY = maxCamY / 2;

    ctx.translate(-camX, -camY);

    // Draw Map
    for (let y = 0; y < level.gridSize; y++) {
      for (let x = 0; x < level.gridSize; x++) {
        // Culling: Only draw tiles that are visible in the viewport
        const tileX = x * TILE_SIZE;
        const tileY = y * TILE_SIZE;
        
        if (tileX + TILE_SIZE < camX || tileX > camX + VIEWPORT_W ||
            tileY + TILE_SIZE < camY || tileY > camY + VIEWPORT_H) {
          continue;
        }

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
          if (level.id === 4 || level.id === 5) {
            // Level 4/5 Teleport Portal Visuals
            ctx.fillStyle = Math.random() > 0.8 ? '#ff00ff' : '#4b0082';
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = '#ff00ff';
            ctx.lineWidth = 2;
            ctx.strokeRect(x * TILE_SIZE + 2, y * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            ctx.lineWidth = 1;
          } else {
            ctx.fillStyle = Math.random() > 0.5 ? '#2a2a2a' : '#131313';
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          }
        } else if (tile === 5) {
           if (gameTime <= 10) {
             ctx.fillStyle = Math.random() > 0.9 ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 255, 150, 0.1)';
             ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
             ctx.strokeStyle = 'rgba(0, 255, 150, 0.3)';
             ctx.strokeRect(x * TILE_SIZE + Math.random() * 2, y * TILE_SIZE + Math.random() * 2, TILE_SIZE - 4, TILE_SIZE - 4);
           } else {
             ctx.fillStyle = '#2a2a2a';
             ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
           }
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
      offscreen.width = VIEWPORT_W;
      offscreen.height = VIEWPORT_H;
      const offCtx = offscreen.getContext('2d')!;
      offCtx.fillStyle = 'black';
      offCtx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H);
      offCtx.globalCompositeOperation = 'destination-out';
      
      // Calculate light center relative to viewport
      const lightX = playerPos.x - camX;
      const lightY = playerPos.y - camY;
      
      const gradient = offCtx.createRadialGradient(lightX, lightY, 0, lightX, lightY, lightRadius);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.5)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      offCtx.fillStyle = gradient;
      offCtx.beginPath();
      offCtx.arc(lightX, lightY, lightRadius, 0, Math.PI * 2);
      offCtx.fill();
      
      // Draw fog relative to camera
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform to draw UI/fog layer
      ctx.drawImage(offscreen, 0, 0);
      ctx.restore();
    } else {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = 'rgba(255, 255, 255, ' + (flashTimer / 60) + ')';
      ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H);
      ctx.restore();
    }

    // Death Glitch Effect
    if (isDying) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H);
      for (let i = 0; i < 30; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#ff0000' : '#ffffff';
        ctx.fillRect(0, Math.random() * VIEWPORT_H, VIEWPORT_W, Math.random() * 3);
      }
      ctx.font = 'bold 40px monospace';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      if (Math.random() > 0.3) {
        ctx.fillText("SYSTEM CRITICAL", VIEWPORT_W / 2, VIEWPORT_H / 2);
      }
      ctx.restore();
    }

    ctx.restore();
  }, [level, playerPos, shadowPos, shadowActive, isShadowStunned, isInvisible, isFlashActive, flashTimer, lightRadius, decoyActive, decoyPos, glitchEffect, shakeIntensity, isDying, gameTime]);

  return (
    <div className="relative border border-[#474747] shadow-2xl shadow-black overflow-hidden" style={{ width: 800, height: 600 }}>
      <canvas 
        ref={canvasRef} 
        className="block"
      />
      <div className="scanline" />
    </div>
  );
};
