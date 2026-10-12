import React from 'react';
import { Heart, GitBranch, Crosshair, AlertCircle } from 'lucide-react';

export const PredictionTargetsSection: React.FC = () => {
  const targets = [
    {
      code: 'Cath',
      fullName: 'Overall CAD Outcome',
      clinicalLabel: 'Global Coronary Artery Disease',
      color: 'slate',
      icon: Heart,
      territory: 'Global Epicardial Circulation',
      criteria: '≥50% lumen narrowing in at least 1 major vessel',
      description:
        'The primary binary endpoint representing catheterization-confirmed coronary artery disease. Indicates whether clinically significant obstructive plaque is present across any major epicardial coronary artery.',
      clinicalRelevance:
        'Guides high-level clinical suspicion for coronary ischemia and prioritizes downstream functional imaging or diagnostic catheterization.',
    },
    {
      code: 'LAD',
      fullName: 'Left Anterior Descending Artery',
      clinicalLabel: 'Anterior & Septal Territory',
      color: 'sky',
      icon: GitBranch,
      territory: 'Anterior Left Ventricle & Interventricular Septum',
      criteria: '≥50% stenosis in the LAD arterial trunk or major diagonals',
      description:
        'The anterior descending branch travels down the anterior interventricular sulcus, supplying blood to the largest proportion of the left ventricular myocardium and conductive bundle branches.',
      clinicalRelevance:
        'Often clinically designated the most critical vessel; severe proximal stenosis poses the greatest risk of extensive anterior infarction and pump failure.',
    },
    {
      code: 'LCX',
      fullName: 'Left Circumflex Artery',
      clinicalLabel: 'Lateral & Posterolateral Territory',
      color: 'indigo',
      icon: Crosshair,
      territory: 'Lateral Left Ventricle & Left Atrium',
      criteria: '≥50% stenosis in the LCX main trunk or obtuse marginals',
      description:
        'Branches from the left main coronary artery and curves along the coronary sulcus, delivering perfusion to the lateral free wall of the left ventricle and postero-lateral papillary muscles.',
      clinicalRelevance:
        'Infarction in this territory can manifest subtly on standard 12-lead surface ECGs, making objective multi-parameter predictive profiling especially informative.',
    },
    {
      code: 'RCA',
      fullName: 'Right Coronary Artery',
      clinicalLabel: 'Inferior & Right Ventricular Territory',
      color: 'rose',
      icon: GitBranch,
      territory: 'Right Ventricle, Inferior LV & Cardiac Nodes',
      criteria: '≥50% stenosis in the RCA trunk or posterior descending',
      description:
        'Courses down the right atrioventricular groove, perfusing the right atrium, right ventricle, inferior wall of the left ventricle, and the sinoatrial (SA) and atrioventricular (AV) nodal branches.',
      clinicalRelevance:
        'Obstruction frequently correlates with bradyarrhythmias, conduction blocks, or right ventricular involvement that necessitates tailored hemodynamic support.',
    },
  ];

  return (
    <section
      id="target-vessels"
      className="relative z-10 w-full px-4 sm:px-8 lg:px-12 py-20 lg:py-28 max-w-7xl mx-auto"
      aria-label="CardioVision Prediction Targets"
    >
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 border border-slate-200/80 shadow-xs backdrop-blur-md mb-4">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-sky-700">
            MULTI-VESSEL RISK MAPPING
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight mb-5">
          Four Dedicated Prediction Targets
        </h2>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
          Rather than relying on generic single-score risk calculators, CardioVision AI
          evaluates overall disease alongside three specific anatomical vascular territories.
        </p>
      </div>

      {/* Target Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {targets.map((tgt) => {
          const Icon = tgt.icon;
          return (
            <div
              key={tgt.code}
              className="relative p-7 sm:p-8 rounded-3xl bg-white/85 hover:bg-white border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-lg transition-all duration-300 backdrop-blur-xl flex flex-col justify-between"
            >
              <div>
                {/* Header: Code badge and Icon */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="inline-block px-3 py-1 rounded-xl bg-slate-950 text-white font-mono font-black text-sm tracking-wider mb-2">
                      Target: {tgt.code}
                    </span>
                    <h3 className="text-xl font-bold text-slate-950 tracking-tight">
                      {tgt.fullName}
                    </h3>
                    <div className="text-xs font-semibold text-sky-700 font-mono mt-0.5">
                      {tgt.clinicalLabel}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700">
                    <Icon className="w-6 h-6" />
                  </div>
                </div>

                {/* Territory & Criteria */}
                <div className="my-5 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-slate-700 shrink-0">Territory:</span>
                    <span className="text-slate-600">{tgt.territory}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-slate-700 shrink-0">Threshold:</span>
                    <span className="text-slate-600 font-mono">{tgt.criteria}</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4 font-normal">
                  {tgt.description}
                </p>
              </div>

              {/* Clinical Relevance Box */}
              <div className="pt-4 border-t border-slate-100 flex items-start gap-2.5 text-xs text-slate-700">
                <AlertCircle className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
                <span className="leading-normal font-medium">{tgt.clinicalRelevance}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
