import React from 'react';
import { Activity, ShieldCheck, Heart } from 'lucide-react';

interface HeaderProps {
  onOpenAbout: () => void;
  onOpenFeatures: () => void;
  onOpenGetStarted: () => void;
  isRevealed: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAbout,
  onOpenFeatures,
  onOpenGetStarted,
  isRevealed,
}) => {
  return (
    <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 sm:px-10 py-5">
      {/* Brand Logo & Name */}
      <a
        href="#"
        className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded-lg p-1 transition-all"
        aria-label="CardioVision AI Home"
      >
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/60 shadow-md group-hover:border-cyan-500/60 transition-all duration-300">
          <Heart className="w-5 h-5 text-rose-500 transition-transform group-hover:scale-110" />
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
          </span>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-lg sm:text-xl tracking-tight text-slate-900 drop-shadow-sm">
              CardioVision
            </span>
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 border border-cyan-500/20 font-mono tracking-wider">
              AI
            </span>
          </div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 hidden sm:block">
            Medical Imaging Suite
          </span>
        </div>
      </a>

      {/* Navigation Links */}
      <nav aria-label="Main Navigation" className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="px-3 sm:px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-950 transition-colors rounded-lg hover:bg-slate-200/50 focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          Home
        </button>
        <button
          onClick={onOpenAbout}
          className="px-3 sm:px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-950 transition-colors rounded-lg hover:bg-slate-200/50 focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          About
        </button>
        <button
          onClick={onOpenFeatures}
          className="px-3 sm:px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-950 transition-colors rounded-lg hover:bg-slate-200/50 focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          Features
        </button>
        <button
          onClick={onOpenGetStarted}
          className="px-3 sm:px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-950 transition-colors rounded-lg hover:bg-slate-200/50 focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          Assessment
        </button>
        
        {/* Header CTA Button */}
        <button
          onClick={onOpenGetStarted}
          className="ml-2 sm:ml-4 inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 border border-slate-700/60 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <Activity className="w-4 h-4 text-cyan-400" />
          <span>Patient Assessment</span>
        </button>
      </nav>
    </header>
  );
};
