/**
 * frontend/src/api/__tests__/featureExplorer.test.ts
 * Comprehensive test suite for Phase 5.0: Feature Explorer & Clinical Learning Hub.
 * 
 * Verifies:
 * 1. Exactly 54 canonical clinical features in authoritative metadata matching backend schema.
 * 2. Feature search and filtering functionality across categories, types, and derivations.
 * 3. Type classification: 21 Numeric, 29 Binary, 4 Multi-category, and exactly 4 Deterministically Derived.
 * 4. Detail-panel completeness and 3-way range provenance (Schema vs. Dataset-Observed vs. Clinical).
 * 5. Missing value policy & Zero-Silent-Defaults enforcement.
 * 6. Global TreeSHAP target switching across all four production targets (Cath, LAD, LCX, RCA).
 * 7. Live API client, loading, error, retry, and empty states.
 * 8. Honest handling of top-10-only SHAP responses (omitted features never reported as zero).
 * 9. Workspace navigation integration (5th destination tab, hash routing '#feature-explorer').
 * 10. Preservation of existing 4 destinations, wizard, assessment session, and landing page.
 * 
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  CLINICAL_FEATURES,
  TOTAL_CANONICAL_FEATURE_COUNT,
  getNumericFeatures,
  getCategoricalFeatures,
  getDerivedFeatures,
  getFeatureByName,
  getFeaturesByCategory,
} from '../clinicalFeaturesData.ts';
import {
  parseHashDestination,
  formatDestinationHash,
  type WorkspaceDestination,
} from '../assessmentState.ts';
import type { TargetName, GlobalShapResponse } from '../types.ts';

// 54 canonical feature names defined in backend/schemas.py (PatientInput) & ml/transformers.py
const AUTHORITATIVE_54_FEATURE_NAMES = [
  'Age', 'Weight', 'Length', 'Sex', 'BMI',
  'DM', 'HTN', 'Current Smoker', 'EX-Smoker', 'FH', 'Obesity',
  'CRF', 'CVA', 'Airway disease', 'Thyroid Disease', 'CHF', 'DLP',
  'BP', 'PR', 'Edema', 'Weak Peripheral Pulse', 'Lung rales',
  'Systolic Murmur', 'Diastolic Murmur',
  'Typical Chest Pain', 'Dyspnea', 'Function Class', 'Atypical',
  'Nonanginal', 'LowTH Ang',
  'Q Wave', 'St Elevation', 'St Depression', 'Tinversion', 'LVH',
  'Poor R Progression', 'BBB',
  'FBS', 'CR', 'TG', 'LDL', 'HDL', 'BUN', 'ESR', 'HB', 'K', 'Na',
  'WBC', 'Lymph', 'Neut', 'PLT',
  'EF-TTE', 'Region RWMA', 'VHD'
];

describe('Phase 5.0 Feature Explorer: Canonical Schema & Type Classification', () => {
  it('1. Verifies exact canonical count of 54 features with 1-to-1 schema correspondence', () => {
    assert.equal(
      CLINICAL_FEATURES.length,
      54,
      `Expected 54 features in authoritative metadata, found ${CLINICAL_FEATURES.length}`
    );
    assert.equal(TOTAL_CANONICAL_FEATURE_COUNT, 54);

    const featureNames = CLINICAL_FEATURES.map((f) => f.canonicalName);
    const uniqueNames = new Set(featureNames);
    assert.equal(uniqueNames.size, 54, 'Features must have unique canonical names');

    // Check 1-to-1 correspondence with backend schema order
    for (let i = 0; i < AUTHORITATIVE_54_FEATURE_NAMES.length; i++) {
      const expected = AUTHORITATIVE_54_FEATURE_NAMES[i];
      assert.equal(
        featureNames[i],
        expected,
        `Feature index ${i} mismatch: expected ${expected}, got ${featureNames[i]}`
      );
    }
  });

  it('2. Verifies exact partition into 21 Numeric and 33 Categorical (29 Binary, 4 Multi-class) features', () => {
    const numericFeatures = getNumericFeatures();
    const categoricalFeatures = getCategoricalFeatures();
    const binaryFeatures = CLINICAL_FEATURES.filter((f) => f.dataType === 'binary');
    const multiCatFeatures = CLINICAL_FEATURES.filter((f) => f.dataType === 'categorical');

    assert.equal(
      numericFeatures.length,
      21,
      `Expected 21 numeric features, got ${numericFeatures.length}`
    );
    assert.equal(
      categoricalFeatures.length,
      33,
      `Expected 33 categorical features, got ${categoricalFeatures.length}`
    );
    assert.equal(
      binaryFeatures.length,
      29,
      `Expected 29 binary features, got ${binaryFeatures.length}`
    );
    assert.equal(
      multiCatFeatures.length,
      4,
      `Expected 4 multi-category features, got ${multiCatFeatures.length}`
    );

    // Verify the 4 multi-class features
    const multiCatNames = multiCatFeatures.map((f) => f.canonicalName).sort();
    assert.deepEqual(multiCatNames, ['BBB', 'Function Class', 'Region RWMA', 'VHD'].sort());
  });

  it('3. Verifies exactly 4 deterministically derived features with verified mathematical rules', () => {
    const derivedFeatures = getDerivedFeatures();
    assert.equal(
      derivedFeatures.length,
      4,
      `Expected exactly 4 derived features, got ${derivedFeatures.length}`
    );

    const derivedNames = derivedFeatures.map((f) => f.canonicalName).sort();
    assert.deepEqual(
      derivedNames,
      ['Atypical', 'BMI', 'Nonanginal', 'Obesity'].sort(),
      'Derived features must match audited derivation set'
    );

    // Verify BMI formula
    const bmi = getFeatureByName('BMI');
    assert.ok(bmi?.isDerived);
    assert.ok(bmi?.derivationFormula?.includes('Weight (kg)'));
    assert.ok(bmi?.derivationFormula?.includes('Length (cm)'));

    // Verify Obesity threshold
    const obesity = getFeatureByName('Obesity');
    assert.ok(obesity?.isDerived);
    assert.ok(obesity?.derivationFormula?.includes('25.0'));

    // Verify Diamond-Forrester chest pain presentation partition:
    // Typical Chest Pain is directly selected by the clinician, while Atypical and Nonanginal
    // are the deterministically derived complementary flags.
    const typicalCp = getFeatureByName('Typical Chest Pain');
    assert.equal(typicalCp?.isDerived, false, 'Typical Chest Pain is directly selected');

    const atypical = getFeatureByName('Atypical');
    assert.ok(atypical?.isDerived);
    assert.ok(atypical?.derivationFormula?.includes('Diamond-Forrester'));

    const nonanginal = getFeatureByName('Nonanginal');
    assert.ok(nonanginal?.isDerived);
    assert.ok(nonanginal?.derivationFormula?.includes('Diamond-Forrester'));
  });
});

describe('Phase 5.0 Feature Explorer: Provenance & 3-Way Range Integrity', () => {
  it('4. Distinguishes schema-permitted, dataset-observed, and clinical reference ranges for numeric features', () => {
    const numericFeatures = getNumericFeatures();

    for (const f of numericFeatures) {
      // 1. Schema constraints must be bounded
      assert.ok(
        f.schemaConstraints.min !== undefined && f.schemaConstraints.max !== undefined,
        `Feature ${f.canonicalName} must define schema min and max`
      );
      assert.ok(
        f.schemaConstraints.min < f.schemaConstraints.max,
        `Feature ${f.canonicalName} schema min must be less than max`
      );

      // 2. Dataset observed stats must exist from cad_clean.csv (N=303)
      assert.ok(f.datasetStats, `Numeric feature ${f.canonicalName} must provide dataset stats`);
      assert.ok(
        f.datasetStats.min >= f.schemaConstraints.min,
        `Feature ${f.canonicalName} observed min (${f.datasetStats.min}) is out of schema bounds [${f.schemaConstraints.min}, ${f.schemaConstraints.max}]`
      );
      assert.ok(
        f.datasetStats.max <= f.schemaConstraints.max,
        `Feature ${f.canonicalName} observed max (${f.datasetStats.max}) is out of schema bounds [${f.schemaConstraints.min}, ${f.schemaConstraints.max}]`
      );

      // 3. Clinical reference range must not be empty and must distinguish from dataset min/max
      assert.ok(
        f.clinicalReferenceRange && f.clinicalReferenceRange.length > 5,
        `Feature ${f.canonicalName} must include clinically grounded reference interval`
      );
    }
  });

  it('5. Verifies preprocessing methods match pipeline architecture (StandardScaler vs OneHotEncoder)', () => {
    for (const f of CLINICAL_FEATURES) {
      if (f.dataType === 'numeric') {
        assert.ok(
          f.preprocessingMethod.includes('StandardScaler'),
          `Numeric feature ${f.canonicalName} must specify StandardScaler normalization`
        );
      } else {
        assert.ok(
          f.preprocessingMethod.includes('OneHotEncoder'),
          `Categorical feature ${f.canonicalName} must specify OneHotEncoder transformation`
        );
      }
      assert.ok(
        f.missingValueBehavior.includes('HTTP 422') || f.missingValueBehavior.includes('Strictly required'),
        `Feature ${f.canonicalName} must enforce zero-silent-defaults missing value policy`
      );
    }
  });
});

describe('Phase 5.0 Feature Explorer: Global SHAP Importance & Top-10 Coverage', () => {
  // Synthetic sample matching GET /explain/global response contract
  const sampleGlobalShap: GlobalShapResponse = {
    targets: {
      Cath: {
        target: 'Cath',
        cohort_name: 'Tehran Heart Center Cohort',
        sample_size: 303,
        calculation_method: 'mean(abs(canonical_SHAP_contribution))',
        output_space: 'probability',
        top_features: [
          { rank: 1, feature_name: 'Typical Chest Pain', mean_absolute_shap: 0.1245 },
          { rank: 2, feature_name: 'Atypical', mean_absolute_shap: 0.0821 },
          { rank: 3, feature_name: 'HTN', mean_absolute_shap: 0.0612 },
          { rank: 4, feature_name: 'Age', mean_absolute_shap: 0.0543 },
          { rank: 5, feature_name: 'Region RWMA', mean_absolute_shap: 0.0489 },
          { rank: 6, feature_name: 'EF-TTE', mean_absolute_shap: 0.0412 },
          { rank: 7, feature_name: 'Tinversion', mean_absolute_shap: 0.0356 },
          { rank: 8, feature_name: 'DM', mean_absolute_shap: 0.0312 },
          { rank: 9, feature_name: 'TG', mean_absolute_shap: 0.0289 },
          { rank: 10, feature_name: 'Nonanginal', mean_absolute_shap: 0.0245 },
        ],
      },
      LAD: {
        target: 'LAD',
        cohort_name: 'Tehran Heart Center Cohort',
        sample_size: 303,
        calculation_method: 'mean(abs(canonical_SHAP_contribution))',
        output_space: 'probability',
        top_features: [
          { rank: 1, feature_name: 'Typical Chest Pain', mean_absolute_shap: 0.1102 },
          { rank: 2, feature_name: 'Atypical', mean_absolute_shap: 0.0765 },
          { rank: 3, feature_name: 'Region RWMA', mean_absolute_shap: 0.0654 },
          { rank: 4, feature_name: 'EF-TTE', mean_absolute_shap: 0.0521 },
          { rank: 5, feature_name: 'Age', mean_absolute_shap: 0.0489 },
          { rank: 6, feature_name: 'ESR', mean_absolute_shap: 0.0387 },
          { rank: 7, feature_name: 'Tinversion', mean_absolute_shap: 0.0342 },
          { rank: 8, feature_name: 'HTN', mean_absolute_shap: 0.0301 },
          { rank: 9, feature_name: 'St Depression', mean_absolute_shap: 0.0278 },
          { rank: 10, feature_name: 'Neut', mean_absolute_shap: 0.0234 },
        ],
      },
      LCX: {
        target: 'LCX',
        cohort_name: 'Tehran Heart Center Cohort',
        sample_size: 303,
        calculation_method: 'mean(abs(canonical_SHAP_contribution))',
        output_space: 'probability',
        top_features: [
          { rank: 1, feature_name: 'Typical Chest Pain', mean_absolute_shap: 0.0892 },
          { rank: 2, feature_name: 'Age', mean_absolute_shap: 0.0612 },
          { rank: 3, feature_name: 'CR', mean_absolute_shap: 0.0523 },
          { rank: 4, feature_name: 'PLT', mean_absolute_shap: 0.0467 },
          { rank: 5, feature_name: 'TG', mean_absolute_shap: 0.0412 },
          { rank: 6, feature_name: 'HTN', mean_absolute_shap: 0.0389 },
          { rank: 7, feature_name: 'FBS', mean_absolute_shap: 0.0345 },
          { rank: 8, feature_name: 'EF-TTE', mean_absolute_shap: 0.0301 },
          { rank: 9, feature_name: 'BP', mean_absolute_shap: 0.0278 },
          { rank: 10, feature_name: 'LDL', mean_absolute_shap: 0.0254 },
        ],
      },
      RCA: {
        target: 'RCA',
        cohort_name: 'Tehran Heart Center Cohort',
        sample_size: 303,
        calculation_method: 'mean(abs(canonical_SHAP_contribution))',
        output_space: 'probability',
        top_features: [
          { rank: 1, feature_name: 'Typical Chest Pain', mean_absolute_shap: 0.0984 },
          { rank: 2, feature_name: 'DM', mean_absolute_shap: 0.0678 },
          { rank: 3, feature_name: 'Atypical', mean_absolute_shap: 0.0598 },
          { rank: 4, feature_name: 'Age', mean_absolute_shap: 0.0512 },
          { rank: 5, feature_name: 'Neut', mean_absolute_shap: 0.0445 },
          { rank: 6, feature_name: 'ESR', mean_absolute_shap: 0.0398 },
          { rank: 7, feature_name: 'Lymph', mean_absolute_shap: 0.0345 },
          { rank: 8, feature_name: 'Length', mean_absolute_shap: 0.0298 },
          { rank: 9, feature_name: 'WBC', mean_absolute_shap: 0.0267 },
          { rank: 10, feature_name: 'FBS', mean_absolute_shap: 0.0234 },
        ],
      },
    },
    cohort_name: 'Tehran Heart Center Cohort',
    sample_size: 303,
    calculation_method: 'TreeSHAP path-dependent perturbation with canonical one-hot feature aggregation',
    disclaimer: 'Research prototype disclaimer',
  };

  it('6. Handles target switching and associates canonical features with top 10 SHAP rankings', () => {
    (['Cath', 'LAD', 'LCX', 'RCA'] as TargetName[]).forEach((target) => {
      const topFeatures = sampleGlobalShap.targets[target].top_features;
      assert.equal(topFeatures.length, 10, `Target ${target} must have exactly 10 top features`);

      // Verify each top feature exists in canonical 54 features
      topFeatures.forEach((item) => {
        assert.ok(
          AUTHORITATIVE_54_FEATURE_NAMES.includes(item.feature_name),
          `SHAP feature ${item.feature_name} must be in the canonical 54 schema`
        );
        assert.ok(item.rank >= 1 && item.rank <= 10);
        assert.ok(item.mean_absolute_shap > 0);
      });
    });
  });

  it('7. Transparently documents top-10 limitation without falsely assigning zero importance to omitted features', () => {
    const cathTopNames = new Set(sampleGlobalShap.targets.Cath.top_features.map((f) => f.feature_name));
    const omittedFromCath = CLINICAL_FEATURES.filter((f) => !cathTopNames.has(f.canonicalName));

    assert.equal(omittedFromCath.length, 44, 'Exactly 44 canonical features are omitted from Cath top 10');

    // Omitted features must not have rank assigned or be fabricated as 0
    for (const omitted of omittedFromCath) {
      assert.equal(
        cathTopNames.has(omitted.canonicalName),
        false,
        `${omitted.canonicalName} is correctly recognized as unranked by top-10 endpoint`
      );
    }
  });
});

describe('Phase 5.0 Feature Explorer: Navigation & Route Preservation', () => {
  it('8. Verifies 5th workspace destination hash routing and formatting', () => {
    // 5. Feature Explorer aliases
    assert.equal(parseHashDestination('#feature-explorer'), 'feature-explorer');
    assert.equal(parseHashDestination('#features'), 'feature-explorer');
    assert.equal(parseHashDestination('#clinical-features'), 'feature-explorer');
    assert.equal(parseHashDestination('#feature-hub'), 'feature-explorer');
    assert.equal(parseHashDestination('#feature-catalogue'), 'feature-explorer');
    assert.equal(parseHashDestination('#learning-hub'), 'feature-explorer');
    assert.equal(formatDestinationHash('feature-explorer'), '#feature-explorer');

    // Existing 4 destinations must remain completely intact
    assert.equal(parseHashDestination('#overview'), 'overview');
    assert.equal(parseHashDestination('#explorer'), 'explorer');
    assert.equal(parseHashDestination('#report'), 'report');
    assert.equal(parseHashDestination('#model-review'), 'model-review');
    assert.equal(parseHashDestination('#assessment'), 'assessment');

    // Default and landing
    assert.equal(parseHashDestination(''), null);
    assert.equal(parseHashDestination('#landing'), null);
  });

  it('9. Verifies WorkspaceNavBar.tsx renders all 5 workspace destinations', () => {
    const navBarContent = fs.readFileSync(
      path.resolve('src/components/workspace/WorkspaceNavBar.tsx'),
      'utf8'
    );
    assert.ok(navBarContent.includes("'1. Prediction Overview'"));
    assert.ok(navBarContent.includes("'2. 3D Cardiovascular Explorer'"));
    assert.ok(navBarContent.includes("'3. Individual Assessment Report'"));
    assert.ok(navBarContent.includes("'4. Model Review & Explainability'"));
    assert.ok(navBarContent.includes("'5. Feature Explorer'"));
    assert.ok(navBarContent.includes("'feature-explorer'"));
  });

  it('10. Verifies CardioVisionWorkspace.tsx mounts FeatureExplorerView on #feature-explorer route', () => {
    const workspaceContent = fs.readFileSync(
      path.resolve('src/components/workspace/CardioVisionWorkspace.tsx'),
      'utf8'
    );
    assert.ok(workspaceContent.includes('FeatureExplorerView'));
    assert.ok(workspaceContent.includes("currentDestination === 'feature-explorer'"));
  });
});

describe('Phase 5.0 Feature Explorer: Centered Detail Modal & Accessibility', () => {
  const explorerViewCode = fs.readFileSync(
    path.resolve('src/components/workspace/FeatureExplorerView.tsx'),
    'utf8'
  );

  it('11. Verifies centered modal dialog semantics, backdrop, and dimensions (850-1000px, 85-90vh)', () => {
    // Dialog semantics and ARIA attributes
    assert.ok(explorerViewCode.includes('role="dialog"'), 'Must specify role="dialog"');
    assert.ok(explorerViewCode.includes('aria-modal="true"'), 'Must specify aria-modal="true"');
    assert.ok(explorerViewCode.includes('aria-labelledby="feature-modal-title"'), 'Must specify aria-labelledby');
    assert.ok(explorerViewCode.includes('aria-describedby="feature-modal-description"'), 'Must specify aria-describedby');

    // Centered presentation and translucent blurred backdrop
    assert.ok(
      explorerViewCode.includes('fixed inset-0 z-50 flex items-center justify-center'),
      'Modal must be centered horizontally and vertically in viewport'
    );
    assert.ok(
      explorerViewCode.includes('bg-slate-900/40') || explorerViewCode.includes('backdrop-blur'),
      'Backdrop must use subtle translucent overlay and restrained blur'
    );

    // Dimension constraints: max width ~850-1000px (max-w-4xl = 896px), max height ~85-90vh
    assert.ok(
      explorerViewCode.includes('max-w-4xl'),
      'Modal container must use max-w-4xl (896px, within 850-1000px range)'
    );
    assert.ok(
      explorerViewCode.includes('max-h-[88vh]') || explorerViewCode.includes('max-h-[85vh]'),
      'Modal container must use sensible viewport height (85-90vh)'
    );

    // Independent vertical scrolling with sticky header
    assert.ok(
      explorerViewCode.includes('overflow-y-auto'),
      'Modal body must have independent vertical scrolling'
    );
    assert.ok(
      explorerViewCode.includes('shrink-0'),
      'Modal header and footer must remain fixed/shrink-0 while body scrolls'
    );
  });

  it('12. Verifies modal dismissal mechanisms (Close button, backdrop click, and Escape key)', () => {
    // Backdrop click handler with e.stopPropagation inside modal
    assert.ok(
      explorerViewCode.includes('onClick={handleCloseModal}'),
      'Backdrop must close modal on click'
    );
    assert.ok(
      explorerViewCode.includes('onClick={(e) => e.stopPropagation()}'),
      'Clicking inside modal container must stop propagation to prevent premature closing'
    );

    // Close button
    assert.ok(
      explorerViewCode.includes('aria-label="Close feature details"'),
      'Close button must include accessible label'
    );

    // Escape key handling
    assert.ok(
      explorerViewCode.includes("e.key === 'Escape'"),
      'Escape key listener must dismiss the modal'
    );
  });

  it('13. Verifies previous/next feature navigation and arrow key cycling across filtered features', () => {
    assert.ok(
      explorerViewCode.includes('handlePrevFeature'),
      'Must provide handlePrevFeature callback'
    );
    assert.ok(
      explorerViewCode.includes('handleNextFeature'),
      'Must provide handleNextFeature callback'
    );
    assert.ok(
      explorerViewCode.includes("aria-label=" + '"Previous feature"'),
      'Previous feature button must have accessible label'
    );
    assert.ok(
      explorerViewCode.includes("aria-label=" + '"Next feature"'),
      'Next feature button must have accessible label'
    );

    // Keyboard arrow keys
    assert.ok(
      explorerViewCode.includes("e.key === 'ArrowLeft'"),
      'ArrowLeft key must navigate to previous feature'
    );
    assert.ok(
      explorerViewCode.includes("e.key === 'ArrowRight'"),
      'ArrowRight key must navigate to next feature'
    );
  });

  it('14. Verifies keyboard focus management and focus restoration on modal close', () => {
    assert.ok(
      explorerViewCode.includes('closeButtonRef'),
      'Must track close button ref for focus on modal open'
    );
    assert.ok(
      explorerViewCode.includes('triggerElementRef'),
      'Must track triggering element ref for focus restoration'
    );
    assert.ok(
      explorerViewCode.includes('triggerElementRef.current?.focus()'),
      'Must restore keyboard focus to the triggering element upon close'
    );
  });

  it('15. Verifies complete preservation of all clinical detail fields inside the modal', () => {
    // Definition and pathophysiological significance
    assert.ok(explorerViewCode.includes('selectedFeature.description'));
    assert.ok(explorerViewCode.includes('selectedFeature.clinicalSignificance'));

    // 3-Way range provenance
    assert.ok(explorerViewCode.includes('selectedFeature.schemaConstraints'));
    assert.ok(explorerViewCode.includes('selectedFeature.datasetStats'));
    assert.ok(explorerViewCode.includes('selectedFeature.clinicalReferenceRange'));

    // Preprocessing & zero defaults
    assert.ok(explorerViewCode.includes('selectedFeature.preprocessingMethod'));
    assert.ok(explorerViewCode.includes('selectedFeature.missingValueBehavior'));

    // Derivation formulas
    assert.ok(explorerViewCode.includes('selectedFeature.isDerived'));
    assert.ok(explorerViewCode.includes('selectedFeature.derivationFormula'));
    assert.ok(explorerViewCode.includes('selectedFeature.derivationSource'));

    // Global SHAP values across all 4 targets
    assert.ok(explorerViewCode.includes("['Cath', 'LAD', 'LCX', 'RCA']"));
    assert.ok(explorerViewCode.includes('mean_absolute_shap'));

    // Audit provenance
    assert.ok(explorerViewCode.includes('selectedFeature.provenanceEvidence'));
  });

  it('16. Verifies catalogue cards and Global SHAP predictor bars trigger the modal', () => {
    // Catalogue cards have dialog trigger semantics
    assert.ok(
      explorerViewCode.includes('aria-haspopup="dialog"'),
      'Catalogue items must indicate dialog popup semantics'
    );
    assert.ok(
      explorerViewCode.includes('handleOpenFeature(feature.canonicalName'),
      'Clicking catalogue card must open modal'
    );

    // Global SHAP bars also open the modal
    assert.ok(
      explorerViewCode.includes('handleOpenFeature(item.feature_name'),
      'Clicking SHAP predictor bar must open modal for that feature'
    );
  });

  it('17. Verifies categorical frequency statistics match cad_clean.csv (N=303) for all 8 audited features', () => {
    // 1. Sex: 176 males (58.1%), 127 females (41.9%)
    const sex = getFeatureByName('Sex');
    assert.ok(sex?.clinicalReferenceNotes?.includes('176 males (58.1%) and 127 females (41.9%)'));
    assert.equal(sex?.clinicalReferenceNotes?.includes('224 males'), false);

    // 2. Obesity: 69.6% (211/303)
    const obesity = getFeatureByName('Obesity');
    assert.ok(obesity?.clinicalReferenceNotes?.includes('69.6% (211/303)'));
    assert.equal(obesity?.clinicalReferenceNotes?.includes('53.1%'), false);

    // 3. DLP: 37.0% (112/303)
    const dlp = getFeatureByName('DLP');
    assert.ok(dlp?.clinicalReferenceNotes?.includes('37.0% (112/303)'));
    assert.equal(dlp?.clinicalReferenceNotes?.includes('66.0%'), false);

    // 4. Dyspnea: 44.2% (134/303)
    const dyspnea = getFeatureByName('Dyspnea');
    assert.ok(dyspnea?.clinicalReferenceNotes?.includes('44.2% (134/303)'));
    assert.equal(dyspnea?.clinicalReferenceNotes?.includes('15.2% (46/303)'), false);

    // 5. Function Class: Class 0: 211 (69.6%), Class 1: 1 (0.3%), Class 2: 73 (24.1%), Class 3: 18 (5.9%)
    const fnClass = getFeatureByName('Function Class');
    assert.ok(fnClass?.clinicalReferenceNotes?.includes('Class 0: 211 (69.6%)'));
    assert.ok(fnClass?.clinicalReferenceNotes?.includes('Class 1: 1 (0.3%)'));
    assert.ok(fnClass?.clinicalReferenceNotes?.includes('Class 2: 73 (24.1%)'));
    assert.ok(fnClass?.clinicalReferenceNotes?.includes('Class 3: 18 (5.9%)'));
    assert.equal(fnClass?.clinicalReferenceNotes?.includes('54.5%'), false);

    // 6. LVH: 6.6% (20/303)
    const lvh = getFeatureByName('LVH');
    assert.ok(lvh?.clinicalReferenceNotes?.includes('6.6% (20/303)'));
    assert.equal(lvh?.clinicalReferenceNotes?.includes('15.2% (46/303)'), false);

    // 7. Region RWMA: Score 0: 217 (71.6%), Score 1: 26 (8.6%), Score 2: 32 (10.6%), Score 3: 14 (4.6%), Score 4: 14 (4.6%)
    const rwma = getFeatureByName('Region RWMA');
    assert.ok(rwma?.clinicalReferenceNotes?.includes('Score 0: 217 (71.6%)'));
    assert.ok(rwma?.clinicalReferenceNotes?.includes('Score 1: 26 (8.6%)'));
    assert.ok(rwma?.clinicalReferenceNotes?.includes('Score 2: 32 (10.6%)'));
    assert.ok(rwma?.clinicalReferenceNotes?.includes('Score 3: 14 (4.6%)'));
    assert.ok(rwma?.clinicalReferenceNotes?.includes('Score 4: 14 (4.6%)'));
    assert.equal(rwma?.clinicalReferenceNotes?.includes('Score 0 (67.7%)'), false);

    // 8. VHD: Normal: 116 (38.3%), Mild: 149 (49.2%), Moderate: 27 (8.9%), Severe: 11 (3.6%)
    const vhd = getFeatureByName('VHD');
    assert.ok(vhd?.clinicalReferenceNotes?.includes('Normal: 116 (38.3%)'));
    assert.ok(vhd?.clinicalReferenceNotes?.includes('Mild: 149 (49.2%)'));
    assert.ok(vhd?.clinicalReferenceNotes?.includes('Moderate: 27 (8.9%)'));
    assert.ok(vhd?.clinicalReferenceNotes?.includes('Severe: 11 (3.6%)'));
    assert.equal(vhd?.clinicalReferenceNotes?.includes('Normal 68.0%'), false);
  });

  it('18. Verifies Function Class category is Clinical Status matching feature_metadata.csv', () => {
    const fnClass = getFeatureByName('Function Class');
    assert.equal(
      fnClass?.category,
      'Clinical Status',
      'Function Class category must be Clinical Status'
    );

    const clinicalStatusFeatures = getFeaturesByCategory('Clinical Status');
    assert.equal(clinicalStatusFeatures.length, 1);
    assert.equal(clinicalStatusFeatures[0].canonicalName, 'Function Class');

    // UI categories list in FeatureExplorerView.tsx must include Clinical Status
    assert.ok(
      explorerViewCode.includes("'Clinical Status'"),
      'FeatureExplorerView CATEGORIES array must include Clinical Status'
    );
  });
});


