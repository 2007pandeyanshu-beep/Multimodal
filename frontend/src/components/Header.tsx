import React, { useState } from 'react';
import { Activity, Heart, Menu, X, ArrowUpRight } from 'lucide-react';

interface HeaderProps {
  onOpenAbout: () => void;
  onOpenFeatures: () => void;
  onOpenGetStarted: () => void;
  onOpenModelNotice: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAbout,
  onOpenFeatures,
  onOpenGetStarted,
  onOpenModelNotice,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/70 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-3.5 group focus:outline-none focus:ring-2 focus:ring-sky-500 rounded-xl p-1 transition-all"
          aria-label="CardioVision AI Home"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 shadow-md group-hover:border-sky-500/50 transition-all duration-300">
            <Heart className="w-5 h-5 text-rose-500 transition-transform group-hover:scale-110" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
            </span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-slate-950">
                CardioVision
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-sky-500/10 text-sky-700 border border-sky-500/20 uppercase tracking-wider">
                AI
              </span>
            </div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-600 hidden sm:block">
              Cardiovascular Intelligence
            </span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-1 lg:gap-2">
          <button
            onClick={() => scrollToSection('problem-approach')}
            className="px-3 py-2 text-sm font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100/80 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            Approach
          </button>
          <button
            onClick={() => scrollToSection('target-vessels')}
            className="px-3 py-2 text-sm font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100/80 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            Target Arteries
          </button>
          <button
            onClick={() => scrollToSection('how-it-works')}
            className="px-3 py-2 text-sm font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100/80 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            How It Works
          </button>
          <button
            onClick={() => scrollToSection('architecture')}
            className="px-3 py-2 text-sm font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100/80 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            Architecture
          </button>
          <button
            onClick={() => scrollToSection('transparency')}
            className="px-3 py-2 text-sm font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100/80 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            Limitations
          </button>
          <a
            href="#model-review"
            className="px-3 py-2 text-sm font-semibold text-teal-700 hover:text-teal-950 hover:bg-teal-50/80 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            Model Review
          </a>
        </nav>

        {/* Header Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenGetStarted}
            className="group relative inline-flex items-center gap-2 px-4.5 py-2.5 text-sm font-bold text-white bg-slate-950 hover:bg-slate-900 active:bg-black rounded-xl shadow-md hover:shadow-sky-950/20 hover:ring-2 hover:ring-sky-500/40 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            aria-label="Start Patient Assessment Wizard"
          >
            <Activity className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
            <span>Start Assessment</span>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-6 bg-white/95 backdrop-blur-2xl border-b border-slate-200/80 space-y-1">
          <button
            onClick={() => scrollToSection('problem-approach')}
            className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100 rounded-xl"
          >
            Approach
          </button>
          <button
            onClick={() => scrollToSection('target-vessels')}
            className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100 rounded-xl"
          >
            Target Arteries
          </button>
          <button
            onClick={() => scrollToSection('how-it-works')}
            className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100 rounded-xl"
          >
            How It Works
          </button>
          <button
            onClick={() => scrollToSection('architecture')}
            className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100 rounded-xl"
          >
            Architecture
          </button>
          <button
            onClick={() => scrollToSection('transparency')}
            className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100 rounded-xl"
          >
            Limitations
          </button>
          <a
            href="#model-review"
            onClick={() => setMobileMenuOpen(false)}
            className="block w-full text-left px-4 py-2.5 text-sm font-semibold text-teal-800 hover:bg-teal-50 rounded-xl"
          >
            Model Review & Population Benchmarks
          </a>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenModelNotice();
            }}
            className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100 rounded-xl"
          >
            3D Heart Disclosure
          </button>
        </div>
      )}
    </header>
  );
};
