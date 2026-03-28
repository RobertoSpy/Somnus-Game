import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Point, Perks, LevelConfig } from '../types';
import { LEVELS, TILE_SIZE } from '../constants/levels';
import { findPathAStar } from '../utils/pathfinding';
import { HUD } from './game/HUD';
import { CanvasRenderer } from './game/CanvasRenderer';

interface SomnusGameProps {
  onGameOver: () => void;
  onWin: () => void;
}

export const SomnusGame: React.FC<SomnusGameProps> = ({ onGameOver, onWin }) => {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const level = LEVELS[currentLevelIndex];

  // Game State
  const [playerPos, setPlayerPos] = useState<Point>({ 
    x: level.playerStart.x * TILE_SIZE + TILE_SIZE / 2, 
    y: level.playerStart.y * TILE_SIZE + TILE_SIZE / 2 
  });
  const [shadowPos, setShadowPos] = useState<Point>({ x: -100, y: -100 });
  const [shadowActive, setShadowActive] = useState(false);
  const [coherence, setCoherence] = useState(100);
  const [gameTime, setGameTime] = useState(0);
  const [memoriesCollected, setMemoriesCollected] = useState(0);
  const [lightRadius, setLightRadius] = useState(level.initialLightRadius);
  const [shakeIntensity, setShakeIntensity] = useState(0);

  // Audio Refs
  const footstepAudio = useRef<HTMLAudioElement | null>(null);
  const scaryAudio = useRef<HTMLAudioElement | null>(null);

  // Perks State
  const [perks, setPerks] = useState<Perks>({ phase: 0, flash: 0, glitch: 0, decoy: 0 });
  const [isInvisible, setIsInvisible] = useState(false);
  const [isFlashActive, setIsFlashActive] = useState(false);
  const [isShadowStunned, setIsShadowStunned] = useState(false);
  const [decoyActive, setDecoyActive] = useState(false);
  const [decoyPos, setDecoyPos] = useState<Point>({ x: 0, y: 0 });
  const [glitchEffect, setGlitchEffect] = useState<Point | null>(null);

  // Timers
  const invisibilityTimer = useRef(0);
  const flashTimer = useRef(0);
  const stunTimer = useRef(0);
  const decoyTimer = useRef(0);
  const glitchTimer = useRef(0);
  const footstepTimer = useRef(0);

  const requestRef = useRef<number>(0);
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  // Initialize Audio
  useEffect(() => {
    // Footsteps - Short and punchy
    footstepAudio.current = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-walking-on-gravel-slow-595.mp3');
    footstepAudio.current.volume = 0.3;
    
    // Scary Drone - Constant atmospheric pressure
    scaryAudio.current = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-creepy-low-vibration-2311.mp3');
    scaryAudio.current.loop = true;
    scaryAudio.current.volume = 0.05; // Base volume

    const unlockAudio = () => {
      if (scaryAudio.current && scaryAudio.current.paused) {
        scaryAudio.current.play().catch(e => console.log("Audio play failed:", e));
      }
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

    return () => {
      footstepAudio.current?.pause();
      scaryAudio.current?.pause();
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  const resetLevel = useCallback((index: number) => {
    const nextLevel = LEVELS[index];
    setPlayerPos({ 
      x: nextLevel.playerStart.x * TILE_SIZE + TILE_SIZE / 2, 
      y: nextLevel.playerStart.y * TILE_SIZE + TILE_SIZE / 2 
    });
    setShadowPos({ x: -100, y: -100 });
    setShadowActive(false);
    setCoherence(100);
    setGameTime(0);
    setMemoriesCollected(0);
    setLightRadius(nextLevel.initialLightRadius);
    setShakeIntensity(0);
    if (scaryAudio.current) scaryAudio.current.volume = 0.05; // Reset volume
    setPerks({ phase: 0, flash: 0, glitch: 0, decoy: 0 });
    setIsInvisible(false);
    setIsFlashActive(false);
    setIsShadowStunned(false);
    setDecoyActive(false);
    setGlitchEffect(null);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keysPressed.current[e.key] = true;

    // Perk Activation
    if (e.shiftKey && perks.phase > 0 && !isInvisible) {
      setPerks(prev => ({ ...prev, phase: prev.phase - 1 }));
      setIsInvisible(true);
      invisibilityTimer.current = 180; // 3s @ 60fps
    }
    if ((e.key === 'f' || e.key === 'F') && perks.flash > 0 && !isFlashActive) {
      setPerks(prev => ({ ...prev, flash: prev.flash - 1 }));
      setIsFlashActive(true);
      setIsShadowStunned(true);
      flashTimer.current = 60; // 1s flash
      stunTimer.current = 180; // 3s stun
    }
    if ((e.key === 'q' || e.key === 'Q') && perks.decoy > 0 && !decoyActive) {
      setPerks(prev => ({ ...prev, decoy: prev.decoy - 1 }));
      setDecoyActive(true);
      setDecoyPos({ x: playerPos.x, y: playerPos.y });
      decoyTimer.current = 300; // 5s decoy
    }
  }, [perks, isInvisible, isFlashActive, decoyActive, playerPos]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysPressed.current[e.key] = false;
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const update = useCallback(() => {
    // 1. Timers Update
    if (invisibilityTimer.current > 0) {
      invisibilityTimer.current--;
      if (invisibilityTimer.current === 0) setIsInvisible(false);
    }
    if (flashTimer.current > 0) {
      flashTimer.current--;
      if (flashTimer.current === 0) setIsFlashActive(false);
    }
    if (stunTimer.current > 0) {
      stunTimer.current--;
      if (stunTimer.current === 0) setIsShadowStunned(false);
    }
    if (decoyTimer.current > 0) {
      decoyTimer.current--;
      if (decoyTimer.current === 0) setDecoyActive(false);
    }
    if (glitchTimer.current > 0) {
      glitchTimer.current--;
      if (glitchTimer.current === 0) setGlitchEffect(null);
    }

    // 2. Player Movement
    let dx = 0;
    let dy = 0;
    const speed = 2.5;
    if (keysPressed.current['ArrowUp'] || keysPressed.current['w']) dy -= speed;
    if (keysPressed.current['ArrowDown'] || keysPressed.current['s']) dy += speed;
    if (keysPressed.current['ArrowLeft'] || keysPressed.current['a']) dx -= speed;
    if (keysPressed.current['ArrowRight'] || keysPressed.current['d']) dx += speed;

    // Footstep Audio
    if ((dx !== 0 || dy !== 0) && footstepTimer.current <= 0) {
      if (footstepAudio.current) {
        footstepAudio.current.currentTime = 0;
        footstepAudio.current.play().catch(() => {});
      }
      footstepTimer.current = 20; // Play every 20 frames
    }
    if (footstepTimer.current > 0) footstepTimer.current--;

    const nextX = playerPos.x + dx;
    const nextY = playerPos.y + dy;

    const gridX = Math.floor(nextX / TILE_SIZE);
    const gridY = Math.floor(nextY / TILE_SIZE);

    if (gridX >= 0 && gridX < level.gridSize && gridY >= 0 && gridY < level.gridSize) {
      const tile = level.map[gridY][gridX];
      
      // Glitch Wall Logic
      if (tile === 1 && (keysPressed.current['e'] || keysPressed.current['E']) && perks.glitch > 0 && glitchTimer.current === 0) {
        setPerks(prev => ({ ...prev, glitch: prev.glitch - 1 }));
        level.map[gridY][gridX] = 0;
        setGlitchEffect({ x: gridX, y: gridY });
        glitchTimer.current = 60;
      }

      if (tile !== 1) {
        setPlayerPos({ x: nextX, y: nextY });

        // Collect Memory
        if (tile === 3) {
          level.map[gridY][gridX] = 0;
          setMemoriesCollected(prev => prev + 1);
          setPerks(prev => ({
            phase: prev.phase + 1,
            flash: prev.flash + 1,
            glitch: prev.glitch + 1,
            decoy: prev.decoy + 1
          }));
          setLightRadius(prev => prev + 20);
        }

        // Exit
        if (tile === 2) {
          if (currentLevelIndex < LEVELS.length - 1) {
            const nextIdx = currentLevelIndex + 1;
            setCurrentLevelIndex(nextIdx);
            resetLevel(nextIdx);
          } else {
            onWin();
          }
        }
      }
    }

    // 3. Shadow Logic
    if (!shadowActive && gameTime > level.shadowSpawnDelay) {
      setShadowActive(true);
      setShadowPos({ x: level.exitPos.x * TILE_SIZE, y: level.exitPos.y * TILE_SIZE });
    }

    if (shadowActive && !isShadowStunned) {
      const target = decoyActive ? decoyPos : playerPos;
      const shadowGridX = Math.floor(shadowPos.x / TILE_SIZE);
      const shadowGridY = Math.floor(shadowPos.y / TILE_SIZE);
      const targetGridX = Math.floor(target.x / TILE_SIZE);
      const targetGridY = Math.floor(target.y / TILE_SIZE);

      const path = findPathAStar(
        { x: shadowGridX, y: shadowGridY },
        { x: targetGridX, y: targetGridY },
        level.map
      );

      if (path.length > 0) {
        const nextStep = path[0];
        const targetX = nextStep.x * TILE_SIZE + TILE_SIZE / 2;
        const targetY = nextStep.y * TILE_SIZE + TILE_SIZE / 2;

        const angle = Math.atan2(targetY - shadowPos.y, targetX - shadowPos.x);
        
        // "Weeping Angel" mechanic
        const distToPlayer = Math.hypot(playerPos.x - shadowPos.x, playerPos.y - shadowPos.y);
        let currentSpeed = level.shadowSpeed;
        if (distToPlayer < lightRadius && !isInvisible) currentSpeed *= 0.3;

        setShadowPos(prev => ({
          x: prev.x + Math.cos(angle) * currentSpeed,
          y: prev.y + Math.sin(angle) * currentSpeed
        }));
      }

      // Collision with Shadow
      const distToPlayer = Math.hypot(playerPos.x - shadowPos.x, playerPos.y - shadowPos.y);
      
      // Update Shake and Audio based on distance
      const maxDist = 400;
      if (distToPlayer < maxDist && !isShadowStunned) {
        const factor = 1 - (distToPlayer / maxDist);
        setShakeIntensity(factor * 10);
        if (scaryAudio.current) {
          scaryAudio.current.volume = 0.05 + (factor * 0.75); // Min 0.05, Max 0.8
        }
      } else {
        setShakeIntensity(0);
        if (scaryAudio.current) {
          scaryAudio.current.volume = 0.05; // Keep base drone
        }
      }

      if (distToPlayer < 20 && !isInvisible) {
        setCoherence(prev => {
          const next = Math.max(0, prev - 0.5);
          if (next <= 0) onGameOver();
          return next;
        });
      }
    }

    // 4. Light Decay
    setLightRadius(prev => Math.max(50, prev - level.lightDecay / 60));
    setGameTime(prev => prev + 1/60);

    requestRef.current = requestAnimationFrame(update);
  }, [playerPos, shadowPos, shadowActive, isShadowStunned, gameTime, level, coherence, onGameOver, onWin, currentLevelIndex, resetLevel, memoriesCollected, lightRadius, isInvisible, decoyActive, decoyPos, perks.glitch]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestRef.current);
  }, [update]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black overflow-hidden font-dot">
      <CanvasRenderer 
        level={level}
        playerPos={playerPos}
        shadowPos={shadowPos}
        shadowActive={shadowActive}
        isShadowStunned={isShadowStunned}
        isInvisible={isInvisible}
        isFlashActive={isFlashActive}
        flashTimer={flashTimer.current}
        lightRadius={lightRadius}
        decoyActive={decoyActive}
        decoyPos={decoyPos}
        glitchEffect={glitchEffect}
        shakeIntensity={shakeIntensity}
      />

      <HUD 
        level={level}
        gameTime={gameTime}
        coherence={Math.floor(coherence)}
        perks={perks}
        memoriesCollected={memoriesCollected}
        isInvisible={isInvisible}
        isFlashActive={isFlashActive}
        decoyActive={decoyActive}
        glitchActive={glitchEffect !== null}
      />
    </div>
  );
};
