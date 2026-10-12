/**
 * frontend/src/components/workspace/CardioVisionWorkspace.tsx
 * Master Workspace Coordinator for CardioVision AI.
 * Hosts WorkspaceNavBar and dynamically routes between the four destinations:
 *   1. Prediction Overview (#overview)
 *   2. 3D Cardiovascular Explorer (#explorer)
 *   3. Individual Assessment Report (#report)
 *   4. Model Review & Explainability (#model-review)
 * Plus the 5-step Patient Profile Wizard (#assessment).
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import React, { useEffect } from 'react';
import {
  useWorkspaceNavigation,
  useActiveAssessment,
  type WorkspaceDestination,
} from '../../api/assessmentState.ts';
import { WorkspaceNavBar } from './WorkspaceNavBar.tsx';
import { PredictionOverviewView } from './PredictionOverviewView.tsx';
import { CardiovascularExplorerView } from './CardiovascularExplorerView.tsx';
import { AssessmentReportView } from './AssessmentReportView.tsx';
import { ModelReviewView } from './ModelReviewView.tsx';
import { FeatureExplorerView } from './FeatureExplorerView.tsx';
import { PatientProfileWizard } from '../wizard/PatientProfileWizard.tsx';

export interface CardioVisionWorkspaceProps {
  initialDestination?: WorkspaceDestination;
  onClose: () => void;
}

export const CardioVisionWorkspace: React.FC<CardioVisionWorkspaceProps> = ({
  initialDestination,
  onClose,
}) => {
  const { destination, navigateTo } = useWorkspaceNavigation();
  const { activeAssessment } = useActiveAssessment();

  // If initialDestination provided and no hash, initialize it
  useEffect(() => {
    if (initialDestination && !destination) {
      navigateTo(initialDestination);
    }
  }, [initialDestination, destination, navigateTo]);

  // Determine current active destination (default to 'overview' if active assessment exists, else 'assessment')
  const currentDestination: WorkspaceDestination =
    destination || (activeAssessment ? 'overview' : 'assessment');

  const handleExit = () => {
    navigateTo(null);
    onClose();
  };

  // Keyboard shortcut: Escape exits back to overview or landing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (currentDestination === 'assessment' && activeAssessment) {
          navigateTo('overview');
        } else {
          handleExit();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentDestination, activeAssessment]);

  return (
    <div className="w-full h-full min-h-screen bg-[#FBFBFD] flex flex-col font-sans text-slate-900 overflow-hidden print:overflow-visible print:h-auto print:min-h-0 print:bg-white relative selection:bg-teal-500/20 selection:text-teal-950">
      {/* If currently in assessment input wizard mode, mount wizard with its dedicated sidebar */}
      {currentDestination === 'assessment' ? (
        <PatientProfileWizard onClose={handleExit} />
      ) : (
        /* Otherwise, render the unified top-tabbed workspace shell */
        <div className="flex-1 flex flex-col h-full print:h-auto print:overflow-visible overflow-hidden">
          {/* Top Destination Navigation Bar */}
          <div className="no-print print:hidden">
            <WorkspaceNavBar
              currentDestination={currentDestination}
              activeAssessment={activeAssessment}
              onNavigate={navigateTo}
              onExit={handleExit}
            />
          </div>

          {/* Main Destination Scrollable Viewport */}
          <main className="flex-1 overflow-y-auto custom-scrollbar print:overflow-visible print:h-auto print:p-0">
            {currentDestination === 'overview' && (
              <PredictionOverviewView
                activeAssessment={activeAssessment}
                onNavigate={navigateTo}
              />
            )}

            {currentDestination === 'explorer' && (
              <CardiovascularExplorerView
                activeAssessment={activeAssessment}
                onNavigate={navigateTo}
              />
            )}

            {currentDestination === 'report' && (
              <AssessmentReportView
                activeAssessment={activeAssessment}
                onNavigate={navigateTo}
              />
            )}

            {currentDestination === 'model-review' && (
              <ModelReviewView
                activeAssessment={activeAssessment}
                onNavigate={navigateTo}
              />
            )}

            {currentDestination === 'feature-explorer' && (
              <FeatureExplorerView
                activeAssessment={activeAssessment}
                onNavigate={navigateTo}
              />
            )}
          </main>
        </div>
      )}
    </div>
  );
};
