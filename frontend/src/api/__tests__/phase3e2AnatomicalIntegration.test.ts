/**
 * frontend/src/api/__tests__/phase3e2AnatomicalIntegration.test.ts
 * Verification test suite for Phase 3E.2: Anatomical Asset Verification & Production Integration.
 * Validates deployment of BodyParts3D Release 4.0 GLB, CC BY-SA 2.1 Japan attribution,
 * discrete mesh references, bidirectional state synchronization, and landing page safety.
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Phase 3E.2: Anatomical Asset Production Integration Verification', () => {
  it('1. Verifies coronary_heart_bp3d.glb asset deployment and size budget', () => {
    const glbPath = path.resolve('public/models/coronary_heart_bp3d.glb');
    assert.ok(fs.existsSync(glbPath), 'coronary_heart_bp3d.glb must exist in public/models/');
    const stats = fs.statSync(glbPath);
    assert.ok(stats.size > 1_500_000, `Asset size ${stats.size} must be > 1.5 MB`);
    assert.ok(stats.size <= 4_000_000, `Asset size ${stats.size} must be <= 4.0 MB budget`);
  });

  it('2. Verifies legacy heart.glb is preserved intact for rollback safety', () => {
    const legacyPath = path.resolve('public/models/heart.glb');
    assert.ok(fs.existsSync(legacyPath), 'Legacy heart.glb must be preserved');
    const stats = fs.statSync(legacyPath);
    assert.ok(stats.size > 7_000_000, 'Legacy heart.glb must retain its full size (~7.21 MB)');
  });

  it('3. Verifies BODYPARTS3D_LICENSE.txt attribution file and CC BY-SA 2.1 JP terms', () => {
    const licensePath = path.resolve('public/models/BODYPARTS3D_LICENSE.txt');
    assert.ok(fs.existsSync(licensePath), 'BODYPARTS3D_LICENSE.txt must exist');
    const content = fs.readFileSync(licensePath, 'utf8');

    assert.ok(
      content.includes('BodyParts3D, © The Database Center for Life Science licensed under CC Attribution-Share Alike 2.1 Japan'),
      'Must contain mandatory DBCLS attribution string'
    );
    assert.ok(content.includes('CC BY-SA 2.1 JP') || content.includes('CC BY-SA 2.1 Japan'), 'Must specify CC BY-SA 2.1 license');
    assert.ok(content.includes('Release 4.0'), 'Must cite BodyParts3D Release 4.0');
  });

  it('4. Verifies CoronaryResultsCanvas references all 6 verified mesh names and loads bp3d GLB', () => {
    const canvasPath = path.resolve('src/components/CoronaryResultsCanvas.tsx');
    assert.ok(fs.existsSync(canvasPath), 'CoronaryResultsCanvas.tsx must exist');
    const content = fs.readFileSync(canvasPath, 'utf8');

    // Must load verified asset
    assert.ok(
      content.includes("useGLTF('/models/coronary_heart_bp3d.glb')"),
      'Must load /models/coronary_heart_bp3d.glb'
    );
    assert.ok(
      content.includes("useGLTF.preload('/models/coronary_heart_bp3d.glb')"),
      'Must preload /models/coronary_heart_bp3d.glb'
    );

    // All 6 verified mesh names must be queried
    const verifiedMeshes = [
      'Heart_Myocardium',
      'Aorta_Root',
      'Artery_LMCA',
      'Artery_LAD',
      'Artery_LCX',
      'Artery_RCA',
    ];

    for (const meshName of verifiedMeshes) {
      assert.ok(
        content.includes(meshName),
        `Must reference verified mesh node '${meshName}'`
      );
    }

    // Must support bidirectional selection props
    assert.ok(content.includes('selectedTarget'), 'Must accept selectedTarget prop');
    assert.ok(content.includes('onSelectTarget'), 'Must accept onSelectTarget prop');
  });

  it('5. Verifies PredictionResultsView integrates bidirectional selection synchronization', () => {
    const viewPath = path.resolve('src/components/PredictionResultsView.tsx');
    assert.ok(fs.existsSync(viewPath), 'PredictionResultsView.tsx must exist');
    const content = fs.readFileSync(viewPath, 'utf8');

    assert.ok(
      content.includes('const [selectedTarget, setSelectedTarget] = useState'),
      'Must maintain selectedTarget state'
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
      content.includes('Focused in 3D'),
      'Must display visual focus badge when a target is active'
    );
  });

  it('6. Verifies Landing page HeroSection remains decoupled and unchanged', () => {
    const heroPath = path.resolve('src/components/landing/HeroSection.tsx');
    assert.ok(fs.existsSync(heroPath), 'HeroSection.tsx must exist');
    const content = fs.readFileSync(heroPath, 'utf8');

    // Landing page uses cinematic HeartCanvas
    assert.ok(content.includes('HeartCanvas'), 'HeroSection must continue using HeartCanvas');
    assert.ok(!content.includes('coronary_heart_bp3d.glb'), 'HeroSection must not load bp3d asset');
  });
});
