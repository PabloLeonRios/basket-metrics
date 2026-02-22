// src/components/tracker/Court.tsx
'use client';

import { memo } from 'react';
import Image from 'next/image';

interface CourtProps {
  onClick: (x: number, y: number) => void;
  shotCoordinates?: { x: number; y: number } | null; // Coordenadas del tiro pendiente
}

// El viewBox define el sistema de coordenadas (0,0) en la esquina superior izquierda.
const Court = memo(function Court({ onClick, shotCoordinates }: CourtProps) {
  const handleCourtClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const { x, y } = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    onClick(x, y);
  };

  return (
    <div className="w-full max-w-lg mx-auto aspect-[100/94] touch-none relative">
      <Image
        src="/prueba.png"
        alt="Media cancha de baloncesto"
        layout="fill"
        objectFit="cover"
        className="rounded-lg shadow-md"
        priority
      />
      <svg
        viewBox="0 0 100 94"
        xmlns="http://www.w3.org/2000/svg"
        onClick={handleCourtClick}
        className="w-full h-full absolute top-0 left-0" // SVG overlay
      >
        {/* Marcador de Tiro Pendiente */}
        {shotCoordinates && (
          <circle
            cx={shotCoordinates.x}
            cy={shotCoordinates.y}
            r="1.5"
            fill="red"
            stroke="white"
            strokeWidth="0.5"
          />
        )}
      </svg>
    </div>
  );
});

export default Court;
