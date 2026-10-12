/**
 * frontend/src/api/__tests__/landingPageRedesign.test.ts
 * Verification suite for Step 4 Redesign: Immersive Cinematic Landing Page.
 * Verifies:
 *  1. Centrally composed headline (“Every heartbeat tells a story.” / “Discover what lies beneath.”)
 *  2. Supporting copy and working CTAs (“Start Assessment”, “Explore How It Works”)
 *  3. Four prediction targets (Cath, LAD, LCX, RCA) with accurate anatomical definitions
 *  4. Real model architecture transparency (FastAPI, ColumnTransformer, Joblib, leakage protection)
 *  5. Clinical research prototype disclosure (Z-Alizadeh Sani, N=303, non-FDA-cleared)
 *  6. Anime.js 4 animation lifecycle and scope cleanup
 *  7. Atmospheric 3D background integration and reduced-motion compliance
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { animate, createTimeline, createScope } from 'animejs';

describe('Step 4: Immersive Cinematic Landing Page Verification', () => {
  it('1. Verifies centrally composed headline and supporting copy in CinematicHero', () => {
    const heroFilePath = resolve(process.cwd(), 'src/components/landing/CinematicHero.tsx');
    const content = readFileSync(heroFilePath, 'utf-8');

    // Headline Line 1: “Every heartbeat tells a story.”
    assert.match(
      content,
      /Every heartbeat tells a story\./i,
      'CinematicHero must contain "Every heartbeat tells a story."'
    );

    // Headline Line 2: “Discover what lies beneath.”
    assert.match(
      content,
      /Discover what lies beneath\./i,
      'CinematicHero must contain "Discover what lies beneath."'
    );

    // Brand Identity: CardioVision AI
    assert.match(
      content,
      /CardioVision AI/i,
      'CinematicHero must display CardioVision AI identity'
    );

    // Supporting copy requirement
    const expectedCopy =
      'Explore cardiovascular risk predictions through machine learning and structured patient assessment.';
    assert.ok(
      content.includes(expectedCopy),
      `CinematicHero must contain exact supporting copy: "${expectedCopy}"`
    );

    // Primary CTA: Start Assessment
    assert.match(
      content,
      /Start Assessment/i,
      'CinematicHero must contain "Start Assessment" CTA'
    );
    assert.match(
      content,
      /onOpenGetStarted/i,
      'CinematicHero must wire Start Assessment to onOpenGetStarted'
    );

    // Secondary CTA: Explore How It Works
    assert.match(
      content,
      /Explore How It Works/i,
      'CinematicHero must contain "Explore How It Works" CTA'
    );
  });

  it('2. Verifies four dedicated prediction targets in PredictionTargetsSection', () => {
    const targetsFilePath = resolve(
      process.cwd(),
      'src/components/landing/PredictionTargetsSection.tsx'
    );
    const content = readFileSync(targetsFilePath, 'utf-8');

    // All four canonical targets must be defined
    assert.ok(content.includes("code: 'Cath'"), 'Must define Cath target');
    assert.ok(content.includes("code: 'LAD'"), 'Must define LAD target');
    assert.ok(content.includes("code: 'LCX'"), 'Must define LCX target');
    assert.ok(content.includes("code: 'RCA'"), 'Must define RCA target');

    // Accurate anatomical territories
    assert.ok(
      content.includes('Left Anterior Descending'),
      'Must explain LAD anatomy'
    );
    assert.ok(
      content.includes('Left Circumflex'),
      'Must explain LCX anatomy'
    );
    assert.ok(
      content.includes('Right Coronary Artery'),
      'Must explain RCA anatomy'
    );
    assert.ok(
      content.includes('Overall CAD Outcome'),
      'Must explain Cath outcome'
    );
  });

  it('3. Verifies implemented model architecture transparency', () => {
    const archFilePath = resolve(
      process.cwd(),
      'src/components/landing/ModelArchitectureSection.tsx'
    );
    const content = readFileSync(archFilePath, 'utf-8');

    assert.match(content, /FastAPI/i, 'Must cite FastAPI validation layer');
    assert.match(content, /ColumnTransformer/i, 'Must cite ColumnTransformer preprocessing');
    assert.match(content, /backend\/schemas\.py/i, 'Must cite schemas.py');
    assert.match(content, /ml\/transformers\.py/i, 'Must cite transformers.py');
    assert.match(content, /Zero Data Leakage/i, 'Must cite zero data leakage guarantee');
  });

  it('4. Verifies research prototype disclaimer and cohort limitations', () => {
    const transFilePath = resolve(
      process.cwd(),
      'src/components/landing/TransparencySection.tsx'
    );
    const content = readFileSync(transFilePath, 'utf-8');

    // Z-Alizadeh Sani benchmark cohort (N=303, Tehran Heart Center)
    assert.match(content, /Z-Alizadeh Sani/i, 'Must cite Z-Alizadeh Sani benchmark cohort');
    assert.match(content, /Tehran Heart Center/i, 'Must cite Tehran Heart Center origin');
    assert.match(content, /N=303/i, 'Must disclose cohort size (N=303)');

    // Non-diagnostic FDA disclaimer
    assert.match(
      content,
      /not[\s\S]*cleared by the.*FDA/i,
      'Must state prototype is not FDA-cleared'
    );
    assert.match(content, /Investigational/i, 'Must state investigational research purpose');
  });

  it('5. Verifies Anime.js 4 animation lifecycle and scope cleanup', () => {
    assert.strictEqual(typeof animate, 'function', 'animejs animate must be exported');
    assert.strictEqual(typeof createTimeline, 'function', 'animejs createTimeline must be exported');
    assert.strictEqual(typeof createScope, 'function', 'animejs createScope must be exported');

    // Test timeline creation and scope cleanup
    const scope = createScope();
    let animRan = false;
    scope.add(() => {
      const tl = createTimeline({ defaults: { duration: 100 } });
      assert.ok(tl, 'Timeline created successfully');
      animRan = true;
    });

    assert.ok(animRan, 'Scope execution succeeded');
    assert.doesNotThrow(() => {
      scope.revert();
    }, 'scope.revert() must cleanly revert animations');
  });

  it('6. Verifies atmospheric 3D background integration and reduced motion support', () => {
    const appFilePath = resolve(process.cwd(), 'src/App.tsx');
    const content = readFileSync(appFilePath, 'utf-8');

    // Prefers reduced motion media query listener
    assert.match(content, /prefers-reduced-motion/i, 'App must monitor prefers-reduced-motion');

    // Atmospheric 3D background mounted with reducedMotion
    assert.match(
      content,
      /<AtmosphericCardiacBackground[^>]*reducedMotion={reducedMotion}/s,
      'App must mount AtmosphericCardiacBackground with reducedMotion prop'
    );

    // Patient Assessment Modal wired up
    assert.match(content, /<PatientAssessmentModal/i, 'App must mount PatientAssessmentModal');
  });

  it('7. Verifies continuous scroll vascular environment and calibrated 3D heart scale', () => {
    const appFilePath = resolve(process.cwd(), 'src/App.tsx');
    const appContent = readFileSync(appFilePath, 'utf-8');

    // Continuous scroll vascular environment mounted
    assert.match(
      appContent,
      /<ScrollVascularEnvironment[^>]*reducedMotion={reducedMotion}/s,
      'App must mount ScrollVascularEnvironment'
    );

    const heartFilePath = resolve(
      process.cwd(),
      'src/components/landing/AtmosphericCardiacBackground.tsx'
    );
    const heartContent = readFileSync(heartFilePath, 'utf-8');

    // Calibrated heart scale (1.72) and IntersectionObserver frameloop culling
    assert.match(
      heartContent,
      /baseScale = 1\.72/i,
      'Heart scale must be calibrated to 1.72 for zero clipping'
    );
    assert.match(
      heartContent,
      /frameloop=\{isHeroVisible \? 'always' : 'never'\}/i,
      'Canvas must implement isHeroVisible frameloop culling'
    );
  });
});
