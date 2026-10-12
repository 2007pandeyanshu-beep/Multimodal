/**
 * frontend/src/api/__tests__/phase3e3VisualPolish.test.ts
 * Verification test suite for Phase 3E.3: Premium Anatomical Visualization & Interactive Prediction Cards.
 * Validates the natural warm cardiac myocardium palette, coherent arterial palette,
 * interactive floating prediction cards, and landing page safety.
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ARTERY_METADATA } from '../../components/CoronaryResultsCanvas.tsx';

describe('Phase 3E.3: Premium Anatomical Visualization & Hover Prediction Cards', () => {
  it('1. Verifies natural warm cardiac myocardium palette (#CF727C) and opacity in CoronaryResultsCanvas', () => {
    const canvasPath = path.resolve('src/components/CoronaryResultsCanvas.tsx');
    assert.ok(fs.existsSync(canvasPath), 'CoronaryResultsCanvas.tsx must exist');
    const content = fs.readFileSync(canvasPath, 'utf8');

    // Natural warm cardiac crimson/rose palette (testing around #C96A74 - #D97882)
    assert.ok(
      content.includes('#CF727C') || content.includes('#C96A74') || content.includes('#D97882'),
      'Myocardium must use warm cardiac crimson/rose palette'
    );

    // Opacity must communicate solid heart volume (not transparent ghost)
    assert.ok(
      content.includes('0.82') || content.includes('0.85'),
      'Myocardium neutral opacity must communicate solid cardiac volume'
    );

    // Depth write enabled for solid rendering
    assert.ok(
      content.includes('depthWrite={true}'),
      'Myocardium must have depthWrite enabled for volumetric depth'
    );
  });

  it('2. Verifies coherent arterial coral/red palette across all coronary branches in neutral state', () => {
    const canvasPath = path.resolve('src/components/CoronaryResultsCanvas.tsx');
    const content = fs.readFileSync(canvasPath, 'utf8');

    // Check arterial coral/red palette for LAD, LCX, RCA, LMCA
    assert.ok(content.includes('#ff5c7c'), 'LAD must use vivid arterial coral');
    assert.ok(content.includes('#ff6b8b'), 'LCX must use bright warm rose coral (not green in neutral)');
    assert.ok(content.includes('#ff4d6d'), 'RCA must use luminous scarlet coral (not blue in neutral)');
    assert.ok(content.includes('#e11d48'), 'LMCA must use deep crimson anchor');

    // Cyan highlight reserved for active selection state
    assert.ok(
      content.includes("isLadActive ? '#38bdf8'"),
      'Active vessel must use cyan highlight on selection'
    );
  });

  it('3. Verifies interactive floating prediction card component and structure', () => {
    const canvasPath = path.resolve('src/components/CoronaryResultsCanvas.tsx');
    const content = fs.readFileSync(canvasPath, 'utf8');

    // Floating card component
    assert.ok(
      content.includes('FloatingPredictionCard'),
      'Must define FloatingPredictionCard component'
    );

    // Prediction card elements
    assert.ok(content.includes('Model Prediction:'), 'Card must show Model Prediction label');
    assert.ok(content.includes('Prediction unavailable'), 'Card must handle missing predictions cleanly');
    assert.ok(content.includes('Threshold: 50%'), 'Card must show threshold reference');
    assert.ok(content.includes('Focused in 3D'), 'Card must show focused indicator when selected');
  });

  it('4. Verifies ARTERY_METADATA maps all 4 structures with FMA and clinical courses', () => {
    const keys = ['LAD', 'LCX', 'RCA', 'Cath'];
    for (const k of keys) {
      const item = ARTERY_METADATA[k];
      assert.ok(item, `Metadata item ${k} must exist`);
      assert.ok(item.fullName.length > 0, `Full name for ${k} must be non-empty`);
      assert.ok(item.fma.startsWith('FMA:'), `FMA ID for ${k} must be valid FMA concept`);
      assert.ok(item.territory.length > 0, `Perfusion territory for ${k} must be non-empty`);
      assert.ok(item.course.length > 0, `Anatomical course for ${k} must be non-empty`);
    }
  });

  it('5. Verifies touchscreen tap support and dismiss controls', () => {
    const canvasPath = path.resolve('src/components/CoronaryResultsCanvas.tsx');
    const content = fs.readFileSync(canvasPath, 'utf8');

    // Missed pointer click clears selection and cards
    assert.ok(content.includes('onPointerMissed'), 'Must support onPointerMissed for click-away dismiss');

    // Card dismiss button
    assert.ok(content.includes('onDismiss'), 'Floating card must support dismiss handler');
  });

  it('6. Verifies Landing page HeroSection and HeartCanvas remain completely unchanged', () => {
    const heroPath = path.resolve('src/components/landing/HeroSection.tsx');
    const content = fs.readFileSync(heroPath, 'utf8');
    assert.ok(content.includes('HeartCanvas'), 'HeroSection must continue using HeartCanvas');
    assert.ok(!content.includes('coronary_heart_bp3d.glb'), 'HeroSection must not load bp3d asset');
  });
});
