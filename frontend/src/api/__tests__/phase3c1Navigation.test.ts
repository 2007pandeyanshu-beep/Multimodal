/**
 * frontend/src/api/__tests__/phase3c1Navigation.test.ts
 * Verification test suite for Phase 3C.1: CardioVision AI Workspace Navigation & State Architecture.
 * Validates the 4 distinct destinations, hash routing, session state retention,
 * missing-assessment fallback safety, and landing page decoupling.
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  parseHashDestination,
  formatDestinationHash,
  type WorkspaceDestination,
  type ActiveAssessment,
} from '../assessmentState.ts';

describe('Phase 3C.1: Workspace Navigation & State Architecture Verification', () => {
  it('1. Verifies hash-based destination parsing and URL formatting for all 4 destinations + wizard', () => {
    // 1. Prediction Overview
    assert.equal(parseHashDestination('#overview'), 'overview');
    assert.equal(parseHashDestination('#predictions'), 'overview');
    assert.equal(parseHashDestination('#workspace'), 'overview');
    assert.equal(formatDestinationHash('overview'), '#overview');

    // 2. 3D Cardiovascular Explorer
    assert.equal(parseHashDestination('#explorer'), 'explorer');
    assert.equal(parseHashDestination('#3d-explorer'), 'explorer');
    assert.equal(parseHashDestination('#3d'), 'explorer');
    assert.equal(formatDestinationHash('explorer'), '#explorer');

    // 3. Individual Assessment Report
    assert.equal(parseHashDestination('#report'), 'report');
    assert.equal(parseHashDestination('#assessment-report'), 'report');
    assert.equal(parseHashDestination('#dossier'), 'report');
    assert.equal(formatDestinationHash('report'), '#report');

    // 4. Model Review & Explainability
    assert.equal(parseHashDestination('#model-review'), 'model-review');
    assert.equal(parseHashDestination('#evaluation'), 'model-review');
    assert.equal(parseHashDestination('#benchmarks'), 'model-review');
    assert.equal(formatDestinationHash('model-review'), '#model-review');

    // 5. Assessment Input Wizard
    assert.equal(parseHashDestination('#assessment'), 'assessment');
    assert.equal(parseHashDestination('#wizard'), 'assessment');
    assert.equal(formatDestinationHash('assessment'), '#assessment');

    // Landing / Default
    assert.equal(parseHashDestination(''), null);
    assert.equal(parseHashDestination('#'), null);
    assert.equal(parseHashDestination('#landing'), null);
    assert.equal(formatDestinationHash(null), '');
  });

  it('2. Verifies WorkspaceNavBar source code defines and links all 4 destinations', () => {
    const navBarPath = path.resolve('src/components/workspace/WorkspaceNavBar.tsx');
    assert.ok(fs.existsSync(navBarPath), 'WorkspaceNavBar.tsx must exist');
    const content = fs.readFileSync(navBarPath, 'utf8');

    assert.ok(content.includes('1. Prediction Overview'), 'Must have Prediction Overview tab');
    assert.ok(content.includes('2. 3D Cardiovascular Explorer'), 'Must have 3D Explorer tab');
    assert.ok(content.includes('3. Individual Assessment Report'), 'Must have Patient Report tab');
    assert.ok(content.includes('4. Model Review & Explainability'), 'Must have Model Review tab');
    assert.ok(content.includes('Adjust 54 Parameters'), 'Must have Adjust 54 Parameters quick action');
  });

  it('3. Verifies PredictionOverviewView implements primary landing cards and launch gateways', () => {
    const overviewPath = path.resolve('src/components/workspace/PredictionOverviewView.tsx');
    assert.ok(fs.existsSync(overviewPath), 'PredictionOverviewView.tsx must exist');
    const content = fs.readFileSync(overviewPath, 'utf8');

    // Target cards
    assert.ok(content.includes("renderTargetCard('Cath', true)"), 'Must render Cath primary card');
    assert.ok(content.includes("renderTargetCard('LAD')"), 'Must render LAD card');
    assert.ok(content.includes("renderTargetCard('LCX')"), 'Must render LCX card');
    assert.ok(content.includes("renderTargetCard('RCA')"), 'Must render RCA card');

    // Gateway cards to other destinations
    assert.ok(content.includes("onNavigate('explorer')"), 'Must link to 3D Explorer');
    assert.ok(content.includes("onNavigate('report')"), 'Must link to Individual Report');
    assert.ok(content.includes("onNavigate('model-review')"), 'Must link to Model Review');

    // Fallback state when assessment is missing
    assert.ok(
      content.includes('No Active Patient Assessment Found'),
      'Must contain honest fallback state for missing assessment'
    );
  });

  it('4. Verifies CardiovascularExplorerView mounts CoronaryResultsCanvas with 3D controls', () => {
    const explorerPath = path.resolve('src/components/workspace/CardiovascularExplorerView.tsx');
    assert.ok(fs.existsSync(explorerPath), 'CardiovascularExplorerView.tsx must exist');
    const content = fs.readFileSync(explorerPath, 'utf8');

    assert.ok(
      content.includes('<CoronaryResultsCanvas'),
      'Must mount CoronaryResultsCanvas'
    );
    assert.ok(
      content.includes('selectedTarget={selectedTarget}'),
      'Must pass selectedTarget to CoronaryResultsCanvas'
    );
    assert.ok(
      content.includes('onSelectTarget={setSelectedTarget}'),
      'Must pass onSelectTarget to CoronaryResultsCanvas'
    );
    assert.ok(
      content.includes('Baseline Anatomical Display'),
      'Must display neutral baseline notice when no active assessment'
    );
  });

  it('5. Verifies AssessmentReportView separates individual patient dossier from population evaluation', () => {
    const reportPath = path.resolve('src/components/workspace/AssessmentReportView.tsx');
    assert.ok(fs.existsSync(reportPath), 'AssessmentReportView.tsx must exist');
    const content = fs.readFileSync(reportPath, 'utf8');

    assert.ok(
      content.includes('Individual Patient Assessment Report'),
      'Must render individual patient dossier title'
    );
    assert.ok(
      content.includes('54-Parameter Feature Provenance & Clinical Baseline Audit'),
      'Must render 54-parameter provenance audit'
    );
    assert.ok(
      content.includes('Baseline Assumptions'),
      'Must partition baseline assumptions'
    );
    assert.ok(
      content.includes('Measured Features'),
      'Must partition measured patient parameters'
    );
    assert.ok(
      content.includes('Phase 3C.2 Export Feature'),
      'Must provide honest placeholder for PDF export'
    );
  });

  it('6. Verifies ModelReviewView displays validated Tehran benchmarks and live global SHAP explainability', () => {
    const reviewPath = path.resolve('src/components/workspace/ModelReviewView.tsx');
    assert.ok(fs.existsSync(reviewPath), 'ModelReviewView.tsx must exist');
    const content = fs.readFileSync(reviewPath, 'utf8');

    // Audited Phase 2 benchmarks present
    assert.ok(content.includes('0.902'), 'Must include Cath ROC-AUC 0.902');
    assert.ok(content.includes('0.852'), 'Must include LAD ROC-AUC 0.852');
    assert.ok(content.includes('0.774'), 'Must include LCX ROC-AUC 0.774');
    assert.ok(content.includes('0.796'), 'Must include RCA ROC-AUC 0.796');

    // Leakage protections and training methodology
    assert.ok(content.includes('Strict Train/Test Isolation'), 'Must disclose train/test isolation');
    assert.ok(content.includes('Multi-Target Independence'), 'Must disclose target independence');

    // Global TreeSHAP explainability architecture (Phase 4.2 integration)
    assert.ok(
      content.includes('Global Feature Attribution & Model Explainability'),
      'Must mount Global Feature Attribution & Model Explainability section'
    );
    assert.ok(
      content.includes('Population-Level Mean Absolute SHAP (|SHAP|)'),
      'Must display Population-Level Mean Absolute SHAP sub-heading'
    );
    assert.ok(
      content.includes('TreeSHAP (N=303 Cohort)'),
      'Must display TreeSHAP (N=303 Cohort) badge'
    );
    assert.ok(
      content.includes('reports/phase2_charts/'),
      'Must disclose static Phase 2 charts location'
    );
  });

  it('7. Verifies CardioVisionWorkspace coordinates all views without breaking landing page', () => {
    const workspacePath = path.resolve('src/components/workspace/CardioVisionWorkspace.tsx');
    assert.ok(fs.existsSync(workspacePath), 'CardioVisionWorkspace.tsx must exist');
    const content = fs.readFileSync(workspacePath, 'utf8');

    assert.ok(content.includes('<WorkspaceNavBar'), 'Must mount WorkspaceNavBar');
    assert.ok(content.includes('<PredictionOverviewView'), 'Must mount PredictionOverviewView');
    assert.ok(content.includes('<CardiovascularExplorerView'), 'Must mount CardiovascularExplorerView');
    assert.ok(content.includes('<AssessmentReportView'), 'Must mount AssessmentReportView');
    assert.ok(content.includes('<ModelReviewView'), 'Must mount ModelReviewView');
    assert.ok(content.includes('<PatientProfileWizard'), 'Must mount PatientProfileWizard for assessment inputs');

    // Landing page hero remains decoupled
    const heroPath = path.resolve('src/components/landing/HeroSection.tsx');
    const heroContent = fs.readFileSync(heroPath, 'utf8');
    assert.ok(heroContent.includes('HeartCanvas'), 'HeroSection must continue using HeartCanvas');
  });
});
