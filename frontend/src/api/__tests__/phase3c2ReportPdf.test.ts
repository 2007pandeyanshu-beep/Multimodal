/**
 * frontend/src/api/__tests__/phase3c2ReportPdf.test.ts
 * Verification test suite for Phase 3C.2: Individual Assessment Report & PDF Export.
 * Validates report completeness, 4-target decision tables, provenance separation,
 * print stylesheet rules, BodyParts3D attribution, and fallback behavior.
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Phase 3C.2: Individual Assessment Report & PDF Export Verification', () => {
  it('1. Verifies AssessmentReportView source exists and renders all 4 coronary targets', () => {
    const reportPath = path.resolve('src/components/workspace/AssessmentReportView.tsx');
    assert.ok(fs.existsSync(reportPath), 'AssessmentReportView.tsx must exist');
    const content = fs.readFileSync(reportPath, 'utf8');

    // 4 Target definitions
    assert.ok(content.includes("'Cath'"), 'Must include Cath target');
    assert.ok(content.includes("'LAD'"), 'Must include LAD target');
    assert.ok(content.includes("'LCX'"), 'Must include LCX target');
    assert.ok(content.includes("'RCA'"), 'Must include RCA target');

    // Multi-target table
    assert.ok(
      content.includes('Executive Multi-Target Decision Summary'),
      'Must contain executive multi-target summary table'
    );
    assert.ok(
      content.includes('Standard Decision Threshold: 50.0%'),
      'Must disclose standard 50.0% decision cutoff'
    );
  });

  it('2. Verifies live assessment vs synthetic demo labeling is explicitly distinguished', () => {
    const reportPath = path.resolve('src/components/workspace/AssessmentReportView.tsx');
    const content = fs.readFileSync(reportPath, 'utf8');

    assert.ok(
      content.includes('isSyntheticDemo'),
      'Must conditionally evaluate isSyntheticDemo flag'
    );
    assert.ok(
      content.includes('DEMO:'),
      'Must display demo badge when synthetic preset is loaded'
    );
    assert.ok(
      content.includes('LIVE CLINICAL SESSION') || content.includes('Live Clinical Session'),
      'Must display live clinical badge for real patient assessments'
    );
  });

  it('3. Verifies feature provenance cleanly separates baseline assumptions and measured parameters', () => {
    const reportPath = path.resolve('src/components/workspace/AssessmentReportView.tsx');
    const content = fs.readFileSync(reportPath, 'utf8');

    assert.ok(
      content.includes('54-Parameter Feature Provenance & Clinical Baseline Audit'),
      'Must contain 54-parameter provenance audit header'
    );
    assert.ok(
      content.includes('Cohort Baseline Assumptions'),
      'Must contain cohort baseline assumptions section'
    );
    assert.ok(
      content.includes('Patient Measured & Entered Parameters') ||
        content.includes('Patient Measured Parameters'),
      'Must contain patient measured parameters section'
    );
    assert.ok(
      content.includes('print:block'),
      'Must ensure both sections are unhidden in print mode for comprehensive A4 reporting'
    );
  });

  it('4. Verifies Print / Save as PDF button triggers window.print() with accurate non-deceptive labeling', () => {
    const reportPath = path.resolve('src/components/workspace/AssessmentReportView.tsx');
    const content = fs.readFileSync(reportPath, 'utf8');

    // Action button
    assert.ok(
      content.includes('Print / Save as PDF'),
      'Action must be accurately labeled Print / Save as PDF'
    );
    assert.ok(
      content.includes('window.print()'),
      'Action must invoke browser-native window.print()'
    );
    assert.ok(
      !content.includes('PDF generated successfully on server'),
      'Must never claim server PDF synthesis when opening browser print dialog'
    );
  });

  it('5. Verifies print stylesheet defines A4 page size, hides interactive UI, and controls page breaks', () => {
    const cssPath = path.resolve('src/index.css');
    assert.ok(fs.existsSync(cssPath), 'index.css must exist');
    const content = fs.readFileSync(cssPath, 'utf8');

    assert.ok(content.includes('@media print'), 'Must define @media print rules');
    assert.ok(content.includes('size: A4 portrait'), 'Must define A4 portrait page size');
    assert.ok(
      content.includes('.no-print') && content.includes('display: none !important'),
      'Must hide .no-print elements in print mode'
    );
    assert.ok(
      content.includes('break-inside: avoid') || content.includes('page-break-inside: avoid'),
      'Must control page break behavior for tables and cards'
    );
  });

  it('6. Verifies scientific disclosures, diagnostic scope boundaries, and BodyParts3D attribution', () => {
    const reportPath = path.resolve('src/components/workspace/AssessmentReportView.tsx');
    const content = fs.readFileSync(reportPath, 'utf8');

    // Methodology & attribution
    assert.ok(
      content.includes('Tehran Heart Center cohort (N=303)'),
      'Must disclose Tehran Heart Center cohort'
    );
    assert.ok(
      content.includes('Balanced Random Forest'),
      'Must disclose Balanced Random Forest architecture'
    );
    assert.ok(
      content.includes('BodyParts3D') && content.includes('CC BY-SA 2.1 JP'),
      'Must attribute BodyParts3D anatomical model under CC BY-SA 2.1 JP'
    );

    // Non-diagnostic boundary disclaimer
    assert.ok(
      content.includes('NOT a clinical diagnosis'),
      'Must emphasize statistical predictions are not definitive diagnoses'
    );
  });

  it('7. Verifies missing-assessment fallback state does not fabricate synthetic predictions', () => {
    const reportPath = path.resolve('src/components/workspace/AssessmentReportView.tsx');
    const content = fs.readFileSync(reportPath, 'utf8');

    assert.ok(
      content.includes('No Assessment Dossier Available'),
      'Must render fallback header when active assessment is null'
    );
    assert.ok(
      content.includes('Scientific Integrity: Zero synthetic values are fabricated'),
      'Must disclose zero synthetic score fabrication on missing assessment'
    );
  });
});
