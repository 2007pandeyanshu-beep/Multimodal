/**
 * frontend/src/components/wizard/WorkspaceVascularDecor.tsx
 * Subtle vascular visual identity for the Apple Health Minimal assessment workspace.
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import React from 'react';

interface WorkspaceVascularDecorProps {
  reducedMotion?: boolean;
}

export const WorkspaceVascularDecor: React.FC<WorkspaceVascularDecorProps> = ({
  reducedMotion = false,
}) => {
  return (
    <div
      className="absolute inset-0 pointer-events-none -z-10 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* 1. Subtle top-right coronary vascular branching motif */}
      <svg
        className="absolute top-0 right-0 w-[500px] h-[340px] opacity-[0.045] transition-opacity duration-700"
        viewBox="0 0 500 340"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Superior ascending arterial conduit */}
        <path
          d="M500 20 C420 30, 360 80, 310 140 C270 190, 220 220, 160 250 C100 280, 40 290, 0 320"
          stroke="#0891b2"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        {/* Right marginal branching vessel */}
        <path
          d="M360 80 C340 120, 310 160, 260 190 C210 220, 150 240, 90 250"
          stroke="#0891b2"
          strokeWidth="2"
          strokeDasharray="6 4"
          strokeLinecap="round"
        />
        {/* Venous tributary track */}
        <path
          d="M500 60 C440 70, 390 120, 340 170 C290 220, 230 250, 160 280 C90 310, 40 330, 10 340"
          stroke="#f43f5e"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Fine capillary filaments */}
        <path
          d="M310 140 C280 130, 250 140, 220 160"
          stroke="#0d9488"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <path
          d="M260 190 C240 200, 220 220, 200 240"
          stroke="#f43f5e"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        {/* Anatomic reference node dots */}
        <circle cx="310" cy="140" r="3" fill="#0891b2" />
        <circle cx="260" cy="190" r="2.5" fill="#f43f5e" />
        <circle cx="160" cy="250" r="2.5" fill="#0d9488" />
      </svg>

      {/* 2. Delicate lateral margin vascular tracks running down workspace edge */}
      <svg
        className="absolute bottom-0 right-0 w-[360px] h-[550px] opacity-[0.035] transition-opacity duration-700"
        viewBox="0 0 360 550"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M360 50 C300 120, 280 200, 260 280 C240 360, 210 440, 160 500 C120 540, 60 550, 0 550"
          stroke="#0891b2"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M260 280 C230 320, 180 350, 130 370 C70 390, 20 400, 0 410"
          stroke="#f43f5e"
          strokeWidth="1.8"
          strokeDasharray="4 3"
          strokeLinecap="round"
        />
        <path
          d="M210 440 C170 460, 120 470, 70 480"
          stroke="#0d9488"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>

      {/* 3. Subtle soft ambient highlights */}
      <div className="absolute top-10 right-20 w-80 h-80 rounded-full bg-cyan-500/[0.025] blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-rose-500/[0.018] blur-3xl pointer-events-none" />
    </div>
  );
};
