import React, { useEffect, useRef } from 'react';
import { animate } from 'animejs';

interface AnimatedEcgLineProps {
  className?: string;
  reducedMotion?: boolean;
}

export const AnimatedEcgLine: React.FC<AnimatedEcgLineProps> = ({
  className = '',
  reducedMotion = false,
}) => {
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (reducedMotion || !pathRef.current) return;

    const path = pathRef.current;
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;

    // Hardware-accelerated SVG stroke trace with Anime.js
    const animation = animate(path, {
      strokeDashoffset: [length, 0],
      duration: 2200,
      ease: 'inOutSine',
      loop: true,
      delay: 200,
    });

    return () => {
      animation.revert();
    };
  }, [reducedMotion]);

  return (
    <div className={`relative flex items-center ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 280 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible"
      >
        {/* Baseline faint track */}
        <path
          d="M0 24H60L68 18L76 28L84 6L92 40L100 24L110 24L118 20L126 24H280"
          stroke="rgba(148, 163, 184, 0.3)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Crisp foreground animated waveform */}
        <path
          ref={pathRef}
          d="M0 24H60L68 18L76 28L84 6L92 40L100 24L110 24L118 20L126 24H280"
          stroke="#0284c7"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ willChange: 'stroke-dashoffset' }}
        />
      </svg>
    </div>
  );
};
