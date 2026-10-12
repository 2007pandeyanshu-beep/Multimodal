import React from 'react';
import { Terminal, Database, Cpu, Layers, GitBranch, ShieldCheck } from 'lucide-react';

export const ModelArchitectureSection: React.FC = () => {
  const pipelineSteps = [
    {
      step: '01',
      title: 'FastAPI Validation Layer',
      icon: Terminal,
      code: 'backend/schemas.py',
      details:
        'Requests pass through strict Pydantic validation via the PatientInput schema, requiring all 54 canonical features with enforced boundary and categorical Literal types.',
    },
    {
      step: '02',
      title: 'ColumnTransformer Preprocessing',
      icon: Database,
      code: 'ml/transformers.py',
      details:
        'Continuous numeric attributes (e.g. FBS, CR, BP, Age, EF-TTE) undergo StandardScaler normalization, while multi-level categoricals (Sex, BBB, VHD, Region RWMA) are one-hot encoded.',
    },
    {
      step: '03',
      title: 'Independent Target Estimators',
      icon: Cpu,
      code: 'backend/model_loader.py',
      details:
        'Four isolated scikit-learn models (Cath, LAD, LCX, RCA) loaded from serialized Joblib artifacts evaluate the transformed vector concurrently without cross-target feature leakage.',
    },
    {
      step: '04',
      title: 'Calibrated Probability Dispatch',
      icon: Layers,
      code: 'backend/app.py',
      details:
        'Endpoints output binary class predictions alongside calibrated class probabilities (predict_proba), mapped directly into the frontend prediction presentation interface.',
    },
  ];

  return (
    <section
      id="architecture"
      className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-20 lg:py-28 max-w-6xl mx-auto"
      aria-label="Implemented Model Inference Architecture"
    >
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-slate-200/80 shadow-xs backdrop-blur-md mb-4">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-sky-700">
            SOURCE CODE INTEGRATION
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-tight mb-4">
          Implemented Inference Architecture
        </h2>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
          A fully wired, reproducible machine learning stack connecting the React 19
          frontend wizard to our FastAPI scikit-learn prediction backend.
        </p>
      </div>

      {/* Grid of actual architecture steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {pipelineSteps.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.step}
              className="p-7 rounded-3xl bg-white/85 border border-slate-200/80 shadow-xs backdrop-blur-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-sky-700">
                      STAGE {s.step}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      {s.code}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-950 tracking-tight mb-2">
                  {s.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  {s.details}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Technical Architecture Badge */}
      <div className="p-6 rounded-3xl bg-white/80 border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0" />
          <span>
            <strong>Zero Data Leakage: </strong>
            Angiographic outcome columns and post-hoc clinical indicators are strictly quarantined from the 54-feature inference payload.
          </span>
        </div>
        <div className="font-mono text-[11px] text-slate-600 shrink-0">
          FastAPI • scikit-learn • React 19 • Vite
        </div>
      </div>
    </section>
  );
};
