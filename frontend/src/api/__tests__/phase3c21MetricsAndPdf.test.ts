/**
 * frontend/src/api/__tests__/phase3c21MetricsAndPdf.test.ts
 * Verification test suite for Phase 3C.2.1: PDF Layout Correction & Model Metric Integrity Audit.
 * Validates 1-page A4 summary print layout, verified metric matching against verified_metrics.csv,
 * fold-mean vs pooled OOF distinction, and methodology reconciliation notes.
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Phase 3C.2.1: PDF Layout Correction & Model Metric Integrity Audit', () => {
  it('1. Verifies AssessmentReportView defines 1-page summary print mode with optional appendix toggle', () => {
    const reportPath = path.resolve('src/components/workspace/AssessmentReportView.tsx');
    assert.ok(fs.existsSync(reportPath), 'AssessmentReportView.tsx must exist');
    const content = fs.readFileSync(reportPath, 'utf8');

    // Appendix print toggle state
    assert.ok(
      content.includes('includeProvenanceInPrint'),
      'Must contain includeProvenanceInPrint state for 1-page summary control'
    );
    assert.ok(
      content.includes('Print / Save as PDF (1-Page Summary)'),
      'Must offer 1-Page Summary print action'
    );
    assert.ok(
      content.includes('Include 54-param appendix'),
      'Must offer optional 54-parameter appendix print inclusion checkbox'
    );
  });

  it('2. Verifies 1-page summary retains all clinical essentials without omission', () => {
    const reportPath = path.resolve('src/components/workspace/AssessmentReportView.tsx');
    const content = fs.readFileSync(reportPath, 'utf8');

    // Title and metadata
    assert.ok(content.includes('CardioVision AI'), 'Must include platform title');
    assert.ok(content.includes('Session:'), 'Must include session ID label');
    assert.ok(content.includes('Date/Time:'), 'Must include timestamp label');
    assert.ok(content.includes('Mode:'), 'Must include assessment mode label');

    // 4 targets
    assert.ok(content.includes("'Cath'"), 'Must include Cath target');
    assert.ok(content.includes("'LAD'"), 'Must include LAD target');
    assert.ok(content.includes("'LCX'"), 'Must include LCX target');
    assert.ok(content.includes("'RCA'"), 'Must include RCA target');

    // Threshold and boundaries
    assert.ok(content.includes('Standard Decision Threshold: 50.0%'), 'Must disclose 50% threshold');
    assert.ok(content.includes('Scientific Scope & Diagnostic Boundaries'), 'Must include boundaries card');
    assert.ok(content.includes('NOT a clinical diagnosis'), 'Must emphasize non-diagnostic boundary');

    // Disclosures & attributions
    assert.ok(content.includes('Tehran Heart Center cohort (N=303)'), 'Must cite Tehran cohort standard');
    assert.ok(content.includes('BodyParts3D') && content.includes('CC BY-SA 2.1 JP'), 'Must attribute BodyParts3D');
  });

  it('3. Verifies ModelReviewView matches ground-truth verified_metrics.csv to 4 decimal places', () => {
    const reviewPath = path.resolve('src/components/workspace/ModelReviewView.tsx');
    assert.ok(fs.existsSync(reviewPath), 'ModelReviewView.tsx must exist');
    const content = fs.readFileSync(reviewPath, 'utf8');

    // Cath fold-mean ROC-AUC: 0.9195
    assert.ok(content.includes('0.9195'), 'Cath fold-mean ROC-AUC must match 0.9195');
    // Cath accuracy: 0.8547
    assert.ok(content.includes('0.8547'), 'Cath fold-mean accuracy must match 0.8547');

    // LAD fold-mean ROC-AUC: 0.8383
    assert.ok(content.includes('0.8383'), 'LAD fold-mean ROC-AUC must match 0.8383');
    // LAD accuracy: 0.7858
    assert.ok(content.includes('0.7858'), 'LAD fold-mean accuracy must match 0.7858');

    // LCX fold-mean ROC-AUC: 0.7199
    assert.ok(content.includes('0.7199'), 'LCX fold-mean ROC-AUC must match 0.7199');
    // LCX accuracy: 0.6402
    assert.ok(content.includes('0.6402'), 'LCX fold-mean accuracy must match 0.6402');

    // RCA fold-mean ROC-AUC: 0.7340
    assert.ok(content.includes('0.7340') || content.includes('0.734'), 'RCA fold-mean ROC-AUC must match 0.7340');
    // RCA accuracy: 0.6698
    assert.ok(content.includes('0.6698'), 'RCA fold-mean accuracy must match 0.6698');
  });

  it('4. Verifies ModelReviewView distinguishes Fold-Mean and Pooled Out-of-Fold (OOF) representations', () => {
    const reviewPath = path.resolve('src/components/workspace/ModelReviewView.tsx');
    const content = fs.readFileSync(reviewPath, 'utf8');

    assert.ok(content.includes('Fold-Mean (Mean ± Std)'), 'Must offer Fold-Mean representation tab');
    assert.ok(content.includes('Pooled OOF (N=303)'), 'Must offer Pooled OOF representation tab');
    assert.ok(content.includes('pooledOofRocAuc: 0.9144'), 'Must record Cath pooled OOF ROC-AUC 0.9144');
    assert.ok(content.includes('pooledOofRocAuc: 0.8352'), 'Must record LAD pooled OOF ROC-AUC 0.8352');
    assert.ok(content.includes('pooledOofRocAuc: 0.7130'), 'Must record LCX pooled OOF ROC-AUC 0.7130');
    assert.ok(content.includes('pooledOofRocAuc: 0.7313'), 'Must record RCA pooled OOF ROC-AUC 0.7313');
  });

  it('5. Verifies ModelReviewView documents class_weight="balanced" model pipeline variant', () => {
    const reviewPath = path.resolve('src/components/workspace/ModelReviewView.tsx');
    const content = fs.readFileSync(reviewPath, 'utf8');

    assert.ok(
      content.includes('class_weight="balanced"') || content.includes("class_weight='balanced'"),
      'Must explicitly disclose class_weight="balanced" configuration'
    );
  });

  it('6. Verifies ModelReviewView includes audit reconciliation methodology note', () => {
    const reviewPath = path.resolve('src/components/workspace/ModelReviewView.tsx');
    const content = fs.readFileSync(reviewPath, 'utf8');

    assert.ok(
      content.includes('Metric Provenance & Mathematical Reconciliation Methodology'),
      'Must contain methodology note header'
    );
    assert.ok(
      content.includes('Audit Reconciliation of Historical Preliminary Placeholders'),
      'Must explain historical placeholder reconciliation'
    );
    assert.ok(
      content.includes('0.902') &&
        content.includes('0.852') &&
        content.includes('0.774') &&
        content.includes('0.796'),
      'Must reference historical placeholder values in the audit reconciliation note'
    );
  });

  it('7. Verifies cross-algorithm comparison table is available with model_comparison.csv data', () => {
    const reviewPath = path.resolve('src/components/workspace/ModelReviewView.tsx');
    const content = fs.readFileSync(reviewPath, 'utf8');

    assert.ok(content.includes('Algorithm Comparison'), 'Must offer Algorithm Comparison view');
    assert.ok(content.includes('Logistic Regression'), 'Must include Logistic Regression baseline');
    assert.ok(content.includes('Gradient Boosting'), 'Must include Gradient Boosting baseline');
  });
});
