import React from 'react';
import { Eye, Info, Sparkles } from 'lucide-react';

interface ScanningFrameProps {
  onOpenModelInfo?: () => void;
}

export const ScanningFrame: React.FC<ScanningFrameProps> = ({ onOpenModelInfo }) => {
  return (
    <div className="absolute inset-0 pointer-events-none select-none p-6 sm:p-12 flex flex-col justify-between z-10">
      {/* Top HUD Row */}
      <div className="flex items-start justify-between">
        {/* Top-Left Corner Bracket & Metadata */}
        <div className="relative">
          <div className="w-8 h-8 border-t-2 border-l-2 border-cyan-400/50 rounded-tl-sm shadow-[0_0_8px_rgba(34,211,238,0.2)]" />
          <div className="mt-2 text-[10px] font-mono tracking-widest text-cyan-400/80 uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>3D ANATOMY // LIVE</span>
          </div>
          <div className="text-[9px] font-mono tracking-wider text-slate-400">
            TEXTURE: CC-BY 4.0 REALISTIC HUMAN HEART
          </div>
        </div>

        {/* Top-Right Corner Bracket & Cardiac Rhythm Status */}
        <div className="relative flex flex-col items-end text-right">
          <div className="w-8 h-8 border-t-2 border-r-2 border-cyan-400/50 rounded-tr-sm shadow-[0_0_8px_rgba(34,211,238,0.2)]" />
          <div className="mt-2 text-[10px] font-mono tracking-wider text-cyan-300/90 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>RESTING RHYTHM: 72 BPM</span>
          </div>
          <div className="text-[9px] font-mono text-slate-400">
            VISUAL CARDIAC CYCLE (~0.83s PERIOD)
          </div>
        </div>
      </div>

      {/* Middle Scanning Reticle / Depth Crosshairs */}
      <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 flex items-center justify-between opacity-30">
        <div className="w-4 h-[1px] bg-cyan-400" />
        <div className="w-4 h-[1px] bg-cyan-400" />
      </div>

      {/* Subtle Medical Scan Line */}
      <div className="absolute inset-x-12 top-16 bottom-20 overflow-hidden pointer-events-none opacity-20">
        <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scanline blur-[1px]" />
      </div>

      {/* Bottom HUD Row */}
      <div className="flex items-end justify-between">
        {/* Bottom-Left Corner Bracket & Interactive Hint */}
        <div className="relative">
          <div className="text-[10px] font-mono tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-cyan-400/80" />
            <span>DRAG TO ROTATE • SCROLL TO ZOOM</span>
          </div>
          <div className="w-8 h-8 border-b-2 border-l-2 border-cyan-400/50 rounded-bl-sm shadow-[0_0_8px_rgba(34,211,238,0.2)]" />
        </div>

        {/* Bottom-Right Corner Bracket & Clinical Simulation Disclaimer Badge */}
        <div className="relative flex flex-col items-end">
          {onOpenModelInfo && (
            <button
              onClick={onOpenModelInfo}
              className="pointer-events-auto inline-flex items-center gap-1.5 px-2.5 py-1 mb-2 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 hover:text-cyan-200 backdrop-blur-md transition-all shadow-sm group"
            >
              <Info className="w-3 h-3 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>Visual effect notice</span>
            </button>
          )}
          <div className="w-8 h-8 border-b-2 border-r-2 border-cyan-400/50 rounded-br-sm shadow-[0_0_8px_rgba(34,211,238,0.2)]" />
        </div>
      </div>
    </div>
  );
};
