/**
 * frontend/src/components/workspace/WorkspaceNavBar.tsx
 * Top Navigation Bar for CardioVision AI Workspace.
 * Hosts 4 distinct destinations with high-contrast active state indicators,
 * session telemetry pill, and quick access to 54-parameter wizard.
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import React from 'react';
import {
  Heart,
  Activity,
  HeartPulse,
  FileText,
  BarChart3,
  SlidersHorizontal,
  X,
  Layers,
  Clock,
  FlaskConical,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import type { WorkspaceDestination, ActiveAssessment } from '../../api/assessmentState.ts';

export interface WorkspaceNavBarProps {
  currentDestination: WorkspaceDestination;
  activeAssessment: ActiveAssessment | null;
  onNavigate: (destination: WorkspaceDestination) => void;
  onExit: () => void;
}

interface DestinationTabConfig {
  id: WorkspaceDestination;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  description: string;
}

const DESTINATION_TABS: DestinationTabConfig[] = [
  {
    id: 'overview',
    label: '1. Prediction Overview',
    shortLabel: 'Overview',
    icon: Activity,
    badge: 'Results',
    description: 'Multi-artery risk summary and decision labels',
  },
  {
    id: 'explorer',
    label: '2. 3D Cardiovascular Explorer',
    shortLabel: '3D Explorer',
    icon: HeartPulse,
    badge: 'Interactive',
    description: 'Anatomical coronary visualization & prediction cards',
  },
  {
    id: 'report',
    label: '3. Individual Assessment Report',
    shortLabel: 'Patient Report',
    icon: FileText,
    badge: 'Dossier',
    description: '54-feature provenance, assumptions & clinical summary',
  },
  {
    id: 'model-review',
    label: '4. Model Review & Explainability',
    shortLabel: 'Model Review',
    icon: BarChart3,
    badge: 'Population',
    description: 'Tehran cohort 5-fold CV benchmarks & methodology',
  },
  {
    id: 'feature-explorer',
    label: '5. Feature Explorer',
    shortLabel: 'Features',
    icon: BookOpen,
    badge: '54 Canonical',
    description: '54 clinical features, valid ranges, derivations, preprocessing & SHAP',
  },
];

export const WorkspaceNavBar: React.FC<WorkspaceNavBarProps> = ({
  currentDestination,
  activeAssessment,
  onNavigate,
  onExit,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200/90 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Upper Bar: Brand Logo, Active Session Telemetry, Exit */}
        <div className="h-16 flex items-center justify-between gap-4 border-b border-slate-100">
          {/* Brand & Workspace Title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onExit}
              className="flex items-center gap-2.5 group text-left focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-xl p-1"
              title="Return to landing page"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-950 flex items-center justify-center shadow-xs group-hover:bg-slate-900 transition-colors">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-slate-900 tracking-tight">
                    CardioVision
                  </span>
                  <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-sky-100 text-sky-800">
                    AI
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 tracking-wide uppercase block">
                  Clinical Workspace
                </span>
              </div>
            </button>
          </div>

          {/* Center: Session Telemetry Badge */}
          <div className="hidden sm:flex items-center gap-2.5">
            {activeAssessment ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-mono">
                {activeAssessment.isSyntheticDemo ? (
                  <span className="inline-flex items-center gap-1.5 text-amber-800 font-semibold">
                    <FlaskConical className="w-3.5 h-3.5 text-amber-600" />
                    <span>Demo: {activeAssessment.demoPresetName || 'Synthetic'}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-emerald-800 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Live Patient Session</span>
                  </span>
                )}
                <span className="text-slate-300">•</span>
                <span className="text-slate-700 font-medium inline-flex items-center gap-1">
                  <Layers className="w-3 h-3 text-slate-400" />
                  <span>{activeAssessment.sessionId}</span>
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 inline-flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{activeAssessment.timestamp}</span>
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100/80 border border-slate-200 text-xs text-slate-600 font-mono">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span>No Active Assessment Loaded</span>
              </div>
            )}
          </div>

          {/* Right: Adjust 54 Inputs CTA & Exit Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('assessment')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                currentDestination === 'assessment'
                  ? 'bg-teal-50 border-teal-300 text-teal-900 shadow-2xs ring-1 ring-teal-500/20'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
              title="Open the 5-step clinical assessment wizard"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden md:inline">Adjust 54 Parameters</span>
              <span className="md:hidden">Wizard</span>
            </button>

            <button
              type="button"
              onClick={onExit}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
              aria-label="Exit workspace to landing page"
              title="Exit workspace to landing page"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Exit</span>
            </button>
          </div>
        </div>

        {/* Lower Bar: Four Workspace Destinations Tabs */}
        <nav
          aria-label="Workspace Destinations"
          className="flex items-center gap-1 sm:gap-2 py-2 overflow-x-auto no-scrollbar"
        >
          {DESTINATION_TABS.map((tab) => {
            const isActive = currentDestination === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onNavigate(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 border ${
                  isActive
                    ? 'bg-teal-50/90 border-teal-300 text-teal-950 shadow-xs ring-1 ring-teal-500/20'
                    : 'bg-transparent border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
                aria-current={isActive ? 'page' : undefined}
                title={tab.description}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-teal-700' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span className="hidden lg:inline">{tab.label}</span>
                <span className="lg:hidden">{tab.shortLabel}</span>

                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse shrink-0" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
