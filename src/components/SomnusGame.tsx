import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Point, Perks, LevelConfig } from '../types';
import { LEVELS, TILE_SIZE } from '../constants/levels';
import { findPathAStar } from '../utils/pathfinding';
import { HUD } from './game/HUD';
import { CanvasRenderer } from './game/CanvasRenderer';

interface SomnusGameProps {
  onGameOver: () => void;
  onWin: () => void;
  initialLevelIndex?: number;
  onLevelChange?: (level: number) => void;
}

export const SomnusGame: React.FC<SomnusGameProps> = ({ 
  onGameOver, 
  onWin, 
  initialLevelIndex = 0,
  onLevelChange 
}) => {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(initialLevelIndex);
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
  const [difficultyTime, setDifficultyTime] = useState(0);
  const [memoriesCollected, setMemoriesCollected] = useState(0);
  const [lightRadius, setLightRadius] = useState(level.initialLightRadius);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const [isDying, setIsDying] = useState(false);
  const [introPlaying, setIntroPlaying] = useState(true);
  const [lightNotification, setLightNotification] = useState<string | null>(null);

  // Audio Refs
  const footstepAudio = useRef<HTMLAudioElement | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const ambientOsc = useRef<OscillatorNode | null>(null);
  const ambientGain = useRef<GainNode | null>(null);
  const lastWhisperTime = useRef<number>(0);
  const lastNoteTime = useRef<number>(0);
  const noteToggle = useRef<boolean>(false);
  const scaryAudio = useRef<HTMLAudioElement | null>(null);

  // Perks State
  const [perks, setPerks] = useState<Perks>({ phase: 0, flash: 0, glitch: 0, decoy: 0 });
  const [isInvisible, setIsInvisible] = useState(false);
  const [isFlashActive, setIsFlashActive] = useState(false);
  const [isShadowStunned, setIsShadowStunned] = useState(false);
  const [decoyActive, setDecoyActive] = useState(false);
  const [decoyPos, setDecoyPos] = useState<Point>({ x: 0, y: 0 });
  const [glitchEffect, setGlitchEffect] = useState<Point | null>(null);
  const [showHint, setShowHint] = useState(false);

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

  // Intro Sequence Effect — runs only once per level change via currentLevelIndex
  useEffect(() => {
    setIntroPlaying(true);
    const text = level.logs.join(" ");

    // Show light notification if level > 1
    if (level.id > 1) {
      setLightNotification(`⚠ Lumina s-a redus la ${level.lightRadiusAtLevel ?? level.initialLightRadius}px — nivelul ${level.id}`);
      setTimeout(() => setLightNotification(null), 4000);
    }

    // Guard: voices list may be empty initially, retry after a tick
    let utterance: SpeechSynthesisUtterance | null = null;
    let timeoutId: ReturnType<typeof setTimeout>;

    const speak = () => {
      window.speechSynthesis.cancel();
      utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ro-RO';
      utterance.rate = 1.0; 
      const voices = window.speechSynthesis.getVoices();
      const roVoice = voices.find(v => v.lang.startsWith('ro'));
      const maleVoice = roVoice || voices.find(v =>
        v.name.includes('Google UK English Male') ||
        v.name.includes('Microsoft Mark') ||
        v.name.includes('Alex') ||
        v.name.includes('Google US English')
      );
      if (maleVoice) utterance.voice = maleVoice;
      utterance.onend = () => setIntroPlaying(false);
      utterance.onerror = () => setIntroPlaying(false);
      window.speechSynthesis.speak(utterance);
    };

    timeoutId = setTimeout(speak, 600);
    return () => {
      clearTimeout(timeoutId);
      window.speechSynthesis.cancel();
    };
    // Only re-run when the level index changes, NOT when `level` object changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLevelIndex]);

  // Intro Skip Logic
  useEffect(() => {
    if (!introPlaying) return;
    
    const skipIntro = () => {
      window.speechSynthesis.cancel();
      setIntroPlaying(false);
      if (audioContext.current?.state === 'suspended') {
        audioContext.current.resume();
      }
    };

    window.addEventListener('keydown', skipIntro);
    window.addEventListener('click', skipIntro);
    
    // Safety fallback
    const timeout = setTimeout(skipIntro, 12000);

    return () => {
      window.removeEventListener('keydown', skipIntro);
      window.removeEventListener('click', skipIntro);
      clearTimeout(timeout);
    };
  }, [introPlaying]);

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
    setLightRadius(nextLevel.lightRadiusAtLevel ?? nextLevel.initialLightRadius);
    setShakeIntensity(0);
    if (scaryAudio.current) scaryAudio.current.volume = 0.05; // Reset volume
    setPerks({ phase: 0, flash: 0, glitch: 0, decoy: 0 });
    setIsInvisible(false);
    setIsFlashActive(false);
    setIsShadowStunned(false);
    setDecoyActive(false);
    setDecoyActive(false);
    setGlitchEffect(null);
    setIsDying(false);
    setIntroPlaying(true);
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
    if ((e.key === 'p' || e.key === 'P') && perks.glitch > 0) {
      // Find an adjacent wall and break it
      const curGX = Math.floor(playerPos.x / TILE_SIZE);
      const curGY = Math.floor(playerPos.y / TILE_SIZE);
      const neighbors = [
        { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
      ];
      
      let broken = false;
      for (const n of neighbors) {
        const checkX = curGX + n.x;
        const checkY = curGY + n.y;
        if (checkX > 0 && checkX < level.gridSize - 1 && checkY > 0 && checkY < level.gridSize - 1) {
          const t = level.map[checkY][checkX];
          if (t === 1 || t === 5) {
            level.map[checkY][checkX] = 0; // Turn into floor
            broken = true;
            setGlitchEffect({ x: checkX, y: checkY });
            glitchTimer.current = 60; // Just visual effect duration
            break;
          }
        }
      }
      
      if (broken) {
        setPerks(prev => ({ ...prev, glitch: prev.glitch - 1 }));
        setShakeIntensity(10);
      }
    }
  }, [perks, isInvisible, isFlashActive, decoyActive, playerPos, level]);

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
    if (introPlaying) {
      requestRef.current = requestAnimationFrame(update);
      return;
    }

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

    if (isDying) {
      setShakeIntensity(20);
      return;
    }

    // 2. Player Movement
    let dx = 0;
    let dy = 0;
    const speed = level.playerSpeed;
    if (keysPressed.current['ArrowUp'] || keysPressed.current['w']) dy -= speed;
    if (keysPressed.current['ArrowDown'] || keysPressed.current['s']) dy += speed;
    if (keysPressed.current['ArrowLeft'] || keysPressed.current['a']) dx -= speed;
    if (keysPressed.current['ArrowRight'] || keysPressed.current['d']) dx += speed;

    // Normalize diagonal speed
    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }

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

    // Helper to check if a tile is a wall
    const isWall = (gx: number, gy: number) => {
      if (gx < 0 || gx >= level.gridSize || gy < 0 || gy >= level.gridSize) return true;
      const t = level.map[gy][gx];
      // Tile 5 is only a wall if gameTime > 10
      if (t === 5 && gameTime > 10) return true;
      // In Level 4 & 5, Tile 4 is a portal, not a hard wall for collision
      if ((level.id === 4 || level.id === 5) && t === 4) return false;
      return t === 1 || t === 4;
    };

    // Collision Check with Radius
    const r = 8; // Collision radius (slightly smaller than visual circle for better gameplay)
    let canMoveX = true;
    let canMoveY = true;

    // Check corners for X movement
    const cornersX = [
      { x: nextX + (dx > 0 ? r : -r), y: playerPos.y - r },
      { x: nextX + (dx > 0 ? r : -r), y: playerPos.y + r }
    ];
    for (const p of cornersX) {
      if (isWall(Math.floor(p.x / TILE_SIZE), Math.floor(p.y / TILE_SIZE))) {
        canMoveX = false;
        break;
      }
    }

    // Check corners for Y movement
    const cornersY = [
      { x: playerPos.x - r, y: nextY + (dy > 0 ? r : -r) },
      { x: playerPos.x + r, y: nextY + (dy > 0 ? r : -r) }
    ];
    for (const p of cornersY) {
      if (isWall(Math.floor(p.x / TILE_SIZE), Math.floor(p.y / TILE_SIZE))) {
        canMoveY = false;
        break;
      }
    }

    // Diagonal Wall Prevention (Prevent squeezing through diagonal cracks)
    if (dx !== 0 && dy !== 0) {
      const curGX = Math.floor(playerPos.x / TILE_SIZE);
      const curGY = Math.floor(playerPos.y / TILE_SIZE);
      const nextGX = Math.floor(nextX / TILE_SIZE);
      const nextGY = Math.floor(nextY / TILE_SIZE);
      
      if (nextGX !== curGX && nextGY !== curGY) {
        // More robust diagonal check: if either corner is a wall, block movement to prevent squeezing
        if (isWall(nextGX, curGY) || isWall(curGX, nextGY)) {
          canMoveX = false;
          canMoveY = false;
        }
      }
    }

    let finalX = playerPos.x;
    let finalY = playerPos.y;
    if (canMoveX) finalX = nextX;
    if (canMoveY) finalY = nextY;

    // Level 4 & 5 Teleport Logic
    const currentGX = Math.floor(finalX / TILE_SIZE);
    const currentGY = Math.floor(finalY / TILE_SIZE);
    if ((level.id === 4 || level.id === 5) && level.map[currentGY][currentGX] === 4) {
      // Find random empty spot away from exit
      let tx, ty;
      let safe = false;
      let safetyCounter = 0;
      while (!safe && safetyCounter < 100) {
        safetyCounter++;
        tx = Math.floor(Math.random() * (level.gridSize - 2)) + 1;
        ty = Math.floor(Math.random() * (level.gridSize - 2)) + 1;
        const distToExit = Math.hypot(tx - level.exitPos.x, ty - level.exitPos.y);
        
        // Check if destination is empty AND has a valid path to the exit
        if (level.map[ty][tx] === 0 && distToExit > level.gridSize / 2) {
          const pathCheck = findPathAStar({ x: tx, y: ty }, level.exitPos, level.map);
          if (pathCheck.length > 0) {
            safe = true;
            setPlayerPos({ x: tx * TILE_SIZE + TILE_SIZE/2, y: ty * TILE_SIZE + TILE_SIZE/2 });
            setShakeIntensity(15);
            return;
          }
        }
      }
    }

    // Update position if movement is possible
    if (canMoveX || canMoveY) {
      setPlayerPos({ x: finalX, y: finalY });

      const gridX = Math.floor(finalX / TILE_SIZE);
      const gridY = Math.floor(finalY / TILE_SIZE);
      const tile = level.map[gridY][gridX];

      // Collect Memory
      if (tile === 3) {
        level.map[gridY][gridX] = 0;
        setMemoriesCollected(prev => prev + 1);
        // Grant Perks
        if (level.id >= 4) {
          // Levels 4 & 5: Random perk
          const perkTypes = ['phase', 'flash', 'glitch', 'decoy'] as const;
          let randomPerk: typeof perkTypes[number];
          
          if (level.id === 5) {
            // Level 5: 35% Flash, 35% Glitch, 15% Phase, 15% Decoy
            const roll = Math.random();
            if (roll < 0.35) randomPerk = 'flash';
            else if (roll < 0.70) randomPerk = 'glitch';
            else if (roll < 0.85) randomPerk = 'phase';
            else randomPerk = 'decoy';
          } else {
            randomPerk = perkTypes[Math.floor(Math.random() * perkTypes.length)];
          }
          
          setPerks(prev => ({ ...prev, [randomPerk]: prev[randomPerk] + 1 }));
        } else {
          // Levels 1-3: Grant all perks
          setPerks(prev => ({
            phase: prev.phase + 1,
            flash: prev.flash + 1,
            glitch: prev.glitch + 1,
            decoy: prev.decoy + 1
          }));
        }
        setLightRadius(prev => prev + 20);
      }

      // Exit
      if (tile === 2) {
        if (currentLevelIndex < LEVELS.length - 1) {
          const nextIdx = currentLevelIndex + 1;
          setCurrentLevelIndex(nextIdx);
          onLevelChange?.(nextIdx);
          resetLevel(nextIdx);
        } else {
          onWin();
        }
      }
    }

    // Separate Glitch Wall Logic (interact with wall in front)
    const interactGX = Math.floor(nextX / TILE_SIZE);
    const interactGY = Math.floor(nextY / TILE_SIZE);
    if (interactGX >= 0 && interactGX < level.gridSize && interactGY >= 0 && interactGY < level.gridSize) {
      const interactTile = level.map[interactGY][interactGX];
      if ((interactTile === 1 || interactTile === 4) && (keysPressed.current['e'] || keysPressed.current['E']) && perks.glitch > 0 && glitchTimer.current === 0) {
        setPerks(prev => ({ ...prev, glitch: prev.glitch - 1 }));
        level.map[interactGY][interactGX] = 0;
        setGlitchEffect({ x: interactGX, y: interactGY });
        glitchTimer.current = 60;
      }
    }

    if (memoriesCollected >= level.memories.length && !shadowActive) {
      if (gameTime > level.shadowSpawnDelay) {
        setShadowActive(true);
        setShadowPos({ 
          x: level.playerStart.x * TILE_SIZE + TILE_SIZE / 2, 
          y: level.playerStart.y * TILE_SIZE + TILE_SIZE / 2 
        });
      }
    } else if (!shadowActive && gameTime > level.shadowSpawnDelay) {
      setShadowActive(true);
      setShadowPos({ 
        x: level.playerStart.x * TILE_SIZE + TILE_SIZE / 2, 
        y: level.playerStart.y * TILE_SIZE + TILE_SIZE / 2 
      });
    }

    // 3. Shadow Logic
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

        // Dynamic Shadow Speed: 
        const dist = Math.hypot(playerPos.x - shadowPos.x, playerPos.y - shadowPos.y);
        let currentSpeed: number;
        
        if (level.id === 4 || level.id === 5) {
          // Levels 4 & 5: Time-based proximity slowdown
          if (dist < lightRadius) {
            // Factor becomes larger (closer to 1.0) every 30s
            const stages = [0.9, 0.95, 0.97, 1.0];
            const stage = Math.min(Math.floor(difficultyTime / 30), stages.length - 1);
            currentSpeed = level.playerSpeed * stages[stage];
          } else {
            // Outside light: very fast
            currentSpeed = level.id === 5 ? level.playerSpeed + 5 : level.playerSpeed * 1.5;
          }
        } else {
          // Levels 1-3: Fast far, 15% slower close
          currentSpeed = dist > 200 ? level.playerSpeed * 1.5 : level.playerSpeed * 0.85;
        }
        const angle = Math.atan2(targetY - shadowPos.y, targetX - shadowPos.x);

        setShadowPos({
          x: shadowPos.x + Math.cos(angle) * currentSpeed,
          y: shadowPos.y + Math.sin(angle) * currentSpeed
        });
      }

      // Collision with Shadow
      const distToPlayer = Math.hypot(playerPos.x - shadowPos.x, playerPos.y - shadowPos.y);
      
      // Update Shake, Audio and Coherence based on distance
      const maxDist = 400;
      let factor = 0;
      if (distToPlayer < maxDist && !isShadowStunned) {
        factor = 1 - (distToPlayer / maxDist);
        setShakeIntensity(factor * 12);
        if (scaryAudio.current) {
          scaryAudio.current.volume = 0.05 + (factor * 0.85);
        }
        setCoherence(prev => {
          const target = (1 - factor) * 100;
          return prev + (target - prev) * 0.05; 
        });

        // Proximity Voices (Witch Style)
        const now = Date.now();
        if (distToPlayer < 180 && now - lastWhisperTime.current > 6000) {
          lastWhisperTime.current = now;
          const phrases = ["I am coming", "Be prepared to die", "Nowhere to hide", "System critical", "I see you"];
          const phrase = phrases[Math.floor(Math.random() * phrases.length)];
          const utterance = new SpeechSynthesisUtterance(phrase);
          const voices = window.speechSynthesis.getVoices();
          const femaleVoice = voices.find(v => v.name.includes('Google UK English Female') || v.name.includes('Zira') || v.name.includes('Samantha') || v.name.includes('Microsoft Hazel'));
          if (femaleVoice) utterance.voice = femaleVoice;
          utterance.pitch = 1.8; 
          utterance.rate = 0.85; 
          utterance.volume = factor;
          window.speechSynthesis.speak(utterance);
        }
      } else {
        setShakeIntensity(0);
        if (scaryAudio.current) {
          scaryAudio.current.volume = 0.05;
        }
        setCoherence(prev => prev + (100 - prev) * 0.02); 
      }

      // 4. Global Creepy Symphony (Always Active)
      if (audioContext.current) {
        const audioNow = audioContext.current.currentTime;
        if (audioNow - lastNoteTime.current > 1.2) {
          lastNoteTime.current = audioNow;
          noteToggle.current = !noteToggle.current;
          
          const symphonicVol = 0.04 + (factor * 0.2); // Base creepy volume + proximity
          const baseFreq = noteToggle.current ? 110 : 165; 
          
          [baseFreq, baseFreq * 1.02].forEach((f, i) => {
            const osc = audioContext.current!.createOscillator();
            const gain = audioContext.current!.createGain();
            osc.type = i === 0 ? 'sine' : 'triangle';
            osc.frequency.value = f;
            gain.gain.setValueAtTime(symphonicVol * (i === 0 ? 1 : 0.5), audioNow);
            gain.gain.exponentialRampToValueAtTime(0.001, audioNow + 1.1);
            osc.connect(gain);
            gain.connect(audioContext.current!.destination);
            osc.start(audioNow);
            osc.stop(audioNow + 1.2);
          });

          // Occasional high creepy accent
          if (Math.random() > 0.7 || factor > 0.5) {
            const hOsc = audioContext.current.createOscillator();
            const hGain = audioContext.current.createGain();
            hOsc.type = 'sine';
            hOsc.frequency.setValueAtTime(1000 + Math.random() * 1000, audioNow);
            hGain.gain.setValueAtTime(0, audioNow);
            hGain.gain.linearRampToValueAtTime(symphonicVol * 0.3, audioNow + 0.1);
            hGain.gain.exponentialRampToValueAtTime(0.001, audioNow + 0.5);
            hOsc.connect(hGain);
            hGain.connect(audioContext.current.destination);
            hOsc.start(audioNow);
            hOsc.stop(audioNow + 0.5);
          }
        }
      }

      if (distToPlayer < 20 && !isInvisible && !isDying) {
        setIsDying(true);
        setShakeIntensity(25);
        if (scaryAudio.current) scaryAudio.current.volume = 1.0;
        
        // Brief delay for the 'death' impact before screen switch
        setTimeout(() => {
          onGameOver();
        }, 800);
      }
    }

    // 4. Time only (no light decay)
    // 4. Time Update
    setGameTime(prev => prev + 1/60);
    if (level.id >= 4) {
      setDifficultyTime(prev => prev + 1/60);
    }
    // Light stays fixed per level — it was already set when the level loaded

    // 5. Temporal Walls Update (Level 5)
    if (gameTime <= 10 && gameTime + 1/60 > 10) {
      // Just hit the 10s mark, convert all 5s to 1s
      for (let y = 0; y < level.gridSize; y++) {
        for (let x = 0; x < level.gridSize; x++) {
          if (level.map[y][x] === 5) level.map[y][x] = 1;
        }
      }
    }

    // Hint System (Levels 4 & 5)
    const hintCycle = 40;
    const hintDuration = 5;
    const timeInCycle = difficultyTime % hintCycle;
    const hintActive = (level.id >= 4) && (difficultyTime >= hintCycle) && (timeInCycle < hintDuration);
    if (hintActive !== showHint) setShowHint(hintActive);

    requestRef.current = requestAnimationFrame(update);
  }, [playerPos, shadowPos, shadowActive, isShadowStunned, gameTime, level, coherence, onGameOver, onWin, currentLevelIndex, resetLevel, memoriesCollected, lightRadius, isInvisible, decoyActive, decoyPos, perks.glitch, isDying, showHint]);

  useEffect(() => {
    const initAudio = () => {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Constant background ambient drone
        ambientGain.current = audioContext.current.createGain();
        ambientGain.current.gain.value = 0.08; // Increased slightly so it's noticeable
        ambientGain.current.connect(audioContext.current.destination);
        
        ambientOsc.current = audioContext.current.createOscillator();
        ambientOsc.current.type = 'sine';
        ambientOsc.current.frequency.setValueAtTime(50, audioContext.current.currentTime);
        ambientOsc.current.connect(ambientGain.current);
        ambientOsc.current.start();
      } else if (audioContext.current.state === 'suspended') {
        audioContext.current.resume();
      }
    };

    const handleInteraction = () => {
      initAudio();
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('mousedown', handleInteraction);
    };

    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('mousedown', handleInteraction);

    requestRef.current = requestAnimationFrame(update);
    return () => {
      cancelAnimationFrame(requestRef.current);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('mousedown', handleInteraction);
    };
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
        isDying={isDying}
        gameTime={gameTime}
        showHint={showHint}
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

      {introPlaying && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50 p-8">
          <p className="text-white text-2xl font-dot text-center max-w-3xl leading-relaxed">
            {level.id === 1 ? "Where am I? My head hurts... I need to find the memory fragments to escape this place." : level.logs.join(" ")}
          </p>
          <p className="text-gray-500 mt-12 animate-pulse text-sm font-dot">Press any key or click to start</p>
        </div>
      )}

      {lightNotification && !introPlaying && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-900/90 border border-yellow-500 text-yellow-300 px-6 py-3 rounded font-dot text-sm z-40 animate-pulse">
          {lightNotification}
        </div>
      )}
    </div>
  );
};
