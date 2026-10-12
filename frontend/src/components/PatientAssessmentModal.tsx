/**
 * frontend/src/components/PatientAssessmentModal.tsx
 * Full-screen Apple Health Minimal Clinical Assessment Workspace Dialog.
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import React, { useEffect } from 'react';
import { PatientAssessmentForm } from './PatientAssessmentForm';

interface PatientAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PatientAssessmentModal: React.FC<PatientAssessmentModalProps> = ({
  isOpen,
  onClose,
}) => {
  // Support Escape key to safely exit back to overview
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex bg-[#FBFBFD] overflow-hidden print:static print:z-auto print:overflow-visible print:bg-white animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="CardioVision AI Clinical Assessment Workspace"
    >
      <PatientAssessmentForm onClose={onClose} />
    </div>
  );
};
