// src/components/tracker/Court.tsx
'use client';
import { memo } from 'react';

interface CourtProps {
  onClick: (x: number, y: number) => void;
}

// Un componente simple que renderiza una media cancha de baloncesto SVG.
// El viewBox define el sistema de coordenadas (0,0) en la esquina superior izquierda.
const Court = memo(function Court({ onClick }: CourtProps) {
  const handleCourtClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const { x, y } = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    onClick(x, y);
  };

  return (
    <div className="w-full max-w-lg mx-auto aspect-[100/94] touch-none">
      <svg
        viewBox="0 0 100 94"
        xmlns="http://www.w3.org/2000/svg"
        onClick={handleCourtClick}
        className="w-full h-full bg-orange-200 dark:bg-orange-800 rounded-lg shadow-md"
      >
        {/* Key (La pintura) */}
        <rect
          x="31"
          y="47"
          width="38"
          height="38"
          fill="none"
          stroke="black"
          strokeWidth="0.5"
        />
        {/* Restricted Area Arc */}
        <circle
          cx="50"
          cy="47"
          r="8"
          fill="none"
          stroke="black"
          strokeWidth="0.5"
          strokeDasharray="2,1.5"
        />

        {/* Three-point line */}
        <path
          d="M6 47 A 44 44 0 0 1 94 47"
          fill="none"
          stroke="black"
          strokeWidth="0.5"
        />
        <line
          x1="6"
          y1="47"
          x2="6"
          y2="85.25"
          stroke="black"
          strokeWidth="0.5"
        />
        <line
          x1="94"
          y1="47"
          x2="94"
          y2="85.25"
          stroke="black"
          strokeWidth="0.5"
        />

        {/* Hoop and backboard */}
        <rect
          x="44"
          y="41"
          width="12"
          height="0.5"
          fill="none"
          stroke="black"
          strokeWidth="0.5"
        />
        <circle
          cx="50"
          cy="47"
          r="3"
          fill="none"
          stroke="black"
          strokeWidth="0.5"
        />
      </svg>
    </div>
  );
});

export default Court;
