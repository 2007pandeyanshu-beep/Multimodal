import React, { useEffect, useState } from 'react';

interface ScrollVascularEnvironmentProps {
  reducedMotion: boolean;
}

export const ScrollVascularEnvironment: React.FC<
  ScrollVascularEnvironmentProps
> = ({ reducedMotion }) => {
  // Track active sections via IntersectionObserver (zero scroll event listeners)
  const [activeSections, setActiveSections] = useState<Record<string, boolean>>({
    'hero-section': true,
    'problem-approach': false,
    'target-vessels': false,
    'how-it-works': false,
    'architecture': false,
    'transparency': false,
    'closing-cta': false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const sectionIds = [
      'hero-section',
      'problem-approach',
      'target-vessels',
      'how-it-works',
      'architecture',
      'transparency',
      'closing-cta',
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSections((prev) => {
              if (prev[entry.target.id]) return prev;
              return { ...prev, [entry.target.id]: true };
            });
          }
        });
      },
      {
        root: null,
        rootMargin: '100px 0px -100px 0px',
        threshold: 0.1,
      }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0"
      aria-hidden="true"
    >
      {/* ========================================================
          1. AMBIENT ATMOSPHERIC GRADIENTS ACROSS SCROLL CANVAS
         ======================================================== */}
      {/* Hero Central Halo (Cyan + Lavender) */}
      <div
        className="absolute top-[8%] left-[24%] w-[680px] h-[580px] rounded-full pointer-events-none opacity-60"
        style={{
          background:
            'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, rgba(14, 165, 233, 0.03) 50%, transparent 72%)',
          transform: 'translateZ(0)',
        }}
      />
      <div
        className="absolute top-[16%] right-[20%] w-[620px] h-[520px] rounded-full pointer-events-none opacity-50"
        style={{
          background:
            'radial-gradient(circle, rgba(167, 139, 250, 0.12) 0%, rgba(192, 132, 252, 0.02) 50%, transparent 68%)',
          transform: 'translateZ(0)',
        }}
      />

      {/* Target Arteries Zone Atmospheric Halo (Section C) */}
      <div
        className="absolute top-[28%] left-[15%] w-[600px] h-[600px] rounded-full pointer-events-none opacity-45"
        style={{
          background:
            'radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, rgba(129, 140, 248, 0.04) 55%, transparent 70%)',
          transform: 'translateZ(0)',
        }}
      />
      <div
        className="absolute top-[35%] right-[15%] w-[550px] h-[550px] rounded-full pointer-events-none opacity-35"
        style={{
          background:
            'radial-gradient(circle, rgba(251, 113, 133, 0.08) 0%, transparent 60%)',
          transform: 'translateZ(0)',
        }}
      />

      {/* Architecture & How It Works Connecting Halo (Section D & E) */}
      <div
        className="absolute top-[55%] left-[25%] w-[700px] h-[500px] rounded-full pointer-events-none opacity-40"
        style={{
          background:
            'radial-gradient(circle, rgba(14, 165, 233, 0.10) 0%, rgba(167, 139, 250, 0.04) 50%, transparent 70%)',
          transform: 'translateZ(0)',
        }}
      />

      {/* Closing CTA Atmospheric Glow (Section G) */}
      <div
        className="absolute bottom-[4%] right-[20%] w-[650px] h-[550px] rounded-full pointer-events-none opacity-45"
        style={{
          background:
            'radial-gradient(circle, rgba(56, 189, 248, 0.14) 0%, rgba(251, 113, 133, 0.06) 55%, transparent 70%)',
          transform: 'translateZ(0)',
        }}
      />

      {/* ========================================================
          2. CONTINUOUS SVG VASCULAR ENVIRONMENT
         ======================================================== */}
      <svg
        viewBox="0 0 1440 4200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-cover"
        preserveAspectRatio="xMidYMin slice"
      >
        <defs>
          {/* Subtle Radial Vignette for Hero Central Zone */}
          <radialGradient id="hero-vignette" cx="50%" cy="380" r="420" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.75" />
            <stop offset="85%" stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
          </radialGradient>
          <mask id="hero-mask">
            <rect x="0" y="0" width="1440" height="950" fill="url(#hero-vignette)" />
          </mask>

          {/* Gradients for arterial, venous, and coronary tracks */}
          <linearGradient id="art-cyan-flow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.32" />
            <stop offset="50%" stopColor="#0891b2" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#0d9488" stopOpacity="0.10" />
          </linearGradient>

          <linearGradient id="ven-lav-flow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.28" />
            <stop offset="50%" stopColor="#6366f1" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.08" />
          </linearGradient>

          <linearGradient id="cor-rose-flow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fb7185" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#fda4af" stopOpacity="0.06" />
          </linearGradient>

          <linearGradient id="spine-conduit" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.25" />
            <stop offset="30%" stopColor="#818cf8" stopOpacity="0.20" />
            <stop offset="60%" stopColor="#0891b2" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        {/* ----------------------------------------------------
            ZONE 1: HERO VASCULAR BRANCHING (Y: 0 -> 950)
           ---------------------------------------------------- */}
        <g
          mask="url(#hero-mask)"
          className={`transition-opacity duration-1000 ${
            activeSections['hero-section'] || reducedMotion ? 'opacity-100' : 'opacity-20'
          }`}
        >
          {/* Caliper Reference Diagnostic Arcs around central heart */}
          <circle
            cx="720"
            cy="390"
            r="240"
            stroke="#0284c7"
            strokeWidth="0.8"
            strokeDasharray="4 8"
            strokeOpacity="0.2"
          />
          <circle
            cx="720"
            cy="390"
            r="340"
            stroke="#818cf8"
            strokeWidth="0.8"
            strokeDasharray="5 12"
            strokeOpacity="0.15"
          />

          {/* Left Upper Aorta & Pulmonary Arterial Branches (Arching to left margin) */}
          <path
            d="M705 240 C685 180, 650 130, 605 90 C560 50, 500 25, 430 15"
            stroke="url(#art-cyan-flow)"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M650 130 C615 110, 565 95, 510 85 C455 75, 400 70, 340 72"
            stroke="url(#art-cyan-flow)"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          <path
            d="M605 90 C575 70, 535 55, 490 45"
            stroke="url(#art-cyan-flow)"
            strokeWidth="0.9"
            strokeLinecap="round"
          />

          {/* Left Anterior Descending (LAD) and diagonal branches framing left side */}
          <path
            d="M690 310 C660 360, 630 420, 605 490 C580 560, 550 630, 505 690"
            stroke="url(#art-cyan-flow)"
            strokeWidth="2.0"
            strokeLinecap="round"
          />
          <path
            d="M650 380 C615 400, 570 420, 520 435 C470 450, 420 455, 360 458"
            stroke="url(#art-cyan-flow)"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d="M620 460 C585 495, 540 530, 485 555 C430 580, 370 590, 310 595"
            stroke="url(#art-cyan-flow)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />

          {/* Right Upper Aorta / Pulmonary Trunk Branches (Arching to right margin) */}
          <path
            d="M735 235 C760 175, 800 125, 850 85 C900 45, 960 20, 1030 10"
            stroke="url(#ven-lav-flow)"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M800 125 C840 105, 890 90, 950 80 C1010 70, 1070 65, 1130 68"
            stroke="url(#ven-lav-flow)"
            strokeWidth="1.3"
            strokeLinecap="round"
          />

          {/* Right Coronary Artery (RCA) Sulcus Track & Marginal Branches */}
          <path
            d="M750 310 C785 355, 820 410, 845 475 C870 540, 885 610, 880 680"
            stroke="url(#ven-lav-flow)"
            strokeWidth="2.0"
            strokeLinecap="round"
          />
          <path
            d="M815 385 C855 400, 905 415, 960 425 C1015 435, 1070 440, 1125 442"
            stroke="url(#ven-lav-flow)"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d="M840 480 C880 515, 930 550, 985 575 C1040 600, 1100 610, 1160 615"
            stroke="url(#ven-lav-flow)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />

          {/* Delicate Tissue Perfusion Micro-Filaments (Coral) */}
          <path
            d="M590 510 C560 535, 520 560, 470 578 C420 595, 370 605, 320 610"
            stroke="url(#cor-rose-flow)"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeDasharray="2 3"
          />
          <path
            d="M860 510 C895 535, 940 560, 990 578 C1040 595, 1090 605, 1140 610"
            stroke="url(#cor-rose-flow)"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeDasharray="2 3"
          />
        </g>

        {/* ----------------------------------------------------
            ZONE 2: INTER-SECTION DESCENDING CONDUIT (Y: 750 -> 1500)
            Flowing smoothly from Hero into Approach (Section B)
           ---------------------------------------------------- */}
        <g
          className={`transition-all duration-1000 ${
            activeSections['problem-approach'] || reducedMotion ? 'opacity-90' : 'opacity-30'
          }`}
        >
          {/* Central Descending Arterial Spine */}
          <path
            d="M720 720 C715 820, 690 920, 650 1020 C610 1120, 560 1200, 480 1280"
            stroke="url(#spine-conduit)"
            strokeWidth="2.0"
            strokeLinecap="round"
          />
          <path
            d="M725 720 C735 830, 765 930, 810 1030 C855 1130, 910 1210, 980 1290"
            stroke="url(#ven-lav-flow)"
            strokeWidth="2.0"
            strokeLinecap="round"
          />

          {/* Lateral branching framing Section B comparison cards */}
          {/* Left card framing (Conventional population scores) */}
          <path
            d="M650 1020 C580 1040, 510 1055, 440 1065 C370 1075, 300 1080, 230 1082"
            stroke="url(#art-cyan-flow)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M440 1065 C410 1100, 380 1140, 345 1175 C310 1210, 270 1235, 220 1250"
            stroke="url(#art-cyan-flow)"
            strokeWidth="0.9"
            strokeLinecap="round"
          />

          {/* Right card framing (CardioVision AI Protocol) */}
          <path
            d="M810 1030 C880 1050, 950 1065, 1020 1075 C1090 1085, 1160 1090, 1230 1092"
            stroke="url(#art-cyan-flow)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M1020 1075 C1055 1110, 1090 1150, 1130 1185 C1170 1220, 1210 1245, 1260 1260"
            stroke="url(#art-cyan-flow)"
            strokeWidth="1.0"
            strokeLinecap="round"
          />
        </g>

        {/* ----------------------------------------------------
            ZONE 3: TARGET ARTERIES CORONARY FRAMING (Y: 1450 -> 2250)
            Subtly framing the 4 target cards: Cath, LAD, LCX, RCA
           ---------------------------------------------------- */}
        <g
          className={`transition-all duration-1000 ${
            activeSections['target-vessels'] || reducedMotion ? 'opacity-95' : 'opacity-25'
          }`}
        >
          {/* Main coronary branching node above Target Arteries */}
          <path
            d="M720 1420 C720 1500, 715 1580, 680 1660"
            stroke="url(#spine-conduit)"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Branch 1 -> Top-Left Card: Cath (Overall CAD Outcome) */}
          <path
            d="M680 1660 C610 1680, 530 1705, 450 1735 C370 1765, 290 1800, 210 1840"
            stroke="url(#art-cyan-flow)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="210" cy="1840" r="3.5" fill="#0284c7" fillOpacity="0.6" />

          {/* Branch 2 -> Top-Right Card: LAD (Left Anterior Descending) */}
          <path
            d="M680 1660 C760 1675, 850 1695, 940 1725 C1030 1755, 1120 1790, 1210 1830"
            stroke="url(#art-cyan-flow)"
            strokeWidth="2.0"
            strokeLinecap="round"
          />
          <circle cx="1210" cy="1830" r="4" fill="#0891b2" fillOpacity="0.7" />
          {/* Diagonal branches off LAD */}
          <path
            d="M940 1725 C970 1760, 1005 1800, 1045 1835 C1085 1870, 1130 1895, 1180 1910"
            stroke="url(#art-cyan-flow)"
            strokeWidth="1.1"
            strokeLinecap="round"
          />

          {/* Branch 3 -> Bottom-Left Card: LCX (Left Circumflex Artery) */}
          <path
            d="M680 1660 C660 1760, 620 1860, 560 1950 C500 2040, 410 2110, 310 2160"
            stroke="url(#ven-lav-flow)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="310" cy="2160" r="3.5" fill="#818cf8" fillOpacity="0.6" />
          {/* Obtuse marginal branch off LCX */}
          <path
            d="M560 1950 C510 1975, 455 2005, 395 2030 C335 2055, 275 2070, 210 2078"
            stroke="url(#ven-lav-flow)"
            strokeWidth="1.1"
            strokeLinecap="round"
          />

          {/* Branch 4 -> Bottom-Right Card: RCA (Right Coronary Artery) */}
          <path
            d="M720 1680 C760 1780, 820 1875, 890 1960 C960 2045, 1050 2115, 1150 2165"
            stroke="url(#cor-rose-flow)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="1150" cy="2165" r="3.5" fill="#fb7185" fillOpacity="0.6" />
          {/* Acute marginal branch off RCA */}
          <path
            d="M890 1960 C945 1985, 1005 2010, 1070 2030 C1135 2050, 1200 2060, 1270 2065"
            stroke="url(#cor-rose-flow)"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
        </g>

        {/* ----------------------------------------------------
            ZONE 4: HOW IT WORKS CONNECTED PIPELINE (Y: 2250 -> 2950)
            Sequential pathway connecting the 4 workflow stages
           ---------------------------------------------------- */}
        <g
          className={`transition-all duration-1000 ${
            activeSections['how-it-works'] || reducedMotion ? 'opacity-90' : 'opacity-25'
          }`}
        >
          {/* Central feeder descending from Target Arteries */}
          <path
            d="M720 2220 C720 2290, 710 2360, 670 2430"
            stroke="url(#spine-conduit)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {/* Sequential 4-Stage Pathway Tracing Behind Workflow Cards */}
          {/* Stage 1 (Intake) -> Stage 2 (Provenance) */}
          <path
            d="M260 2520 C360 2490, 470 2480, 580 2510"
            stroke="#0284c7"
            strokeWidth="1.2"
            strokeDasharray="4 6"
            strokeOpacity="0.4"
          />
          {/* Stage 2 (Provenance) -> Stage 3 (Derivation) */}
          <path
            d="M580 2510 C680 2540, 790 2540, 890 2510"
            stroke="#818cf8"
            strokeWidth="1.2"
            strokeDasharray="4 6"
            strokeOpacity="0.4"
          />
          {/* Stage 3 (Derivation) -> Stage 4 (Inference) */}
          <path
            d="M890 2510 C990 2480, 1090 2490, 1190 2520"
            stroke="#0d9488"
            strokeWidth="1.2"
            strokeDasharray="4 6"
            strokeOpacity="0.4"
          />

          {/* Node milestones at each stage */}
          <circle cx="260" cy="2520" r="3" fill="#0284c7" fillOpacity="0.5" />
          <circle cx="580" cy="2510" r="3" fill="#818cf8" fillOpacity="0.5" />
          <circle cx="890" cy="2510" r="3" fill="#0891b2" fillOpacity="0.5" />
          <circle cx="1190" cy="2520" r="3" fill="#0d9488" fillOpacity="0.5" />
        </g>

        {/* ----------------------------------------------------
            ZONE 5: ARCHITECTURE & TRANSPARENCY (Y: 2950 -> 3650)
            Clean, spacious lateral arteriolar corridors
           ---------------------------------------------------- */}
        <g
          className={`transition-all duration-1000 ${
            activeSections['architecture'] || activeSections['transparency'] || reducedMotion
              ? 'opacity-85'
              : 'opacity-20'
          }`}
        >
          {/* Left lateral margin feeder */}
          <path
            d="M260 2950 C230 3060, 215 3180, 225 3300 C235 3420, 270 3530, 330 3630"
            stroke="url(#art-cyan-flow)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M225 3300 C270 3320, 315 3335, 365 3345"
            stroke="url(#art-cyan-flow)"
            strokeWidth="0.9"
            strokeLinecap="round"
          />

          {/* Right lateral margin feeder */}
          <path
            d="M1190 2950 C1220 3060, 1235 3180, 1225 3300 C1215 3420, 1180 3530, 1120 3630"
            stroke="url(#ven-lav-flow)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M1225 3300 C1180 3320, 1135 3335, 1085 3345"
            stroke="url(#ven-lav-flow)"
            strokeWidth="0.9"
            strokeLinecap="round"
          />
        </g>

        {/* ----------------------------------------------------
            ZONE 6: CLOSING CTA TERMINAL CONVERGENCE (Y: 3650 -> 4200)
            Soft vascular convergence framing the final card
           ---------------------------------------------------- */}
        <g
          className={`transition-all duration-1000 ${
            activeSections['closing-cta'] || reducedMotion ? 'opacity-90' : 'opacity-25'
          }`}
        >
          {/* Left converging branch */}
          <path
            d="M330 3630 C410 3730, 510 3810, 620 3870 C660 3890, 700 3905, 720 3915"
            stroke="url(#art-cyan-flow)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* Right converging branch */}
          <path
            d="M1120 3630 C1040 3730, 940 3810, 830 3870 C790 3890, 750 3905, 720 3915"
            stroke="url(#ven-lav-flow)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {/* Subtle terminal nexus dot */}
          <circle cx="720" cy="3915" r="4.5" fill="#0284c7" fillOpacity="0.5" />
          <circle cx="720" cy="3915" r="10" stroke="#0284c7" strokeWidth="0.8" strokeOpacity="0.3" strokeDasharray="2 3" />
        </g>
      </svg>
    </div>
  );
};
