import React from 'react';
import { X, Activity, ShieldCheck } from 'lucide-react';
import { PatientAssessmentForm } from './PatientAssessmentForm';

interface PatientAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PatientAssessmentModal: React.FC<PatientAssessmentModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assessment-modal-title"
    >
      <div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto bg-slate-950 border border-slate-700/80 rounded-3xl p-6 sm:p-10 shadow-2xl text-slate-100 flex flex-col custom-scrollbar">
        {/* Modal Top Header */}
        <div className="flex items-start justify-between pb-6 border-b border-slate-800 mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 text-cyan-400">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h2
                  id="assessment-modal-title"
                  className="text-xl sm:text-2xl font-extrabold text-white tracking-tight"
                >
                  Patient Cardiovascular Intake & Risk Assessment
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono text-cyan-400 font-semibold uppercase">
                    Protocol v2.4
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs text-slate-400 font-mono">
                    Cleveland & Z-Alizadeh Sani Standards
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-white rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clinical Integrity Alert Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 space-y-0.5">
            <span className="font-semibold text-white">Honest AI Clinical Protocol: </span>
            <span>
              This form collects real clinical markers (demographics, lipid profile, hemodynamics, and ECG indices) for multi-vessel risk localization. If an external model server is not connected, the exact JSON feature vector is prepared without fabricating synthetic predictions.
            </span>
          </div>
        </div>

        {/* The Form */}
        <PatientAssessmentForm />
      </div>
    </div>
  );
};
