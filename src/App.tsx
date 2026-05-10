import React, { useState, useEffect } from 'react';
import { SomnusGame } from './components/SomnusGame';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, AlertTriangle, Wifi, Shield, Brain } from 'lucide-react';

type GameState = 'MENU' | 'PLAYING' | 'GAMEOVER' | 'WIN';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [glitchText, setGlitchText] = useState(false);
  const [savedLevel, setSavedLevel] = useState<number>(0);

  useEffect(() => {
    const saved = localStorage.getItem('somnus_level');
    if (saved) setSavedLevel(parseInt(saved, 10));
    
    const interval = setInterval(() => {
      setGlitchText(prev => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const startGame = () => setGameState('PLAYING');
  const resetGame = () => {
    setGameState('MENU');
  };

  const handleLevelChange = (level: number) => {
    setSavedLevel(level);
    localStorage.setItem('somnus_level', level.toString());
  };

  const startNewGame = () => {
    setSavedLevel(0);
    localStorage.setItem('somnus_level', '0');
    setGameState('PLAYING');
  };

  return (
    <div className="h-screen w-screen bg-[#131313] text-[#e2e2e2] flex flex-col items-center justify-center relative overflow-hidden font-pixel">
      {/* Background Artifacts */}
      <div className="absolute inset-0 opacity-5 pointer-events-none overflow-hidden text-[10px] leading-none tracking-tighter flex flex-wrap gap-4 p-8">
        {Array.from({ length: 20 }).map((_, i) => (
          <span key={i}>0x00000000 ERROR_VOID DATA_CORRUPTION_DETECTED MEMORY_LEAK_042 SYSTEM_FAILURE_IMMINENT RUN_SOMNUS_PROT_V04 USER_RECOGNIZED: NULL</span>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {gameState === 'MENU' && (
          <motion.div 
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="z-10 flex flex-col items-center"
          >
            <div className="text-center mb-20">
              <h1 className={`text-6xl md:text-8xl font-bold tracking-[0.2em] text-white uppercase opacity-90 ${glitchText ? 'glitch-text' : ''}`}>
                SOMNUS PROJECT
              </h1>
              <div className="h-1 w-full bg-white/10 mt-4 flex justify-between">
                <div className="h-full w-1/4 bg-white/40"></div>
                <div className="h-full w-1/12 bg-white/60"></div>
              </div>
            </div>

            <nav className="flex flex-col items-center gap-8">
              {savedLevel > 0 && (
                <button 
                  onClick={startGame}
                  className="group relative px-12 py-4 bg-white/5 border border-white/20 hover:bg-white transition-all duration-75 active:scale-95"
                >
                  <span className="text-xl md:text-2xl text-white group-hover:text-[#1a1c1c] transition-colors tracking-widest uppercase">
                    CONTINUE LEVEL {savedLevel + 1}
                  </span>
                  <div className="absolute -top-[1px] -left-[1px] w-2 h-2 border-t-2 border-l-2 border-white group-hover:border-[#1a1c1c]"></div>
                  <div className="absolute -bottom-[1px] -right-[1px] w-2 h-2 border-b-2 border-r-2 border-white group-hover:border-[#1a1c1c]"></div>
                </button>
              )}

              <button 
                onClick={startNewGame}
                className="group relative px-12 py-4 bg-transparent border border-[#474747] hover:bg-white transition-all duration-75 active:scale-95"
              >
                <span className="text-xl md:text-2xl text-[#e2e2e2] group-hover:text-[#1a1c1c] transition-colors tracking-widest uppercase">
                  {savedLevel > 0 ? 'RESTART SIMULATION' : 'START SIMULATION'}
                </span>
                <div className="absolute -top-[1px] -left-[1px] w-2 h-2 border-t-2 border-l-2 border-white group-hover:border-[#1a1c1c]"></div>
                <div className="absolute -bottom-[1px] -right-[1px] w-2 h-2 border-b-2 border-r-2 border-white group-hover:border-[#1a1c1c]"></div>
              </button>
            </nav>

            <div className="absolute bottom-0 w-full p-6 flex justify-between items-center bg-[#0e0e0e]/50 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 bg-red-500 animate-pulse"></div>
                <span className="text-[10px] text-[#c6c6c6] tracking-tighter uppercase">Connection: Unstable_Heartbeat</span>
              </div>
              <div className="flex gap-8">
                <div className="flex flex-col items-end">
                  <span className="text-[8px] text-[#353535] uppercase leading-none">Latency</span>
                  <span className="text-xs text-[#e2e2e2] tracking-widest">-- MS</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[8px] text-[#353535] uppercase leading-none">Security</span>
                  <span className="text-xs text-red-500 tracking-widest">BREACHED</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {gameState === 'PLAYING' && (
          <motion.div 
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            <SomnusGame 
              onGameOver={() => setGameState('GAMEOVER')} 
              onWin={() => {
                setGameState('WIN');
                localStorage.removeItem('somnus_level');
                setSavedLevel(0);
              }}
              initialLevelIndex={savedLevel}
              onLevelChange={handleLevelChange}
            />
          </motion.div>
        )}

        {gameState === 'GAMEOVER' && (
          <motion.div 
            key="gameover"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="z-20 flex flex-col items-center gap-8 p-12 border border-red-500 bg-black/80 backdrop-blur-md"
          >
            <AlertTriangle size={64} className="text-red-500 animate-bounce" />
            <h2 className="text-4xl font-bold text-red-500 glitch-text uppercase tracking-widest">Connection Lost</h2>
            <div className="text-center space-y-2">
              <p className="text-sm text-[#c6c6c6] max-w-md">
                Subiectul #42 a fost asimilat de Umbră la Nivelul {savedLevel + 1}.
              </p>
              <p className="text-[10px] text-red-400 uppercase tracking-widest">Backup de memorie disponibil pentru acest coșmar.</p>
            </div>
            
            <div className="flex flex-col gap-4 w-full">
              <button 
                onClick={startGame}
                className="px-8 py-4 bg-red-500/20 border border-red-500 text-white hover:bg-red-500 hover:text-black transition-all uppercase tracking-widest font-bold"
              >
                Continue Level {savedLevel + 1}
              </button>
              
              <button 
                onClick={resetGame}
                className="px-8 py-3 border border-white/20 text-[#c6c6c6] hover:bg-white hover:text-black transition-all uppercase tracking-widest text-sm"
              >
                Return to Menu
              </button>
            </div>
          </motion.div>
        )}

        {gameState === 'WIN' && (
          <motion.div 
            key="win"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="z-20 flex flex-col items-center gap-8 p-12 border border-green-500 bg-black/80 backdrop-blur-md"
          >
            <Shield size={64} className="text-green-500" />
            <h2 className="text-4xl font-bold text-green-500 uppercase tracking-widest">Simulation Complete</h2>
            <p className="text-sm text-[#c6c6c6] text-center max-w-md">
              Memoria a fost restaurată complet. Subiectul #42 este pregătit pentru extracție.
            </p>
            <button 
              onClick={resetGame}
              className="px-8 py-3 border border-white hover:bg-white hover:text-black transition-all uppercase tracking-widest"
            >
              Return to Terminal
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Scanline Effect */}
      <div className="scanline pointer-events-none" />
    </div>
  );
}
