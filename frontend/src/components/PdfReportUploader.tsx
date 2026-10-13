import React, { useState, useRef, useMemo } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Zap,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Info,
  Check,
  ArrowRight,
  Sparkles,
  Layers,
  Activity,
  FileCheck2,
} from 'lucide-react';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export interface PageExtractionSummary {
  page_number: number;
  extraction_method: 'text' | 'ocr' | 'failed' | 'empty';
  char_count: number;
  word_count: number;
  ocr_applied: boolean;
  ocr_warning?: string | null;
}

export type MappingStatus = 'matched' | 'ambiguous' | 'missing' | 'conflicting' | 'invalid_range';

export interface FieldMappingDetail {
  field_alias: string;
  clinical_label: string;
  category: string;
  expected_type: string;
  value: number | string | null;
  status: MappingStatus;
  confidence: number;
  unit?: string | null;
  source_snippet?: string | null;
  page_number?: number | null;
  alternatives?: (number | string)[] | null;
  validation_error?: string | null;
  requires_review: boolean;
}

export interface PdfProcessResponse {
  filename: string;
  file_size_bytes: number;
  total_pages: number;
  ocr_available: boolean;
  ocr_notice?: string | null;
  processing_time_ms: number;
  page_summary: PageExtractionSummary[];
  mappings: Record<string, FieldMappingDetail>;
  total_features: number;
  matched_count: number;
  ambiguous_count: number;
  missing_count: number;
  conflicting_count: number;
  invalid_count: number;
  ready_for_inference: boolean;
  missing_or_invalid_fields: string[];
  prefilled_patient_data: Record<string, any>;
  prototype_disclaimer: string;
}

export interface PredictionItem {
  target: string;
  predicted_class: number;
  predicted_label: string;
  probability: number;
  applied_threshold?: number;
  threshold_strategy?: string;
  threshold_status?: string;
  model_name?: string;
  model_type?: string;
  standard_class?: number;
  standard_label?: string;
}

const CATEGORY_ORDER = [
  'Demographics',
  'Physical Measurement',
  'Vital Signs',
  'Medical History',
  'Lifestyle',
  'Physical Exam',
  'Symptoms',
  'Clinical Status',
  'ECG',
  'Laboratory',
  'Echocardiography',
];

export const PdfReportUploader: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [processResult, setProcessResult] = useState<PdfProcessResponse | null>(null);

  // Editable working copy of the 54 features
  const [editedValues, setEditedValues] = useState<Record<string, any>>({});
  const [filterMode, setFilterMode] = useState<'all' | 'review_only' | 'matched_only'>('all');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [expandedSnippets, setExpandedSnippets] = useState<Record<string, boolean>>({});

  // Model selection: production vs experimental
  const [modelMode, setModelMode] = useState<'production' | 'experimental'>('production');

  // Inference execution states
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionResults, setPredictionResults] = useState<{
    mode: 'production' | 'experimental';
    predictions: Record<string, PredictionItem>;
    disclaimer: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper fetch with fallback from 127.0.0.1 to localhost
  const resilientFetch = async (endpoint: string, options: RequestInit) => {
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, options);
      return res;
    } catch (primaryErr) {
      // Fallback if 127.0.0.1 failed
      if (API_BASE_URL.includes('127.0.0.1')) {
        const altBase = API_BASE_URL.replace('127.0.0.1', 'localhost');
        return await fetch(`${altBase}${endpoint}`, options);
      }
      throw primaryErr;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    setUploadError(null);
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Only PDF documents are supported (.pdf).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setUploadError('File exceeds maximum allowed limit of 15 MB.');
      return;
    }
    setSelectedFile(file);
    setProcessResult(null);
    setPredictionResults(null);
  };

  const loadSamplePdf = async (
    publicFilename: string,
    backendFallbackEndpoint: string
  ) => {
    setUploadError(null);
    try {
      let resp: Response | null = null;

      // 1. Attempt fetching from Vite public assets (root-relative and BASE_URL)
      const base = (import.meta as any).env?.BASE_URL || '/';
      const candidateUrls = [
        `/${publicFilename}`,
        `${base}${publicFilename.replace(/^\//, '')}`,
      ];

      for (const url of candidateUrls) {
        try {
          const r = await fetch(url, { cache: 'no-cache' });
          if (r.ok) {
            resp = r;
            break;
          }
        } catch {
          // Fall through to next candidate or backend fallback
        }
      }

      // 2. Fallback to backend resilient endpoint if Vite static fetch wasn't successful
      if (!resp || !resp.ok) {
        try {
          const r = await resilientFetch(backendFallbackEndpoint, { method: 'GET' });
          if (r.ok) {
            resp = r;
          }
        } catch {
          // Fall through to error below
        }
      }

      if (!resp || !resp.ok) {
        throw new Error(`File could not be fetched from /${publicFilename} or ${backendFallbackEndpoint}`);
      }

      const blob = await resp.blob();
      const file = new File([blob], publicFilename, { type: 'application/pdf' });
      validateAndSetFile(file);
    } catch (err: any) {
      setUploadError(
        `Failed to fetch synthetic report from /${publicFilename}: ${err.message || 'Unknown network error'}`
      );
    }
  };

  const handleLoadSamplePdf = () => {
    loadSamplePdf('synthetic_patient_report.pdf', '/pdf/sample-reports/text');
  };

  const handleLoadScannedSamplePdf = () => {
    loadSamplePdf('synthetic_scanned_patient_report.pdf', '/pdf/sample-reports/scanned');
  };

  const handleUploadAndExtract = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError(null);
    setProcessResult(null);
    setPredictionResults(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await resilientFetch('/pdf/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(errJson.detail || `Server returned status ${response.status}`);
      }

      const data: PdfProcessResponse = await response.json();
      setProcessResult(data);

      // Initialize working copy from extracted data
      const initialValues: Record<string, any> = {};
      Object.entries(data.mappings).forEach(([alias, detail]) => {
        initialValues[alias] = detail.value !== null && detail.value !== undefined ? detail.value : '';
      });
      setEditedValues(initialValues);
    } catch (err: any) {
      setUploadError(
        err.message ||
          'Failed to connect to backend service. Ensure FastAPI is running on port 8000.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleFieldChange = (fieldAlias: string, rawVal: any) => {
    setEditedValues((prev) => ({
      ...prev,
      [fieldAlias]: rawVal,
    }));
    // Clear prediction result when inputs are modified
    if (predictionResults) {
      setPredictionResults(null);
    }
  };

  const toggleSnippet = (alias: string) => {
    setExpandedSnippets((prev) => ({
      ...prev,
      [alias]: !prev[alias],
    }));
  };

  // Group mappings by category
  const categoriesList = useMemo(() => {
    if (!processResult) return [];
    const set = new Set<string>();
    Object.values(processResult.mappings).forEach((m) => set.add(m.category));
    return Array.from(set).sort((a, b) => {
      const idxA = CATEGORY_ORDER.indexOf(a);
      const idxB = CATEGORY_ORDER.indexOf(b);
      return (idxA >= 0 ? idxA : 99) - (idxB >= 0 ? idxB : 99);
    });
  }, [processResult]);

  // Filtered list of features
  const displayedFeatures = useMemo(() => {
    if (!processResult) return [];
    let items = Object.entries(processResult.mappings);

    if (activeCategory !== 'All') {
      items = items.filter(([, detail]) => detail.category === activeCategory);
    }

    if (filterMode === 'review_only') {
      items = items.filter(([, detail]) => detail.requires_review || detail.status !== 'matched');
    } else if (filterMode === 'matched_only') {
      items = items.filter(([, detail]) => detail.status === 'matched');
    }

    return items;
  }, [processResult, activeCategory, filterMode]);

  // Pre-validate current edited fields against backend schema
  const handleValidateAndPredict = async () => {
    if (!processResult) return;

    setIsValidating(true);
    setValidationErrors([]);

    // Construct typed payload matching PatientInput exactly
    const typedPayload: Record<string, any> = {};

    Object.entries(processResult.mappings).forEach(([alias, defn]) => {
      const currentVal = editedValues[alias];

      if (currentVal === '' || currentVal === null || currentVal === undefined) {
        typedPayload[alias] = null;
        return;
      }

      if (defn.expected_type === 'float') {
        typedPayload[alias] = parseFloat(currentVal);
      } else if (defn.expected_type === 'binary_int') {
        typedPayload[alias] = parseInt(currentVal, 10);
      } else if (defn.expected_type === 'categorical_choice') {
        if (alias === 'Function Class' || alias === 'Region RWMA') {
          typedPayload[alias] = parseInt(currentVal, 10);
        } else {
          typedPayload[alias] = currentVal;
        }
      } else {
        typedPayload[alias] = currentVal;
      }
    });

    try {
      // Step 1: Validate payload with backend schema validation route
      const valRes = await resilientFetch('/pdf/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_data: typedPayload }),
      });

      if (!valRes.ok) {
        throw new Error('Validation request failed on server');
      }

      const valData = await valRes.json();

      if (!valData.is_valid) {
        const errorMessages = (valData.errors || []).map(
          (err: any) => `${err.field}: ${err.message}`
        );
        setValidationErrors(errorMessages);
        setIsValidating(false);
        return;
      }

      // Step 2: Payload passed validation! Now call chosen prediction endpoint
      setIsPredicting(true);
      const predictEndpoint =
        modelMode === 'experimental' ? '/predict/experimental' : '/predict';

      const predRes = await resilientFetch(predictEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(typedPayload),
      });

      if (!predRes.ok) {
        const pErr = await predRes.json().catch(() => ({ detail: 'Prediction failed' }));
        throw new Error(pErr.detail || `Prediction error (${predRes.status})`);
      }

      const predData = await predRes.json();
      setPredictionResults({
        mode: modelMode,
        predictions: predData.predictions,
        disclaimer: predData.disclaimer,
      });
    } catch (err: any) {
      setValidationErrors([err.message || 'An error occurred during inference.']);
    } finally {
      setIsValidating(false);
      setIsPredicting(false);
    }
  };

  const getVesselRiskBadge = (prob: number) => {
    const pct = Math.round(prob * 100);
    if (prob < 0.4) {
      return {
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        bar: 'bg-emerald-500',
        text: `Low (${pct}%)`,
      };
    }
    if (prob < 0.7) {
      return {
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        bar: 'bg-amber-500',
        text: `Moderate (${pct}%)`,
      };
    }
    return {
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
      bar: 'bg-rose-500',
      text: `High (${pct}%)`,
    };
  };

  return (
    <div className="w-full text-slate-100 space-y-6">
      {/* ======================================================== */}
      {/* 1. UPLOAD BOX & OCR STATUS BANNER */}
      {/* ======================================================== */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-cyan-400" />
              <span>Medical Report PDF Upload</span>
            </h3>
            <p className="text-xs text-slate-400">
              Upload patient reports (lab panels, ECG summaries, echo notes). Mixed text and scanned pages are supported.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>100% Local Ingestion (Zero External APIs)</span>
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="relative border-2 border-dashed border-slate-700/80 hover:border-cyan-500/60 rounded-2xl p-6 sm:p-8 text-center cursor-pointer bg-slate-950/50 hover:bg-slate-950/80 transition-all group"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,application/pdf"
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 group-hover:bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 transition-all">
              <FileText className="w-6 h-6" />
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                {selectedFile ? selectedFile.name : 'Click to select or drag & drop a PDF report here'}
              </p>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                {selectedFile
                  ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to analyze`
                  : 'PDF format up to 15 MB • Standard 54-feature clinical extraction'}
              </p>
            </div>
          </div>
        </div>

        {/* Upload Action Button & Loading Feedback */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 font-mono">
              {selectedFile ? `Selected: ${selectedFile.name}` : 'No file chosen'}
            </span>
            <button
              type="button"
              onClick={handleLoadSamplePdf}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-[11px] font-mono transition-colors"
            >
              Sample (Text PDF)
            </button>
            <button
              type="button"
              onClick={handleLoadScannedSamplePdf}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-[11px] font-mono transition-colors"
            >
              Sample (Scanned PDF)
            </button>
          </div>

          <button
            type="button"
            onClick={handleUploadAndExtract}
            disabled={!selectedFile || isUploading}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-cyan-950/40 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {isUploading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-200" />
                <span>Extracting Text & OCR...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-cyan-200" />
                <span>Extract & Map Clinical Features</span>
              </>
            )}
          </button>
        </div>

        {uploadError && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-200">Processing Error</p>
              <p className="mt-0.5">{uploadError}</p>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 2. EXTRACTION TELEMETRY & AUDIT BANNER */}
      {/* ======================================================== */}
      {processResult && (
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Extraction Summary: {processResult.filename}</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                    {processResult.processing_time_ms} ms
                  </span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Processed {processResult.total_pages} page(s) • Matched {processResult.matched_count}/54 features
                </p>
              </div>
            </div>

            {/* Quick Metrics Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                {processResult.matched_count} Matched
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30">
                {processResult.ambiguous_count + processResult.conflicting_count} Ambiguous
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
                {processResult.missing_count} Missing
              </span>
            </div>
          </div>

          {/* OCR Notice if applicable */}
          {processResult.ocr_notice && !processResult.ocr_available && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white">OCR Engine Notice: </span>
                <span>{processResult.ocr_notice}</span>
              </div>
            </div>
          )}

          {/* Clinical Safety Protocol: Require Manual Confirmation */}
          <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-slate-300 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Mandatory Clinical Review: </span>
              <span>
                Antigravity AI strictly forbids guessing medical data. Every extracted value displays source context. Please verify all values and complete missing parameters before requesting prediction.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. CLINICAL FEATURE REVIEW & CORRECTION TABLE */}
      {/* ======================================================== */}
      {processResult && (
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Clinical Parameter Review & Editing</h3>
              <p className="text-xs text-slate-400">
                Correct values or fill in missing parameters directly in the fields below.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterMode === 'all'
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All (54)
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('review_only')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterMode === 'review_only'
                    ? 'bg-amber-500/20 text-amber-300 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Needs Review ({54 - processResult.matched_count})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('matched_only')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterMode === 'matched_only'
                    ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Matched ({processResult.matched_count})
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 custom-scrollbar">
            <button
              type="button"
              onClick={() => setActiveCategory('All')}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeCategory === 'All'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Categories
            </button>
            {categoriesList.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
            {displayedFeatures.map(([alias, detail]) => {
              const currentVal = editedValues[alias] ?? '';
              const isExpanded = !!expandedSnippets[alias];

              return (
                <div
                  key={alias}
                  className={`p-4 rounded-xl border transition-all ${
                    detail.status === 'matched'
                      ? 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                      : detail.status === 'ambiguous' || detail.status === 'conflicting'
                      ? 'bg-amber-950/10 border-amber-500/30'
                      : detail.status === 'invalid_range'
                      ? 'bg-rose-950/10 border-rose-500/30'
                      : 'bg-slate-950/80 border-slate-800/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{detail.clinical_label}</span>
                        <span className="text-[10px] font-mono text-slate-500">({alias})</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {detail.category} {detail.unit ? `• [${detail.unit}]` : ''}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border whitespace-nowrap ${
                        detail.status === 'matched'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : detail.status === 'ambiguous' || detail.status === 'conflicting'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : detail.status === 'invalid_range'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {detail.status === 'matched'
                        ? 'Matched'
                        : detail.status === 'ambiguous'
                        ? 'Ambiguous'
                        : detail.status === 'conflicting'
                        ? 'Conflicting'
                        : detail.status === 'invalid_range'
                        ? 'Out of Bounds'
                        : 'Missing'}
                    </span>
                  </div>

                  {/* Input Element based on Expected Type */}
                  <div className="mt-2.5">
                    {detail.expected_type === 'binary_int' ? (
                      <select
                        value={currentVal === '' ? '' : currentVal}
                        onChange={(e) =>
                          handleFieldChange(
                            alias,
                            e.target.value === '' ? '' : parseInt(e.target.value, 10)
                          )
                        }
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                      >
                        <option value="">-- Select (Required) --</option>
                        <option value={0}>0 : No / Absent / Negative</option>
                        <option value={1}>1 : Yes / Present / Positive</option>
                      </select>
                    ) : detail.expected_type === 'binary_str' ? (
                      <select
                        value={currentVal === '' ? '' : currentVal}
                        onChange={(e) => handleFieldChange(alias, e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                      >
                        <option value="">-- Select (Required) --</option>
                        <option value="N">N : No / Negative / Normal</option>
                        <option value="Y">Y : Yes / Positive / Present</option>
                      </select>
                    ) : alias === 'Sex' ? (
                      <select
                        value={currentVal}
                        onChange={(e) => handleFieldChange(alias, e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                      >
                        <option value="">-- Select Biological Sex --</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    ) : alias === 'Function Class' ? (
                      <select
                        value={currentVal === '' ? '' : currentVal}
                        onChange={(e) =>
                          handleFieldChange(
                            alias,
                            e.target.value === '' ? '' : parseInt(e.target.value, 10)
                          )
                        }
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                      >
                        <option value="">-- Select NYHA Class --</option>
                        <option value={0}>0 : No Symptoms</option>
                        <option value={1}>1 : NYHA Class I (Mild)</option>
                        <option value={2}>2 : NYHA Class II (Moderate)</option>
                        <option value={3}>3 : NYHA Class III / IV (Severe)</option>
                      </select>
                    ) : alias === 'BBB' ? (
                      <select
                        value={currentVal}
                        onChange={(e) => handleFieldChange(alias, e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                      >
                        <option value="">-- Select Bundle Branch Block --</option>
                        <option value="N">N : Normal (No Block)</option>
                        <option value="LBBB">LBBB : Left Bundle Branch Block</option>
                        <option value="RBBB">RBBB : Right Bundle Branch Block</option>
                      </select>
                    ) : alias === 'Region RWMA' ? (
                      <select
                        value={currentVal === '' ? '' : currentVal}
                        onChange={(e) =>
                          handleFieldChange(
                            alias,
                            e.target.value === '' ? '' : parseInt(e.target.value, 10)
                          )
                        }
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                      >
                        <option value="">-- Select Wall Motion Score (0-4) --</option>
                        <option value={0}>0 : Normal Wall Motion</option>
                        <option value={1}>1 : Hypokinesia</option>
                        <option value={2}>2 : Akinesia</option>
                        <option value={3}>3 : Dyskinesia</option>
                        <option value={4}>4 : Aneurysmal</option>
                      </select>
                    ) : alias === 'VHD' ? (
                      <select
                        value={currentVal}
                        onChange={(e) => handleFieldChange(alias, e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                      >
                        <option value="">-- Select Valvular Heart Disease --</option>
                        <option value="Normal">Normal</option>
                        <option value="Mild">Mild</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Severe">Severe</option>
                      </select>
                    ) : (
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          value={currentVal}
                          onChange={(e) =>
                            handleFieldChange(
                              alias,
                              e.target.value === '' ? '' : e.target.value
                            )
                          }
                          placeholder={detail.unit ? `e.g. in ${detail.unit}` : 'Enter value'}
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                        {detail.unit && (
                          <span className="absolute right-3 top-1.5 text-[10px] text-slate-500 font-mono pointer-events-none">
                            {detail.unit}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Alternative candidate options (for ambiguous cases) */}
                  {detail.alternatives && detail.alternatives.length > 0 && (
                    <div className="mt-2 p-2 rounded-lg bg-amber-950/20 border border-amber-500/20 text-[11px] text-amber-300">
                      <span className="font-semibold">Detected candidate values: </span>
                      <div className="flex gap-1.5 mt-1 flex-wrap">
                        {detail.alternatives.map((alt, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleFieldChange(alias, alt)}
                            className="px-2 py-0.5 rounded bg-slate-900 border border-amber-500/40 text-amber-200 hover:bg-amber-500/20 text-[10px] font-mono transition-colors"
                          >
                            Use {String(alt)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Evidence snippet toggle */}
                  {detail.source_snippet && (
                    <div className="mt-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => toggleSnippet(alias)}
                        className="inline-flex items-center gap-1 text-slate-400 hover:text-cyan-300 transition-colors font-mono text-[10px]"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                        <span>Report Evidence (Page {detail.page_number || 1})</span>
                      </button>

                      {isExpanded && (
                        <div className="mt-1 p-2 rounded bg-black/40 border border-slate-800 text-[11px] font-mono text-slate-300 italic">
                          &quot;{detail.source_snippet}&quot;
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Validation Errors Summary Banner */}
          {validationErrors.length > 0 && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1.5">
              <div className="font-semibold flex items-center gap-1.5 text-rose-200">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>
                  Validation Blocked ({validationErrors.length} issues need resolution):
                </span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] font-mono">
                {validationErrors.slice(0, 5).map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
                {validationErrors.length > 5 && (
                  <li>...and {validationErrors.length - 5} more fields</li>
                )}
              </ul>
            </div>
          )}

          {/* ======================================================== */}
          {/* 4. MODEL SELECTION & INFERENCE TRIGGER */}
          {/* ======================================================== */}
          <div className="pt-4 border-t border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Select Prediction Pipeline
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="radio"
                      name="modelMode"
                      value="production"
                      checked={modelMode === 'production'}
                      onChange={() => setModelMode('production')}
                      className="text-cyan-500 focus:ring-cyan-500"
                    />
                    <span className="text-slate-200 font-medium">Production Models</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      Random Forest (ml/artifacts)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="radio"
                      name="modelMode"
                      value="experimental"
                      checked={modelMode === 'experimental'}
                      onChange={() => setModelMode('experimental')}
                      className="text-cyan-500 focus:ring-cyan-500"
                    />
                    <span className="text-slate-200 font-medium">Experimental Models</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                      Voting & Stacking Ensembles
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleValidateAndPredict}
                disabled={isValidating || isPredicting}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-cyan-950/40 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isValidating || isPredicting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-200" />
                    <span>Validating & Running Inference...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-cyan-200" />
                    <span>Validate & Predict Cardiac Risk</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. MULTI-VESSEL PREDICTION RESULTS VISUALIZATION */}
      {/* ======================================================== */}
      {predictionResults && (
        <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-cyan-500/40 shadow-2xl space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 text-cyan-400">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>Cardiovascular Risk Prediction Results</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 uppercase">
                    {predictionResults.mode} Pipeline
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Coronary artery disease and vessel-specific stenosis predictions based on validated patient data.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Inference Complete</span>
            </div>
          </div>

          {/* 4 Target Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(['Cath', 'LAD', 'LCX', 'RCA'] as const).map((targetKey) => {
              const pred = predictionResults.predictions[targetKey];
              if (!pred) return null;

              const badge = getVesselRiskBadge(pred.probability);
              const targetTitle =
                targetKey === 'Cath'
                  ? 'Overall CAD (Cath)'
                  : targetKey === 'LAD'
                  ? 'Left Anterior Descending'
                  : targetKey === 'LCX'
                  ? 'Left Circumflex'
                  : 'Right Coronary Artery';

              return (
                <div
                  key={targetKey}
                  className="p-5 rounded-xl bg-slate-950 border border-slate-800 shadow-inner flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white font-mono">{targetKey}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${
                          pred.predicted_class === 1
                            ? 'bg-rose-500/10 text-rose-300 border-rose-500/40'
                            : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40'
                        }`}
                      >
                        {pred.predicted_label}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">{targetTitle}</div>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between text-xs mb-1">
                      <span className="text-slate-400 font-mono">Probability:</span>
                      <span className="font-mono font-bold text-white text-sm">
                        {(pred.probability * 100).toFixed(1)}%
                      </span>
                    </div>

                    {/* Probability Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full ${badge.bar} transition-all duration-500`}
                        style={{ width: `${Math.min(100, Math.max(0, pred.probability * 100))}%` }}
                      />
                    </div>
                  </div>

                  {/* Experimental metadata if mode === 'experimental' */}
                  {predictionResults.mode === 'experimental' && pred.applied_threshold && (
                    <div className="pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400 space-y-0.5">
                      <div className="flex justify-between">
                        <span>Threshold:</span>
                        <span className="text-cyan-300 font-semibold">{pred.applied_threshold}</span>
                      </div>
                      {pred.model_name && (
                        <div className="flex justify-between">
                          <span>Model:</span>
                          <span className="text-slate-300 truncate max-w-[110px]">
                            {pred.model_name}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Prototype Disclaimer */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] font-mono text-slate-400 leading-relaxed">
            <span className="text-slate-300 font-semibold">Regulatory Notice: </span>
            {predictionResults.disclaimer}
          </div>
        </div>
      )}
    </div>
  );
};
