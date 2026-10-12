import React from 'react';
import { Eye, Info, Sparkles, Activity } from 'lucide-react';

interface ScanningFrameProps {
  onOpenModelInfo?: () => void;
}

export const ScanningFrame: React.FC<ScanningFrameProps> = ({ onOpenModelInfo }) => {
  return (
    <div className="absolute inset-0 pointer-events-none select-none p-4 sm:p-8 flex flex-col justify-between z-10">
      {/* Top HUD Row */}
      <div className="flex items-start justify-between">
        {/* Top-Left Corner Bracket & Metadata */}
        <div className="relative">
          <div className="w-7 h-7 border-t-2 border-l-2 border-sky-500/60 rounded-tl-sm shadow-[0_0_8px_rgba(2,132,199,0.15)]" />
          <div className="mt-2.5 inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            <span className="text-[10px] font-mono font-bold tracking-wider text-slate-800 uppercase">
              3D Anatomy // Live
            </span>
          </div>
          <div className="text-[10px] font-mono tracking-wider text-slate-600 mt-1 pl-1">
            CC-BY 4.0 Realistic Human Heart
          </div>
        </div>

        {/* Top-Right Corner Bracket & Cardiac Rhythm Status */}
        <div className="relative flex flex-col items-end text-right">
          <div className="w-7 h-7 border-t-2 border-r-2 border-sky-500/60 rounded-tr-sm shadow-[0_0_8px_rgba(2,132,199,0.15)]" />
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-xs">
            <Sparkles className="w-3 h-3 text-sky-600" />
            <span className="text-[10px] font-mono font-bold tracking-wider text-slate-800">
              Resting Rhythm: ~72 BPM
            </span>
          </div>
          <div className="text-[10px] font-mono text-slate-600 mt-1 pr-1 flex items-center gap-1">
            <Activity className="w-2.5 h-2.5 text-sky-500" />
            <span>Cardiac Cycle (~0.83s Period)</span>
          </div>
        </div>
      </div>

      {/* Middle Depth Crosshairs */}
      <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 flex items-center justify-between opacity-25">
        <div className="w-5 h-[1.5px] bg-sky-600" />
        <div className="w-5 h-[1.5px] bg-sky-600" />
      </div>

      {/* Subtle Medical Scan Line */}
      <div className="absolute inset-x-8 top-12 bottom-16 overflow-hidden pointer-events-none opacity-25">
        <div className="w-full h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent animate-scanline blur-[1px]" />
      </div>

      {/* Bottom HUD Row */}
      <div className="flex items-end justify-between">
        {/* Bottom-Left Corner Bracket & Interactive Hint */}
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-2 rounded-full bg-white/85 backdrop-blur-md border border-slate-200/80 text-[10px] font-mono font-medium text-slate-600 shadow-xs">
            <Eye className="w-3.5 h-3.5 text-sky-600" />
            <span>Drag to rotate • Scroll to zoom</span>
          </div>
          <div className="w-7 h-7 border-b-2 border-l-2 border-sky-500/60 rounded-bl-sm shadow-[0_0_8px_rgba(2,132,199,0.15)]" />
        </div>

        {/* Bottom-Right Corner Bracket & Visual Effect Notice */}
        <div className="relative flex flex-col items-end">
          {onOpenModelInfo && (
            <button
              onClick={onOpenModelInfo}
              className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1 mb-2 rounded-full bg-white/90 hover:bg-white border border-slate-200/90 text-[10px] font-mono font-semibold text-slate-700 hover:text-sky-700 shadow-xs hover:shadow-sm backdrop-blur-md transition-all group focus:outline-none focus:ring-2 focus:ring-sky-500"
              aria-label="View 3D animation methodology notice"
            >
              <Info className="w-3 h-3 text-sky-600 group-hover:scale-110 transition-transform" />
              <span>Simulation Notice</span>
            </button>
          )}
          <div className="w-7 h-7 border-b-2 border-r-2 border-sky-500/60 rounded-br-sm shadow-[0_0_8px_rgba(2,132,199,0.15)]" />
        </div>
      </div>
    </div>
  );
};
