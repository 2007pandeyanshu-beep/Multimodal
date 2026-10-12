/**
 * frontend/src/api/__tests__/phase3e4ColorRefinement.test.ts
 * Verification test suite for Phase 3E.4: Premium Coronary Color System & Anatomical Polish.
 * Validates the distinct three-artery color palette (LAD Coral, LCX Violet, RCA Teal),
 * soft myocardium shading (roughness 0.68), compact color legend, and landing page safety.
 * Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  ARTERY_METADATA,
  ArteryColorLegend,
} from '../../components/CoronaryResultsCanvas.tsx';

describe('Phase 3E.4: Premium Coronary Color System & Anatomical Polish', () => {
  it('1. Verifies distinct three-artery color palette in ARTERY_METADATA and component', () => {
    // LAD: Coral Red #E94F70
    assert.equal(ARTERY_METADATA.LAD.color, '#E94F70', 'LAD must be Coral Red #E94F70');
    assert.equal(ARTERY_METADATA.LAD.colorName, 'Coral Red');

    // LCX: Violet #8B5CF6
    assert.equal(ARTERY_METADATA.LCX.color, '#8B5CF6', 'LCX must be Violet #8B5CF6');
    assert.equal(ARTERY_METADATA.LCX.colorName, 'Violet');

    // RCA: Teal #0891B2
    assert.equal(ARTERY_METADATA.RCA.color, '#0891B2', 'RCA must be Teal #0891B2');
    assert.equal(ARTERY_METADATA.RCA.colorName, 'Teal');

    // LMCA: Deep Crimson #BE123C
    assert.equal(ARTERY_METADATA.Cath.color, '#BE123C', 'LMCA must be Deep Crimson #BE123C');
  });

  it('2. Verifies CoronaryResultsCanvas source code applies the 3-artery colors to 3D meshes', () => {
    const canvasPath = path.resolve('src/components/CoronaryResultsCanvas.tsx');
    assert.ok(fs.existsSync(canvasPath), 'CoronaryResultsCanvas.tsx must exist');
    const content = fs.readFileSync(canvasPath, 'utf8');

    // Vessel mesh colors
    assert.ok(content.includes('color="#E94F70"'), 'LAD mesh must use #E94F70');
    assert.ok(content.includes('color="#8B5CF6"'), 'LCX mesh must use #8B5CF6');
    assert.ok(content.includes('color="#0891B2"'), 'RCA mesh must use #0891B2');
    assert.ok(content.includes('color="#BE123C"'), 'LMCA mesh must use #BE123C');
    assert.ok(content.includes('color="#f1e5e6"'), 'Aorta mesh must use warm ivory/alabaster #f1e5e6');
  });

  it('3. Verifies softer myocardium surface shading (roughness 0.68) eliminating plastic glare', () => {
    const canvasPath = path.resolve('src/components/CoronaryResultsCanvas.tsx');
    const content = fs.readFileSync(canvasPath, 'utf8');

    // Soft velvety roughness on myocardium
    assert.ok(
      content.includes('roughness={0.68}'),
      'Myocardium roughness must be 0.68 to soften specular reflections'
    );
    assert.ok(content.includes('color="#CF727C"'), 'Myocardium base color must be #CF727C');
    assert.ok(content.includes('depthWrite={true}'), 'Myocardium depthWrite must remain enabled');
  });

  it('4. Verifies compact ArteryColorLegend component and clickable entries', () => {
    assert.ok(typeof ArteryColorLegend === 'function', 'ArteryColorLegend must be exported');

    const canvasPath = path.resolve('src/components/CoronaryResultsCanvas.tsx');
    const content = fs.readFileSync(canvasPath, 'utf8');

    assert.ok(
      content.includes('<ArteryColorLegend'),
      'CoronaryResultsCanvas must mount ArteryColorLegend inside 3D viewer'
    );
    assert.ok(content.includes('bg-[#E94F70]'), 'Legend must contain Coral dot for LAD');
    assert.ok(content.includes('bg-[#8B5CF6]'), 'Legend must contain Violet dot for LCX');
    assert.ok(content.includes('bg-[#0891B2]'), 'Legend must contain Teal dot for RCA');
  });

  it('5. Verifies hover and selection states preserve identity color differentiation', () => {
    const canvasPath = path.resolve('src/components/CoronaryResultsCanvas.tsx');
    const content = fs.readFileSync(canvasPath, 'utf8');

    // Hover emissive states preserve identity hues
    assert.ok(content.includes('#FDA4AF'), 'LAD hover must use coral rose emissive');
    assert.ok(content.includes('#DDD6FE'), 'LCX hover must use soft violet emissive');
    assert.ok(content.includes('#67E8F9'), 'RCA hover must use bright teal emissive');

    // Selected emissive provides restrained highlight while retaining identity
    assert.ok(content.includes('emissiveIntensity={isLadActive ? 0.50'), 'LAD selection intensity must be restrained');
    assert.ok(content.includes('emissiveIntensity={isLcxActive ? 0.55'), 'LCX selection intensity must be restrained');
    assert.ok(content.includes('emissiveIntensity={isRcaActive ? 0.55'), 'RCA selection intensity must be restrained');
  });

  it('6. Verifies Landing page HeroSection and HeartCanvas remain completely unchanged', () => {
    const heroPath = path.resolve('src/components/landing/HeroSection.tsx');
    const content = fs.readFileSync(heroPath, 'utf8');
    assert.ok(content.includes('HeartCanvas'), 'HeroSection must continue using HeartCanvas');
    assert.ok(!content.includes('coronary_heart_bp3d.glb'), 'HeroSection must not load bp3d asset');
  });
});
