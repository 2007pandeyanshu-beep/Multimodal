import React from 'react';
import { X, ShieldCheck, Heart, Layers, Activity, FileSpreadsheet, AlertTriangle, ExternalLink } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const BaseModal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xl text-slate-100"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
};

export const AboutModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="About CardioVision AI">
      <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
        <p>
          <strong className="text-white font-semibold">CardioVision AI</strong> is an advanced clinical research prototype designed to assist cardiovascular researchers in visualizing cardiovascular disease risk and anatomical coronary artery risk distribution.
        </p>
        
        <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
          <h3 className="font-semibold text-cyan-400 mb-2 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Clinical Integrity Commitment
          </h3>
          <p className="text-xs text-slate-300">
            CardioVision AI strictly adheres to honest AI validation. We never generate artificial predictions, fake percentages, or simulated risk scores. All analytical outputs require connection to validated clinical models trained on standardized benchmark datasets.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-white">Dataset Compatibility</h3>
          <p className="text-xs text-slate-400">
            Engineered for benchmark cardiovascular cohorts including the Z-Alizadeh Sani coronary artery disease dataset, focusing on binary outcome classification for Overall CAD, LAD, LCX, and RCA vessel involvement.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export const FeaturesModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="CardioVision AI Platform Features">
      <div className="space-y-4 text-sm text-slate-300">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center gap-2 font-semibold text-cyan-400 mb-2">
              <Heart className="w-4 h-4 text-rose-400" />
              <span>3D Anatomical Localization</span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive 3D anatomical rendering allows physicians to inspect the coronary tree and contextualize vascular territories.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center gap-2 font-semibold text-cyan-400 mb-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Multi-Target Vessel Analysis</span>
            </div>
            <p className="text-xs text-slate-400">
              Architecture configured for multi-vessel evaluation: Left Anterior Descending (LAD), Left Circumflex (LCX), and Right Coronary Artery (RCA).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center gap-2 font-semibold text-cyan-400 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Data Leakage Guards</span>
            </div>
            <p className="text-xs text-slate-400">
              Automated exclusion filters prevent post-hoc catheterization and target columns from leaking into predictive training pipelines.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center gap-2 font-semibold text-cyan-400 mb-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Explainable AI (XAI)</span>
            </div>
            <p className="text-xs text-slate-400">
              Framework support for SHAP feature attribution, providing transparent reasoning for every model input.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export const GetStartedModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="CardioVision AI — Patient & Cohort Intake">
      <div className="space-y-4 text-sm text-slate-300">
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold">Safety & Compliance Notice</p>
            <p>
              In accordance with medical software validation guidelines, CardioVision AI does not generate fictitious prediction scores or synthetic clinical values.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
            <span>Dataset Ingestion & Model Pipeline Integration</span>
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            To run live risk assessment, connect your validated Python/FastAPI ML service or import your clinical cohort (e.g. <code className="text-cyan-300 bg-slate-800 px-1.5 py-0.5 rounded font-mono">extention of Z-Alizadeh sani dataset.xlsx</code>).
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 font-mono text-xs text-slate-300 space-y-2">
          <div className="text-slate-400">Supported Target Classes:</div>
          <div className="grid grid-cols-2 gap-2 text-cyan-300">
            <div>• Overall CAD [Binary]</div>
            <div>• LAD Stenosis [Binary]</div>
            <div>• LCX Stenosis [Binary]</div>
            <div>• RCA Stenosis [Binary]</div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export const ModelNoticeModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="3D Heart Model & Animation Disclosure">
      <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
        <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-cyan-200">
          <h3 className="font-semibold mb-1 flex items-center gap-2 text-cyan-400">
            <Activity className="w-4 h-4" />
            <span>Heartbeat Animation Methodology</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            The continuous heartbeat motion displayed on this landing page is an <strong>interactive visual effect</strong> driven by a mathematical non-linear cardiac cycle scale pulse (~72 beats per minute). It is rendered for anatomical visualization and educational aesthetics, and is <strong>not a patient-specific physiological simulation</strong> or hemodynamic model.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-white">3D Asset Attribution & License</h3>
          <p className="text-xs text-slate-400">
            <strong>Model:</strong> Realistic Human Heart 3D Model<br />
            <strong>Author:</strong> neshallads (<a href="https://sketchfab.com/neshallads" target="_blank" rel="noreferrer" className="text-cyan-400 underline inline-flex items-center gap-1">Sketchfab Profile <ExternalLink className="w-2.5 h-2.5" /></a>)<br />
            <strong>License:</strong> Creative Commons Attribution (CC-BY 4.0)<br />
            Preserves authentic anatomical geometry, texture coordinates, and structural landmarks.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            Understood
          </button>
        </div>
      </div>
    </BaseModal>
  );
};
