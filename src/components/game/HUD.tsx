import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Brain, Terminal, Activity } from 'lucide-react';
import { LevelConfig, Perks } from '../../types';

interface HUDProps {
  level: LevelConfig;
  gameTime: number;
  coherence: number;
  perks: Perks;
  memoriesCollected: number;
  isInvisible: boolean;
  isFlashActive: boolean;
  decoyActive: boolean;
  glitchActive: boolean;
}

export const HUD: React.FC<HUDProps> = ({
  level,
  gameTime,
  coherence,
  perks,
  memoriesCollected,
  isInvisible,
  isFlashActive,
  decoyActive,
  glitchActive
}) => {
  return (
    <>
      {/* Top HUD */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-20 pointer-events-none">
        <div className="flex flex-col">
          <span className="text-xs text-[#353535] tracking-widest uppercase">Simulation_Status</span>
          <span className="text-xl font-bold text-white glitch-text">LEVEL {level.id} - {level.name}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-[#353535] uppercase">Uptime</span>
            <span className="text-sm text-[#e2e2e2]">{Math.floor(gameTime)}s</span>
          </div>
          <Activity className="text-white animate-pulse" size={20} />
        </div>
      </div>

      {/* Bottom HUD */}
      <div className="absolute bottom-0 left-0 w-full p-6 grid grid-cols-3 items-end z-20 pointer-events-none">
        {/* Coherence Bar */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-[10px] uppercase tracking-tighter">
            <span className="text-[#c6c6c6]">Coherence</span>
            <span className={coherence < 30 ? "text-red-500" : "text-white"}>{coherence}%</span>
          </div>
          <div className="w-48 h-1 bg-[#353535]">
            <motion.div 
              className={`h-full ${coherence < 30 ? "bg-red-500" : "bg-white"}`}
              initial={{ width: "100%" }}
              animate={{ width: `${coherence}%` }}
            />
          </div>
        </div>

        {/* Logs */}
        <div className="flex flex-col items-center gap-1">
          <Terminal size={14} className="text-[#353535]" />
          <div className="text-[10px] text-[#c6c6c6] text-center max-w-xs h-12 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={level.logs[Math.floor(gameTime / 5) % level.logs.length]}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
              >
                {level.logs[Math.floor(gameTime / 5) % level.logs.length]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* Inventory / Perks */}
        <div className="flex flex-col items-end gap-2">
          <div className="grid grid-cols-4 gap-2">
            <PerkIcon icon={<Shield size={14}/>} count={perks.phase} label="SHIFT" active={isInvisible} />
            <PerkIcon icon={<Activity size={14}/>} count={perks.flash} label="F" active={isFlashActive} />
            <PerkIcon icon={<Terminal size={14}/>} count={perks.glitch} label="E" active={glitchActive} />
            <PerkIcon icon={<Brain size={14}/>} count={perks.decoy} label="Q" active={decoyActive} />
          </div>
          <span className="text-[10px] text-[#353535] uppercase tracking-widest">
            {memoriesCollected > 0 ? "PERKS ACTIVE - USE KEYS TO SURVIVE" : "COLLECT MEMORIES FOR PERKS"}
          </span>
        </div>
      </div>

      {/* Proximity Warning */}
      {coherence < 40 && (
        <div className="absolute inset-0 pointer-events-none border-[20px] border-red-500/20 animate-pulse" />
      )}
    </>
  );
};

function PerkIcon({ icon, count, label, active }: { icon: React.ReactNode, count: number, label: string, active: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div 
        animate={{ 
          borderColor: active ? "#ffffff" : count > 0 ? "#919191" : "#353535",
          backgroundColor: active ? "rgba(255,255,255,0.2)" : "transparent"
        }}
        className="w-8 h-8 border flex items-center justify-center relative"
      >
        <span className={count > 0 ? "text-white" : "text-[#353535]"}>{icon}</span>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-white text-black text-[8px] px-1 font-bold">
            {count}
          </span>
        )}
      </motion.div>
      <span className="text-[8px] text-[#353535]">{label}</span>
    </div>
  );
}
