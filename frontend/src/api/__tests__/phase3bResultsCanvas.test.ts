/**
 * frontend/src/api/__tests__/phase3bResultsCanvas.test.ts
 * Verification tests for Phase 3B Step 1: Dedicated 3D Assessment Canvas.
 * Validates component exports, camera preset contracts, WebGL error boundaries,
 * and integration within PredictionResultsView without altering existing tests.
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  CAMERA_PRESETS,
  type CameraPresetKey,
} from '../../components/CoronaryResultsCanvas.tsx';

describe('Phase 3B Step 1: Dedicated 3D Assessment Canvas Verification', () => {
  it('1. Verifies CAMERA_PRESETS contains all 4 agreed presets with verified 3D coordinates', () => {
    const expectedKeys: CameraPresetKey[] = ['anterior', 'lateral', 'posterior', 'reset'];
    for (const key of expectedKeys) {
      const preset = CAMERA_PRESETS[key];
      assert.ok(preset, `Preset ${key} must exist`);
      assert.equal(preset.key, key);
      assert.ok(preset.label.length > 0, `Preset ${key} must have a non-empty label`);
      assert.ok(preset.description.length > 0, `Preset ${key} must have a description`);
      assert.equal(preset.position.length, 3, `Position must have 3 coordinates [x, y, z]`);
      assert.equal(preset.target.length, 3, `Target must have 3 coordinates [x, y, z]`);

      // Verify distance is within sensible bounds (3.2 <= distance <= 8.0)
      const dist = Math.sqrt(
        preset.position[0] ** 2 + preset.position[1] ** 2 + preset.position[2] ** 2
      );
      assert.ok(dist >= 3.2 && dist <= 8.0, `Camera distance ${dist} must be within [3.2, 8.0]`);
    }
  });

  it('2. Verifies CoronaryResultsCanvas source code structure and constraints', () => {
    const canvasPath = path.resolve('src/components/CoronaryResultsCanvas.tsx');
    assert.ok(fs.existsSync(canvasPath), 'CoronaryResultsCanvas.tsx must exist');
    const content = fs.readFileSync(canvasPath, 'utf8');

    // Reuses existing heart model and glTF
    assert.ok(content.includes('HeartModel'), 'Must reuse HeartModel');
    assert.ok(content.includes("from './HeartCanvas.tsx'"), 'Must import from HeartCanvas.tsx');

    // WebGL Error Boundary present
    assert.ok(content.includes('WebGLErrorBoundary'), 'Must include WebGLErrorBoundary');

    // Camera presets and OrbitControls
    assert.ok(content.includes('OrbitControls'), 'Must include OrbitControls');
    assert.ok(content.includes('CameraRig'), 'Must include CameraRig');

    // Reduced motion & performance protections
    assert.ok(content.includes('prefers-reduced-motion'), 'Must check prefers-reduced-motion');
    assert.ok(content.includes('devicePixelRatio'), 'Must cap devicePixelRatio');

    // Scientific disclaimer
    assert.ok(
      content.includes('not patient-specific geometry'),
      'Must contain scientific integrity disclosure'
    );
  });

  it('3. Verifies HeartCanvas backward compatibility on landing page', () => {
    const heartCanvasPath = path.resolve('src/components/HeartCanvas.tsx');
    assert.ok(fs.existsSync(heartCanvasPath), 'HeartCanvas.tsx must exist');
    const content = fs.readFileSync(heartCanvasPath, 'utf8');

    // Must export HeartModel and HeartModelProps
    assert.ok(content.includes('export function HeartModel'), 'Must export HeartModel');
    assert.ok(content.includes('export interface HeartModelProps'), 'Must export HeartModelProps');
    assert.ok(content.includes('enableDrift'), 'Must support enableDrift prop');

    // Main landing export preserved
    assert.ok(content.includes('export const HeartCanvas'), 'Must export HeartCanvas');
  });

  it('4. Verifies PredictionResultsView integrates CoronaryResultsCanvas in correct order', () => {
    const resultsViewPath = path.resolve('src/components/PredictionResultsView.tsx');
    assert.ok(fs.existsSync(resultsViewPath), 'PredictionResultsView.tsx must exist');
    const content = fs.readFileSync(resultsViewPath, 'utf8');

    // Import check
    assert.ok(
      content.includes("import { CoronaryResultsCanvas } from './CoronaryResultsCanvas.tsx';"),
      'Must import CoronaryResultsCanvas'
    );

    // Layout order check: Canvas mounted before Cath card
    const canvasIdx = content.indexOf('<CoronaryResultsCanvas');
    const cathIdx = content.indexOf("renderTargetCard('Cath'");
    const ladIdx = content.indexOf("renderTargetCard('LAD')");

    assert.ok(canvasIdx > 0, '<CoronaryResultsCanvas /> must be mounted');
    assert.ok(cathIdx > 0, "renderTargetCard('Cath') must be present");
    assert.ok(ladIdx > 0, "renderTargetCard('LAD') must be present");
    assert.ok(
      canvasIdx < cathIdx,
      'CoronaryResultsCanvas must be rendered ABOVE Target 1 Cath card'
    );
    assert.ok(
      cathIdx < ladIdx,
      'Target 1 Cath card must be rendered before vessel cards (LAD, LCX, RCA)'
    );
  });
});
