import React from 'react';
import { Heart, ExternalLink, ShieldCheck } from 'lucide-react';

interface FooterProps {
  onOpenAbout: () => void;
  onOpenFeatures: () => void;
  onOpenGetStarted: () => void;
  onOpenModelNotice: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenAbout,
  onOpenFeatures,
  onOpenGetStarted,
  onOpenModelNotice,
}) => {
  return (
    <footer className="relative z-10 w-full border-t border-slate-200/80 bg-white/70 backdrop-blur-xl mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Brand & Overview */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-950 text-white">
                <Heart className="w-4 h-4 text-rose-500" />
              </div>
              <span className="font-extrabold text-lg text-slate-950 tracking-tight">
                CardioVision AI
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-700 border border-sky-500/20 uppercase">
                Aurora Light
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed max-w-sm font-normal">
              An advanced clinical research prototype exploring cardiovascular risk
              visualization and coronary artery stenosis localization through structured
              patient assessment.
            </p>

            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
              <span>Z-Alizadeh Sani Benchmark Cohort (N=303)</span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 block">
              Application
            </span>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={onOpenGetStarted}
                  className="text-slate-600 hover:text-slate-950 transition-colors"
                >
                  Patient Profile Wizard
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenFeatures}
                  className="text-slate-600 hover:text-slate-950 transition-colors"
                >
                  System Architecture
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenAbout}
                  className="text-slate-600 hover:text-slate-950 transition-colors"
                >
                  About the Platform
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenModelNotice}
                  className="text-slate-600 hover:text-slate-950 transition-colors"
                >
                  3D Animation Disclosure
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Research & Citations */}
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 block">
              Attributions & Legal
            </span>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <a
                  href="https://sketchfab.com/neshallads"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-slate-950 transition-colors"
                >
                  <span>3D Heart Model (neshallads CC-BY 4.0)</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
              <li>
                <span className="text-slate-500">
                  Tehran Heart Center Cohort (2013)
                </span>
              </li>
              <li>
                <span className="text-slate-500">
                  Diamond-Forrester Angina Partition
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © 2026 CardioVision AI. Research & educational prototype.
          </div>
          <div className="font-mono text-[11px] text-slate-600">
            Soft Futuristic // Aurora Light Edition
          </div>
        </div>
      </div>
    </footer>
  );
};
