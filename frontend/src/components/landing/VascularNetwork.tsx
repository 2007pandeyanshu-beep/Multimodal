import React from 'react';

interface VascularNetworkProps {
  className?: string;
}

export const VascularNetwork: React.FC<VascularNetworkProps> = ({ className = '' }) => {
  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden select-none z-0 ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1200 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-cover opacity-90"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Radial mask: strongest detail near center heart, gently fading outward */}
          <radialGradient
            id="vascular-center-fade"
            cx="50%"
            cy="46%"
            r="48%"
            fx="50%"
            fy="46%"
          >
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="35%" stopColor="#ffffff" stopOpacity="0.75" />
            <stop offset="70%" stopColor="#ffffff" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
          </radialGradient>

          <mask id="vascular-vignette">
            <rect width="1200" height="800" fill="url(#vascular-center-fade)" />
          </mask>

          {/* Gradients for arterial and venous branch tracks */}
          <linearGradient id="art-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0891b2" stopOpacity="0.12" />
          </linearGradient>

          <linearGradient id="ven-lavender" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.10" />
          </linearGradient>

          <linearGradient id="cor-coral" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fb7185" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#fda4af" stopOpacity="0.08" />
          </linearGradient>
        </defs>

        <g mask="url(#vascular-vignette)">
          {/* Subtle Concentric Diagnostic Reference Arcs (Caliper framing) */}
          <circle
            cx="600"
            cy="370"
            r="230"
            stroke="#0284c7"
            strokeWidth="0.8"
            strokeDasharray="3 9"
            strokeOpacity="0.2"
          />
          <circle
            cx="600"
            cy="370"
            r="320"
            stroke="#818cf8"
            strokeWidth="0.8"
            strokeDasharray="4 12"
            strokeOpacity="0.15"
          />

          {/* LEFT VASCULAR ARTERIAL TREE (Systemic / Coronary Left Territory) */}
          {/* Main Left Anterior Descending (LAD) trunk simulation */}
          <path
            d="M585 300 C560 340, 535 390, 520 450 C505 510, 480 570, 445 620"
            stroke="url(#art-cyan)"
            strokeWidth="2.0"
            strokeLinecap="round"
          />
          {/* Diagonal Branch D1 */}
          <path
            d="M555 350 C530 365, 495 380, 460 395 C435 405, 410 410, 380 412"
            stroke="url(#art-cyan)"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          {/* D1 terminal arterioles */}
          <path
            d="M495 380 C480 400, 465 425, 445 440"
            stroke="url(#art-cyan)"
            strokeWidth="1.0"
            strokeLinecap="round"
            strokeDasharray="2 2"
          />
          <path
            d="M460 395 C440 385, 415 380, 390 378"
            stroke="url(#art-cyan)"
            strokeWidth="0.9"
            strokeLinecap="round"
          />

          {/* Diagonal Branch D2 */}
          <path
            d="M532 410 C505 440, 470 470, 430 495 C395 515, 360 525, 320 530"
            stroke="url(#art-cyan)"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          <path
            d="M470 470 C450 495, 425 520, 395 540"
            stroke="url(#art-cyan)"
            strokeWidth="0.9"
            strokeLinecap="round"
          />

          {/* Septal Perforators branching inward */}
          <path
            d="M545 375 C555 390, 560 410, 565 435"
            stroke="url(#art-cyan)"
            strokeWidth="1.0"
            strokeLinecap="round"
          />
          <path
            d="M523 440 C535 460, 545 480, 550 505"
            stroke="url(#art-cyan)"
            strokeWidth="0.9"
            strokeLinecap="round"
          />

          {/* Left Circumflex (LCX) Posterior & Lateral Branching */}
          <path
            d="M590 285 C550 280, 500 290, 460 310 C410 335, 365 370, 330 415 C295 460, 275 515, 260 575"
            stroke="url(#ven-lavender)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* Obtuse Marginal (OM1) */}
          <path
            d="M460 310 C430 325, 395 345, 365 365 C335 385, 305 405, 275 420"
            stroke="url(#ven-lavender)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          {/* Obtuse Marginal (OM2) */}
          <path
            d="M365 370 C340 400, 310 435, 275 465 C245 490, 215 510, 180 520"
            stroke="url(#ven-lavender)"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          <path
            d="M330 415 C305 440, 280 470, 250 495"
            stroke="url(#ven-lavender)"
            strokeWidth="0.9"
            strokeLinecap="round"
          />

          {/* Aortic Arch Upper Trunks (Brachiocephalic / Carotid) */}
          <path
            d="M590 230 C585 180, 570 140, 550 100 C535 70, 515 45, 490 20"
            stroke="url(#art-cyan)"
            strokeWidth="2.0"
            strokeLinecap="round"
          />
          <path
            d="M570 140 C550 120, 520 100, 485 85 C450 70, 410 60, 370 55"
            stroke="url(#art-cyan)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M550 100 C530 80, 505 65, 475 50"
            stroke="url(#art-cyan)"
            strokeWidth="0.9"
            strokeLinecap="round"
          />

          {/* RIGHT VASCULAR ARTERIAL & VENOUS TREE (RCA / Vena Cava Territory) */}
          {/* Main Right Coronary Artery (RCA) sulcus track */}
          <path
            d="M625 295 C660 325, 690 365, 710 415 C730 465, 745 520, 750 580 C755 630, 750 680, 735 730"
            stroke="url(#ven-lavender)"
            strokeWidth="2.0"
            strokeLinecap="round"
          />
          {/* Acute Marginal Branch */}
          <path
            d="M690 365 C725 375, 765 385, 805 395 C845 405, 885 412, 925 415"
            stroke="url(#ven-lavender)"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          <path
            d="M765 385 C795 405, 825 425, 850 445 C875 465, 895 485, 915 505"
            stroke="url(#ven-lavender)"
            strokeWidth="0.9"
            strokeLinecap="round"
          />

          {/* Posterior Descending Artery (PDA) extension */}
          <path
            d="M710 415 C740 445, 775 480, 810 515 C845 550, 880 580, 920 605"
            stroke="url(#ven-lavender)"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          <path
            d="M775 480 C800 510, 830 535, 860 555"
            stroke="url(#ven-lavender)"
            strokeWidth="0.9"
            strokeLinecap="round"
          />

          {/* Right Upper Aorta / Pulmonary Trunk Branches */}
          <path
            d="M615 225 C635 180, 665 140, 705 105 C745 70, 790 45, 840 25"
            stroke="url(#art-cyan)"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
          <path
            d="M665 140 C705 125, 750 110, 795 100 C840 90, 885 85, 930 82"
            stroke="url(#art-cyan)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M705 105 C740 88, 780 72, 820 60"
            stroke="url(#art-cyan)"
            strokeWidth="0.9"
            strokeLinecap="round"
          />

          {/* Delicate Micro-Capillary Coral Filaments (Tissue Perfusion Accents) */}
          <path
            d="M510 480 C485 500, 455 520, 420 535 C385 550, 350 560, 310 565"
            stroke="url(#cor-coral)"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeDasharray="1 3"
          />
          <path
            d="M720 480 C750 500, 785 520, 825 535 C865 550, 905 560, 950 565"
            stroke="url(#cor-coral)"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeDasharray="1 3"
          />

          {/* Subtle Anatomical Axis Grid Ticks (Caliper Crosshairs) */}
          <path d="M600 120 L600 135" stroke="#0284c7" strokeWidth="1" strokeOpacity="0.3" />
          <path d="M592 127 L608 127" stroke="#0284c7" strokeWidth="1" strokeOpacity="0.3" />
          <path d="M600 610 L600 625" stroke="#0284c7" strokeWidth="1" strokeOpacity="0.3" />
          <path d="M592 617 L608 617" stroke="#0284c7" strokeWidth="1" strokeOpacity="0.3" />
          <path d="M350 370 L365 370" stroke="#0284c7" strokeWidth="1" strokeOpacity="0.3" />
          <path d="M357 362 L357 378" stroke="#0284c7" strokeWidth="1" strokeOpacity="0.3" />
          <path d="M835 370 L850 370" stroke="#0284c7" strokeWidth="1" strokeOpacity="0.3" />
          <path d="M842 362 L842 378" stroke="#0284c7" strokeWidth="1" strokeOpacity="0.3" />
        </g>
      </svg>
    </div>
  );
};
