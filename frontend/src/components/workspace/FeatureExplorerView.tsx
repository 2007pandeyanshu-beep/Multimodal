/**
 * frontend/src/components/workspace/FeatureExplorerView.tsx
 * Destination 5: Feature Explorer & Clinical Learning Hub.
 * 
 * Comprehensive, scientifically grounded reference for the 54 canonical clinical input features:
 * - Full clinical definitions, categories, and physiological significance.
 * - Rigorous 3-way range distinction: Schema-Permitted vs. Dataset-Observed vs. Clinically Established.
 * - Preprocessing pipeline behavior (StandardScaler vs. StringCast + OneHotEncoder).
 * - Exact deterministic derivations (BMI, Obesity, Diamond-Forrester chest pain partition).
 * - Target-specific global TreeSHAP feature importance (Cath, LAD, LCX, RCA) with honest top-10 coverage handling.
 * - Single-center Tehran Heart Center cohort (N=303) context and attribution vs. causation disclosures.
 * 
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Layers,
  Activity,
  Heart,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Info,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Loader2,
  SlidersHorizontal,
  FileText,
  BarChart3,
  Scale,
  Sparkles,
  HelpCircle,
  X,
} from 'lucide-react';
import type { ActiveAssessment, WorkspaceDestination } from '../../api/assessmentState.ts';
import type { TargetName, GlobalShapResponse } from '../../api/types.ts';
import { fetchGlobalShapSummary } from '../../api/client.ts';
import {
  CLINICAL_FEATURES,
  TOTAL_CANONICAL_FEATURE_COUNT,
  type FeatureMetadata,
  type ClinicalCategory,
  type FeatureDataType,
} from '../../api/clinicalFeaturesData.ts';

export interface FeatureExplorerViewProps {
  activeAssessment: ActiveAssessment | null;
  onNavigate: (destination: WorkspaceDestination) => void;
}

const CATEGORIES: ClinicalCategory[] = [
  'Demographic',
  'Physical Measurement',
  'Medical History',
  'Lifestyle',
  'Vital Signs',
  'Physical Exam',
  'Symptom',
  'Clinical Status',
  'Electrocardiography',
  'Laboratory',
  'Echocardiography',
];

const TARGET_INFO: Record<TargetName, { label: string; vessel: string; description: string }> = {
  Cath: {
    label: 'Overall CAD (Cath)',
    vessel: 'Global Catheterization Outcome',
    description: 'Any major epicardial coronary artery with ≥50% luminal stenosis on invasive angiogram.',
  },
  LAD: {
    label: 'Left Anterior Descending (LAD)',
    vessel: 'LAD Artery Stenosis',
    description: 'Luminal diameter stenosis ≥50% in the left anterior descending coronary artery.',
  },
  LCX: {
    label: 'Left Circumflex (LCX)',
    vessel: 'LCX Artery Stenosis',
    description: 'Luminal diameter stenosis ≥50% in the left circumflex coronary artery.',
  },
  RCA: {
    label: 'Right Coronary Artery (RCA)',
    vessel: 'RCA Artery Stenosis',
    description: 'Luminal diameter stenosis ≥50% in the right coronary artery.',
  },
};

export const FeatureExplorerView: React.FC<FeatureExplorerViewProps> = ({
  activeAssessment,
  onNavigate,
}) => {
  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ClinicalCategory | 'all'>('all');
  const [selectedDataType, setSelectedDataType] = useState<FeatureDataType | 'all'>('all');
  const [selectedDerivation, setSelectedDerivation] = useState<'all' | 'derived' | 'direct'>('all');
  const [shapFilterTarget, setShapFilterTarget] = useState<TargetName | 'none'>('none');

  // Currently inspected feature in the detail modal (defaults to Age)
  const [selectedFeatureName, setSelectedFeatureName] = useState<string>('Age');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  // Global SHAP API state
  const [activeShapTarget, setActiveShapTarget] = useState<TargetName>('Cath');
  const [shapData, setShapData] = useState<GlobalShapResponse | null>(null);
  const [shapLoading, setShapLoading] = useState<boolean>(false);
  const [shapError, setShapError] = useState<string | null>(null);

  // Fetch global SHAP summary
  const loadShapData = async () => {
    setShapLoading(true);
    setShapError(null);
    try {
      const resp = await fetchGlobalShapSummary(5000);
      setShapData(resp);
    } catch (err) {
      const msg = err && typeof err === 'object' && 'message' in err
        ? String((err as { message: string }).message)
        : 'Failed to connect to machine learning explainability service.';
      setShapError(msg);
    } finally {
      setShapLoading(false);
    }
  };

  useEffect(() => {
    loadShapData();
  }, []);

  // Map of feature -> { rank, mean_absolute_shap } per target
  const shapFeatureMap = useMemo(() => {
    const map: Record<TargetName, Record<string, { rank: number; mean_absolute_shap: number }>> = {
      Cath: {},
      LAD: {},
      LCX: {},
      RCA: {},
    };
    if (!shapData || !shapData.targets) return map;

    (['Cath', 'LAD', 'LCX', 'RCA'] as TargetName[]).forEach((t) => {
      const targetObj = shapData.targets[t];
      if (targetObj && targetObj.top_features) {
        targetObj.top_features.forEach((item) => {
          map[t][item.feature_name] = {
            rank: item.rank,
            mean_absolute_shap: item.mean_absolute_shap,
          };
        });
      }
    });
    return map;
  }, [shapData]);

  // Filtered feature list
  const filteredFeatures = useMemo(() => {
    return CLINICAL_FEATURES.filter((feature) => {
      // Search query (matches canonical name, label, description, or category)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = feature.canonicalName.toLowerCase().includes(query);
        const matchesLabel = feature.label.toLowerCase().includes(query);
        const matchesDesc = feature.description.toLowerCase().includes(query);
        const matchesCat = feature.category.toLowerCase().includes(query);
        if (!matchesName && !matchesLabel && !matchesDesc && !matchesCat) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'all' && feature.category !== selectedCategory) {
        return false;
      }

      // Data type filter
      if (selectedDataType !== 'all' && feature.dataType !== selectedDataType) {
        return false;
      }

      // Derivation filter
      if (selectedDerivation === 'derived' && !feature.isDerived) {
        return false;
      }
      if (selectedDerivation === 'direct' && feature.isDerived) {
        return false;
      }

      // SHAP target filter (filters to top 10 features of specified target)
      if (shapFilterTarget !== 'none') {
        const targetMap = shapFeatureMap[shapFilterTarget];
        if (!targetMap || !(feature.canonicalName in targetMap)) {
          return false;
        }
      }

      return true;
    });
  }, [
    searchQuery,
    selectedCategory,
    selectedDataType,
    selectedDerivation,
    shapFilterTarget,
    shapFeatureMap,
  ]);

  // Selected feature metadata
  const selectedFeature = useMemo(() => {
    return (
      CLINICAL_FEATURES.find((f) => f.canonicalName === selectedFeatureName) ||
      CLINICAL_FEATURES[0]
    );
  }, [selectedFeatureName]);

  // Compute breakdown counts
  const counts = useMemo(() => {
    let numeric = 0;
    let binary = 0;
    let categorical = 0;
    let derived = 0;
    CLINICAL_FEATURES.forEach((f) => {
      if (f.dataType === 'numeric') numeric++;
      else if (f.dataType === 'binary') binary++;
      else categorical++;
      if (f.isDerived) derived++;
    });
    return { numeric, binary, categorical, derived, total: CLINICAL_FEATURES.length };
  }, []);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedDataType('all');
    setSelectedDerivation('all');
    setShapFilterTarget('none');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'all' ||
    selectedDataType !== 'all' ||
    selectedDerivation !== 'all' ||
    shapFilterTarget !== 'none';

  // Current index of selected feature within the active filtered list
  const currentFeatureIndex = useMemo(() => {
    return filteredFeatures.findIndex((f) => f.canonicalName === selectedFeature.canonicalName);
  }, [filteredFeatures, selectedFeature.canonicalName]);

  const handleOpenFeature = useCallback((featureName: string, triggerEl?: HTMLElement | null) => {
    setSelectedFeatureName(featureName);
    triggerElementRef.current = triggerEl || (document.activeElement as HTMLElement) || null;
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    if (triggerElementRef.current) {
      setTimeout(() => {
        triggerElementRef.current?.focus();
      }, 50);
    }
  }, []);

  const handlePrevFeature = useCallback(() => {
    if (filteredFeatures.length === 0) return;
    const newIndex = currentFeatureIndex <= 0 ? filteredFeatures.length - 1 : currentFeatureIndex - 1;
    setSelectedFeatureName(filteredFeatures[newIndex].canonicalName);
  }, [filteredFeatures, currentFeatureIndex]);

  const handleNextFeature = useCallback(() => {
    if (filteredFeatures.length === 0) return;
    const newIndex = currentFeatureIndex >= filteredFeatures.length - 1 ? 0 : currentFeatureIndex + 1;
    setSelectedFeatureName(filteredFeatures[newIndex].canonicalName);
  }, [filteredFeatures, currentFeatureIndex]);

  // Keyboard navigation & accessible dismissal
  useEffect(() => {
    if (!isModalOpen) return;

    // Focus close button on open for accessible keyboard traversal
    const focusTimer = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleCloseModal();
      } else if (e.key === 'ArrowLeft') {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag !== 'input' && tag !== 'textarea') {
          e.preventDefault();
          handlePrevFeature();
        }
      } else if (e.key === 'ArrowRight') {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag !== 'input' && tag !== 'textarea') {
          e.preventDefault();
          handleNextFeature();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Prevent background scrolling while modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isModalOpen, handleCloseModal, handlePrevFeature, handleNextFeature]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ========================================================= */}
      {/* A. PAGE HEADER & AUDITED FEATURE SUMMARY */}
      {/* ========================================================= */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-2xl bg-teal-50 border border-teal-200/80 text-teal-700 shadow-2xs">
                <BookOpen className="w-6 h-6 stroke-[2.2]" />
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Clinical Feature Explorer
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-teal-100 text-teal-800 border border-teal-200">
                    54 Canonical Features
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  Interactive reference and model inspection hub for the 54 verified clinical inputs across the Tehran Heart Center coronary models.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              type="button"
              onClick={() => onNavigate('model-review')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors"
            >
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span>Model Benchmarks</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('overview')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-2xs transition-colors"
            >
              <Activity className="w-4 h-4" />
              <span>Prediction Overview</span>
            </button>
          </div>
        </div>

        {/* Breakdown Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-mono text-slate-500 block uppercase font-medium">Canonical Total</span>
            <span className="text-xl font-bold text-slate-900 font-mono mt-0.5 block">{counts.total} Features</span>
            <span className="text-[10px] text-slate-400">Strict Pydantic Schema</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-mono text-sky-600 block uppercase font-medium">Continuous Numeric</span>
            <span className="text-xl font-bold text-sky-950 font-mono mt-0.5 block">{counts.numeric} Variables</span>
            <span className="text-[10px] text-slate-400">StandardScaler Norm</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-mono text-emerald-600 block uppercase font-medium">Binary Indicators</span>
            <span className="text-xl font-bold text-emerald-950 font-mono mt-0.5 block">{counts.binary} Flags</span>
            <span className="text-[10px] text-slate-400">0/1 or Y/N Encoding</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-mono text-amber-600 block uppercase font-medium">Multi-Categorical</span>
            <span className="text-xl font-bold text-amber-950 font-mono mt-0.5 block">{counts.categorical} Variables</span>
            <span className="text-[10px] text-slate-400">NYHA, BBB, RWMA, VHD</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs col-span-2 sm:col-span-1">
            <span className="text-[11px] font-mono text-purple-600 block uppercase font-medium">Derived Inputs</span>
            <span className="text-xl font-bold text-purple-950 font-mono mt-0.5 block">{counts.derived} Derived</span>
            <span className="text-[10px] text-slate-400">BMI, Obesity, Angina</span>
          </div>
        </div>

        {/* Educational Scope & Non-Diagnostic Banner */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 text-slate-700 text-xs flex items-start gap-3 leading-relaxed">
          <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-900">
              Educational Model-Inspection Interface — Not for Standalone Clinical Diagnosis
            </p>
            <p className="text-slate-600">
              This catalogue inspects the mathematical representation, schema boundary constraints, empirical distributions, and model attributions of all 54 features required by the CardioVision AI pipeline. Feature distributions reflect the single-center Tehran Heart Center catheterization cohort (N=303) and must not be used as standalone clinical guidelines.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* B. SEARCH & FILTER CONTROLS */}
      {/* ========================================================= */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Text Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by canonical name, label, clinical category, or description..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all bg-slate-50/50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as ClinicalCategory | 'all')}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="all">All Categories ({counts.total})</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Data Type Filter */}
            <select
              value={selectedDataType}
              onChange={(e) => setSelectedDataType(e.target.value as FeatureDataType | 'all')}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="all">All Data Types</option>
              <option value="numeric">Numeric ({counts.numeric})</option>
              <option value="binary">Binary Flags ({counts.binary})</option>
              <option value="categorical">Multi-Category ({counts.categorical})</option>
            </select>

            {/* Derivation Filter */}
            <select
              value={selectedDerivation}
              onChange={(e) => setSelectedDerivation(e.target.value as 'all' | 'derived' | 'direct')}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="all">All Provenance</option>
              <option value="direct">Directly Entered (50)</option>
              <option value="derived">Deterministically Derived (4)</option>
            </select>

            {/* SHAP Target Filter */}
            <select
              value={shapFilterTarget}
              onChange={(e) => setShapFilterTarget(e.target.value as TargetName | 'none')}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-mono"
            >
              <option value="none">SHAP Target: Any</option>
              <option value="Cath">Cath: Top 10 Only</option>
              <option value="LAD">LAD: Top 10 Only</option>
              <option value="LCX">LCX: Top 10 Only</option>
              <option value="RCA">RCA: Top 10 Only</option>
            </select>

            {/* Clear All Filters Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Results Bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <div>
            Showing <strong className="text-slate-900 font-mono">{filteredFeatures.length}</strong> of{' '}
            <strong className="text-slate-900 font-mono">{TOTAL_CANONICAL_FEATURE_COUNT}</strong> canonical features
          </div>
          {hasActiveFilters && (
            <span className="text-[11px] font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
              Active filters applied
            </span>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* C. CANONICAL FEATURE CATALOGUE (GRID VIEW) */}
      {/* ========================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Canonical Feature Catalogue
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {filteredFeatures.length} of {TOTAL_CANONICAL_FEATURE_COUNT}
            </span>
          </div>
          <span className="text-xs text-slate-500 hidden sm:inline">
            Click any card to open the complete clinical detail inspector
          </span>
        </div>

        {filteredFeatures.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
            <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
            <div>
              <h3 className="font-bold text-slate-800 text-base">No Matching Features</h3>
              <p className="text-xs text-slate-500 mt-1">
                No canonical features match your active search terms and filter criteria.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Clear All Filters</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFeatures.map((feature) => {
              const isSelected = selectedFeature.canonicalName === feature.canonicalName;
              const cathRank = shapFeatureMap.Cath[feature.canonicalName]?.rank;
              const ladRank = shapFeatureMap.LAD[feature.canonicalName]?.rank;
              const lcxRank = shapFeatureMap.LCX[feature.canonicalName]?.rank;
              const rcaRank = shapFeatureMap.RCA[feature.canonicalName]?.rank;

              return (
                <div
                  key={feature.canonicalName}
                  id={`feature-card-${feature.canonicalName}`}
                  onClick={(e) => handleOpenFeature(feature.canonicalName, e.currentTarget)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleOpenFeature(feature.canonicalName, e.currentTarget);
                    }
                  }}
                  aria-haspopup="dialog"
                  aria-label={`Inspect ${feature.canonicalName} (${feature.label})`}
                  className={`group p-5 rounded-2xl border transition-all text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500 flex flex-col justify-between space-y-3 ${
                    isSelected && isModalOpen
                      ? 'bg-teal-50/70 border-teal-300 shadow-xs ring-1 ring-teal-500/20'
                      : 'bg-white hover:bg-slate-50/80 hover:border-teal-300 hover:shadow-md border-slate-200/90 shadow-2xs'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white group-hover:bg-teal-700 transition-colors">
                          {feature.canonicalName}
                        </span>
                        {feature.isDerived && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                            Derived
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {feature.category}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-900 transition-colors leading-snug">
                      {feature.label}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  <div className="space-y-2.5 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-mono">
                        {feature.dataType}
                        {feature.unit ? ` (${feature.unit})` : ''}
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        {feature.schemaConstraints.min !== undefined && feature.schemaConstraints.max !== undefined
                          ? `[${feature.schemaConstraints.min}, ${feature.schemaConstraints.max}]`
                          : feature.schemaConstraints.allowedValues
                          ? `{${feature.schemaConstraints.allowedValues.join(',')}}`
                          : 'Pydantic valid'}
                      </span>
                    </div>

                    {/* SHAP Badges if in Top 10 */}
                    {(cathRank || ladRank || lcxRank || rcaRank) && (
                      <div className="flex items-center gap-1 font-mono text-[10px] flex-wrap">
                        {cathRank && (
                          <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold" title="Cath Model Top 10">
                            Cath #{cathRank}
                          </span>
                        )}
                        {ladRank && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold" title="LAD Model Top 10">
                            LAD #{ladRank}
                          </span>
                        )}
                        {lcxRank && (
                          <span className="px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 font-bold" title="LCX Model Top 10">
                            LCX #{lcxRank}
                          </span>
                        )}
                        {rcaRank && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold" title="RCA Model Top 10">
                            RCA #{rcaRank}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-teal-700 font-semibold group-hover:text-teal-800 pt-0.5">
                      <span className="text-[11px]">Inspect clinical details</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* D. CENTERED FEATURE DETAIL INSPECTOR MODAL */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="feature-modal-title"
          aria-describedby="feature-modal-description"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
          onClick={handleCloseModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl max-h-[88vh] flex flex-col bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden relative animate-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="shrink-0 px-6 py-4.5 bg-white border-b border-slate-100 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                    {selectedFeature.category}
                  </span>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                    {selectedFeature.canonicalName}
                  </span>
                  {selectedFeature.isDerived && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                      Derived Input
                    </span>
                  )}
                  {filteredFeatures.length > 0 && currentFeatureIndex >= 0 && (
                    <span className="text-[11px] font-mono text-slate-400">
                      Feature {currentFeatureIndex + 1} of {filteredFeatures.length}
                    </span>
                  )}
                </div>
                <h2
                  id="feature-modal-title"
                  className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight mt-1 truncate"
                >
                  {selectedFeature.label}
                </h2>
              </div>

              {/* Header Controls: Prev/Next & Close */}
              <div className="flex items-center gap-2 shrink-0">
                {filteredFeatures.length > 1 && (
                  <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5">
                    <button
                      type="button"
                      onClick={handlePrevFeature}
                      aria-label="Previous feature"
                      title="Previous feature (Left Arrow)"
                      className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="h-3 w-px bg-slate-200" />
                    <button
                      type="button"
                      onClick={handleNextFeature}
                      aria-label="Next feature"
                      title="Next feature (Right Arrow)"
                      className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={handleCloseModal}
                  aria-label="Close feature details"
                  title="Close (Escape)"
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
              {/* Feature Quick Meta Badges */}
              <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-semibold">
                  Data Type: {selectedFeature.dataType}
                </span>
                {selectedFeature.unit && (
                  <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 font-semibold border border-sky-200">
                    Measurement Unit: {selectedFeature.unit}
                  </span>
                )}
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                  Validation: Strict Pydantic
                </span>
                {selectedFeature.isDerived && (
                  <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 font-bold border border-purple-200">
                    Derived from Raw Inputs
                  </span>
                )}
              </div>

              {/* Section 1: Clinical Definition & Pathophysiology */}
              <div className="space-y-2.5 text-xs sm:text-sm">
                <h3 className="font-bold text-slate-900 uppercase font-mono tracking-wider text-[11px] text-slate-500">
                  Clinical Definition & Physiological Significance
                </h3>
                <p id="feature-modal-description" className="text-slate-700 leading-relaxed text-xs sm:text-sm">
                  {selectedFeature.description}
                </p>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-slate-600 leading-relaxed text-xs">
                  <strong className="text-slate-900 block text-xs mb-1 font-semibold">
                    Pathophysiological Significance in CAD:
                  </strong>
                  {selectedFeature.clinicalSignificance}
                </div>
              </div>

              {/* Section 2: Rigorous 3-Way Range Provenance */}
              <div className="space-y-3 text-xs border-t border-slate-100 pt-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold uppercase font-mono tracking-wider text-[11px] text-slate-500">
                    3-Way Range Provenance & Reference Boundaries
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">Clinically & Mathematically Non-Interchangeable</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* 1. Schema-Permitted Validation Range */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                        <span className="font-bold text-slate-800">1. Schema-Permitted</span>
                        <span className="text-teal-700 font-semibold">Validation Boundary</span>
                      </div>
                      <div className="font-mono text-xs text-slate-900 font-bold">
                        {selectedFeature.schemaConstraints.min !== undefined && selectedFeature.schemaConstraints.max !== undefined ? (
                          `[${selectedFeature.schemaConstraints.min}, ${selectedFeature.schemaConstraints.max}] ${selectedFeature.unit || ''}`
                        ) : selectedFeature.schemaConstraints.allowedValues ? (
                          `Allowed: {${selectedFeature.schemaConstraints.allowedValues.join(', ')}}`
                        ) : (
                          selectedFeature.schemaConstraints.pydanticType
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed pt-1 border-t border-slate-200/60">
                      Enforced by <code>backend/schemas.py</code>. Inputs outside this interval are rejected with HTTP 422.
                    </p>
                  </div>

                  {/* 2. Dataset-Observed Distribution */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                        <span className="font-bold text-slate-800">2. Dataset-Observed</span>
                        <span className="text-indigo-700 font-semibold">N=303 Cohort</span>
                      </div>
                      {selectedFeature.datasetStats ? (
                        <div className="grid grid-cols-4 gap-1 font-mono text-[11px] py-1 text-center bg-white rounded-lg border border-slate-200/60">
                          <div>
                            <span className="text-[9px] text-slate-400 block">Min</span>
                            <strong className="text-slate-800">{selectedFeature.datasetStats.min}</strong>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block">Mean</span>
                            <strong className="text-slate-800">{selectedFeature.datasetStats.mean}</strong>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block">Med</span>
                            <strong className="text-slate-800">{selectedFeature.datasetStats.median}</strong>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block">Max</span>
                            <strong className="text-slate-800">{selectedFeature.datasetStats.max}</strong>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-700 font-mono">
                          {selectedFeature.clinicalReferenceNotes || 'Categorical distribution in cohort metadata.'}
                        </p>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed pt-1 border-t border-slate-200/60">
                      Derived from <code>cad_clean.csv</code>; reflects Tehran Heart Center catheterization cohort.
                    </p>
                  </div>

                  {/* 3. Clinically Established Reference Range */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                        <span className="font-bold text-slate-800">3. Clinical Standard</span>
                        <span className="text-emerald-700 font-semibold">Guidelines</span>
                      </div>
                      <p className="text-xs text-slate-800 font-medium leading-snug">
                        {selectedFeature.clinicalReferenceRange}
                      </p>
                    </div>
                    {selectedFeature.clinicalReferenceNotes && (
                      <p className="text-[10px] text-slate-500 leading-relaxed pt-1 border-t border-slate-200/60">
                        Cohort caveat: {selectedFeature.clinicalReferenceNotes}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 3: Preprocessing & Missing Value Behavior */}
              <div className="space-y-3 text-xs border-t border-slate-100 pt-5">
                <h3 className="font-bold uppercase font-mono tracking-wider text-[11px] text-slate-500">
                  Pipeline Preprocessing & Zero-Defaults Policy
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1">
                    <span className="font-semibold text-slate-800 block text-[11px]">ML Preprocessing Transformation:</span>
                    <p className="text-slate-600 font-mono text-[11px]">
                      {selectedFeature.preprocessingMethod}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1">
                    <span className="font-semibold text-slate-800 block text-[11px]">Missing-Value Policy:</span>
                    <p className="text-slate-600 text-[11px]">
                      {selectedFeature.missingValueBehavior}
                    </p>
                  </div>
                </div>

                {/* Deterministic Derivation Formula if applicable */}
                {selectedFeature.isDerived && (
                  <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 space-y-2 text-purple-950">
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Sparkles className="w-4 h-4 text-purple-700" />
                      <span>Deterministic Derivation Rule</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white font-mono text-xs border border-purple-200 font-semibold text-purple-900">
                      {selectedFeature.derivationFormula}
                    </div>
                    <p className="text-[11px] text-purple-800">
                      Formula Source: {selectedFeature.derivationSource}
                    </p>
                  </div>
                )}
              </div>

              {/* Section 4: Target-Specific Global SHAP Summary */}
              <div className="space-y-3 text-xs border-t border-slate-100 pt-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold uppercase font-mono tracking-wider text-[11px] text-slate-500">
                    Global SHAP Importance Across All Coronary Targets
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">Mean |SHAP| (Probability Scale)</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(['Cath', 'LAD', 'LCX', 'RCA'] as TargetName[]).map((t) => {
                    const entry = shapFeatureMap[t]?.[selectedFeature.canonicalName];
                    return (
                      <div
                        key={t}
                        className={`p-3 rounded-2xl border text-xs space-y-1.5 ${
                          entry
                            ? 'bg-indigo-50/60 border-indigo-200/90'
                            : 'bg-slate-50 border-slate-200/70'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono">
                          <strong className="text-slate-900">{t}</strong>
                          {entry ? (
                            <span className="text-indigo-700 font-bold text-[11px]">
                              Rank #{entry.rank}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">
                              &gt;10 (Unreported)
                            </span>
                          )}
                        </div>
                        {entry ? (
                          <div className="text-[11px] font-mono text-slate-700 font-medium">
                            {(entry.mean_absolute_shap * 100).toFixed(2)}% ({entry.mean_absolute_shap.toFixed(4)})
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-500 leading-tight">
                            Outside top 10 (non-zero unranked)
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  *Note: <code>GET /explain/global</code> returns the top 10 features per model. Features outside the top 10 have non-zero attributions that are not ranked by the endpoint.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="shrink-0 px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 text-xs text-slate-500">
              <div className="text-[10px] font-mono text-slate-400 truncate">
                Audit Provenance: {selectedFeature.provenanceEvidence}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {filteredFeatures.length > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handlePrevFeature}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors inline-flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Prev</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNextFeature}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors inline-flex items-center gap-1"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* E. GLOBAL SHAP TARGET-BY-TARGET EXPLORER SECTION */}
      {/* ========================================================= */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700">
                <TrendingUp className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-slate-900">
                Population-Level TreeSHAP Importance (|SHAP|)
              </h2>
              <span className="text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full border border-indigo-200">
                Tehran Heart Center (N=303)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Select an anatomical coronary model target to inspect top canonical feature attributions in probability units.
            </p>
          </div>

          {/* Target Switcher Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['Cath', 'LAD', 'LCX', 'RCA'] as TargetName[]).map((t) => {
              const isSelected = activeShapTarget === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActiveShapTarget(t)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{t}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Target Description */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 flex items-start gap-3">
          <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-900 block font-mono">
              Target: {TARGET_INFO[activeShapTarget].label} ({TARGET_INFO[activeShapTarget].vessel})
            </span>
            <p className="text-slate-600 mt-0.5">
              {TARGET_INFO[activeShapTarget].description}
            </p>
          </div>
        </div>

        {/* Loading State */}
        {shapLoading && (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
            <p className="text-xs font-medium text-slate-500">
              Fetching population-level SHAP values from FastAPI backend...
            </p>
          </div>
        )}

        {/* Error State with Retry */}
        {!shapLoading && shapError && (
          <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Failed to Load Global SHAP Importance</span>
            </div>
            <p className="text-xs text-rose-700 leading-relaxed">{shapError}</p>
            <button
              type="button"
              onClick={loadShapData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Fetch</span>
            </button>
          </div>
        )}

        {/* Success State: Top 10 Features Bar Chart */}
        {!shapLoading && !shapError && shapData && (
          <div className="space-y-4">
            {(() => {
              const targetObj = shapData.targets[activeShapTarget];
              const features = targetObj?.top_features ?? [];
              if (features.length === 0) {
                return (
                  <div className="py-8 text-center text-xs text-slate-400 font-mono">
                    No global SHAP importance reported for {activeShapTarget}.
                  </div>
                );
              }
              const maxVal = Math.max(...features.map((f) => f.mean_absolute_shap), 0.001);

              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1 border-b border-slate-100 pb-1.5">
                    <span>Rank & Canonical Predictor (Click to inspect)</span>
                    <span>Mean |SHAP| (Probability Impact & Fraction)</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {features.map((item) => {
                      const isSelected = selectedFeature.canonicalName === item.feature_name;
                      const relativeWidthPct = Math.min(100, Math.max(3, (item.mean_absolute_shap / maxVal) * 100));
                      const pctStr = (item.mean_absolute_shap * 100).toFixed(2) + '%';

                      return (
                        <div
                          key={item.rank}
                          onClick={(e) => handleOpenFeature(item.feature_name, e.currentTarget)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleOpenFeature(item.feature_name, e.currentTarget);
                            }
                          }}
                          aria-haspopup="dialog"
                          aria-label={`Inspect top predictor ${item.feature_name}`}
                          className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                            isSelected && isModalOpen
                              ? 'bg-teal-50 border-teal-300 ring-1 ring-teal-500/20'
                              : 'bg-slate-50/70 hover:bg-slate-100/80 border-slate-200/80'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-6 text-right font-mono text-[11px] font-bold text-slate-400">
                                #{item.rank}
                              </span>
                              <span className="font-semibold text-slate-900 truncate" title={item.feature_name}>
                                {item.feature_name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 font-mono shrink-0 text-right">
                              <span className="font-bold text-slate-900">{pctStr}</span>
                              <span className="text-[11px] text-slate-400">
                                ({item.mean_absolute_shap.toFixed(4)})
                              </span>
                            </div>
                          </div>
                          {/* Horizontal Bar */}
                          <div className="h-2 w-full bg-slate-200/80 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                              style={{ width: `${relativeWidthPct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Coverage Notice */}
                  <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs leading-relaxed space-y-1">
                    <strong className="block text-[11px] font-semibold text-amber-950">
                      Transparent Endpoint Coverage Disclosure:
                    </strong>
                    <p>
                      The <code>GET /explain/global</code> backend endpoint computes TreeSHAP across all 54 canonical features for the 303 cohort patients and outputs the top 10 features per model. The 44 unranked features have non-zero attributions that fall below the top 10 rank. They are not displayed here and must not be assumed to have zero importance.
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* F. SCIENTIFIC INTEGRITY & METHODOLOGICAL PRINCIPLES */}
      {/* ========================================================= */}
      <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/90 space-y-5">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <Scale className="w-4 h-4 text-teal-600" />
          <span>Scientific Integrity, Attribution Boundaries & Clinical Governance</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-slate-600">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/70 space-y-1.5 shadow-2xs">
            <strong className="text-slate-900 block text-xs">
              1. Statistical Attribution vs. Biological Causation
            </strong>
            <p>
              SHAP feature importance quantifies model decision attribution (marginal contribution to positive-class probability in the fitted Random Forest trees). It reflects correlational predictive signals within this specific training cohort, NOT biological causality, direct physiological mechanisms, or treatment efficacy.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/70 space-y-1.5 shadow-2xs">
            <strong className="text-slate-900 block text-xs">
              2. Single-Center Cohort Scope (Tehran Heart Center, N=303)
            </strong>
            <p>
              All models were trained on 303 patients referred for coronary angiography at Tehran Heart Center (2013). Because all participants were referred due to clinical suspicion of CAD, pre-test probability and disease prevalence (Cath 71.3%, LAD 58.4%, LCX 39.3%, RCA 37.6%) are higher than in general primary-care screening populations.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/70 space-y-1.5 shadow-2xs">
            <strong className="text-slate-900 block text-xs">
              3. Independent Target Models with Divergent Performance
            </strong>
            <p>
              Cath, LAD, LCX, and RCA are four separate, independent Random Forest estimators. Their validated 5-fold cross-validation performances differ significantly: Cath achieves ROC-AUC 0.9195 ± 0.044, LAD achieves 0.8383 ± 0.076, LCX achieves 0.7199 ± 0.084, and RCA achieves 0.7340 ± 0.059. Feature rankings naturally vary across targets.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/70 space-y-1.5 shadow-2xs">
            <strong className="text-slate-900 block text-xs">
              4. Global Attribution vs. Patient-Specific Explanation
            </strong>
            <p>
              Global SHAP averages absolute contributions across the entire cohort ($E[|\phi_j|]$). A feature ranked lower at the cohort level may exert a major local push for an individual patient who presents with extreme laboratory or hemodynamic values. Use the Individual Assessment Report for local patient attributions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
