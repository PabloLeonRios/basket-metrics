// src/components/tracker/Court.tsx
'use client';

import { memo } from 'react';

interface CourtProps {
  onClick: (x: number, y: number) => void;
  shotCoordinates?: { x: number; y: number } | null; // Coordenadas del tiro pendiente
}

// Dimensiones FIBA (en metros)
const COURT_WIDTH_M = 15;
const COURT_HEIGHT_M = 14; // Media cancha
const THREE_POINT_RADIUS_M = 6.75;
const THREE_POINT_SIDE_M = 0.9;
const FREE_THROW_LINE_M = 4.6;
const KEY_WIDTH_M = 4.9;
const KEY_HEIGHT_M = 5.8;
const HOOP_CENTER_X_M = COURT_WIDTH_M / 2;
const HOOP_CENTER_Y_M = 1.575;
const RESTRICTED_AREA_RADIUS_M = 1.25;

// El viewBox define el sistema de coordenadas. Usamos 100x94 para mantener el aspect ratio.
// El ancho es 100, la altura se calcula para mantener la proporción de la media cancha (15x14)
const SVG_WIDTH = 100;
const SVG_HEIGHT = (COURT_HEIGHT_M / COURT_WIDTH_M) * SVG_WIDTH; // 93.33, redondeado a 94

// Mapeo de metros a unidades SVG
const scale = (val: number) => (val / COURT_WIDTH_M) * SVG_WIDTH;

const Court = memo(function Court({ onClick, shotCoordinates }: CourtProps) {
  const handleCourtClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const { x, y } = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    onClick(x, y);
  };

  // Coordenadas SVG
  const hoopX = SVG_WIDTH / 2;
  const hoopY = scale(HOOP_CENTER_Y_M);
  const threePointRadius = scale(THREE_POINT_RADIUS_M);
  const threePointY = hoopY; 
  const threePointSideXStart = scale((COURT_WIDTH_M - (KEY_WIDTH_M + 2 * THREE_POINT_SIDE_M)) / 2);
  const threePointSideXEnd = SVG_WIDTH - threePointSideXStart;

  const keyWidth = scale(KEY_WIDTH_M);
  const keyHeight = scale(KEY_HEIGHT_M);
  const keyX = (SVG_WIDTH - keyWidth) / 2;

  const freeThrowLineY = scale(KEY_HEIGHT_M);

  const restrictedRadius = scale(RESTRICTED_AREA_RADIUS_M);


  return (
    <div className="w-full max-w-lg mx-auto aspect-[100/94] touch-none">
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        xmlns="http://www.w3.org/2000/svg"
        onClick={handleCourtClick}
        className="w-full h-full bg-orange-200 dark:bg-gray-700 rounded-lg shadow-md"
      >
        <g stroke="#1f2937" strokeWidth="0.5" fill="none" className="dark:stroke-gray-300">
          {/* Líneas de la zona (Key) */}
          <rect
            x={keyX}
            y="0"
            width={keyWidth}
            height={keyHeight}
            className="fill-orange-300 dark:fill-gray-600"
            stroke="none"
          />
          <line x1={keyX} y1="0" x2={keyX} y2={keyHeight} />
          <line x1={keyX + keyWidth} y1="0" x2={keyX + keyWidth} y2={keyHeight} />
          <line x1={keyX} y1={keyHeight} x2={keyX + keyWidth} y2={keyHeight} />

          {/* Círculo de tiro libre (solo el arco superior) */}
          <path
            d={`M ${keyX} ${freeThrowLineY} A ${scale(1.8)} ${scale(1.8)} 0 0 1 ${keyX + keyWidth} ${freeThrowLineY}`}
            strokeDasharray="2,1"
          />
           <path
            d={`M ${keyX} ${freeThrowLineY} A ${scale(1.8)} ${scale(1.8)} 0 0 0 ${keyX + keyWidth} ${freeThrowLineY}`}
            
          />

          {/* Arco de la zona restringida debajo del aro */}
          <path
            d={`M ${hoopX - restrictedRadius} ${hoopY} A ${restrictedRadius} ${restrictedRadius} 0 0 0 ${hoopX + restrictedRadius} ${hoopY}`}
            
          />

          {/* Línea de 3 puntos */}
          <path
            d={`M ${scale(THREE_POINT_SIDE_M)} 0 L ${scale(THREE_POINT_SIDE_M)} ${hoopY - threePointRadius} 
               A ${threePointRadius} ${threePointRadius} 0 0 1 ${SVG_WIDTH - scale(THREE_POINT_SIDE_M)} ${hoopY - threePointRadius}
               L ${SVG_WIDTH - scale(THREE_POINT_SIDE_M)} 0
              `}
          />

           {/* Aro */}
          <circle cx={hoopX} cy={hoopY} r={scale(0.225)} className="fill-transparent stroke-red-500" strokeWidth="0.4"/>
          {/* Tablero */}
          <line x1={hoopX - scale(0.9)} y1={scale(1.2)} x2={hoopX + scale(0.9)} y2={scale(1.2)} strokeWidth="0.5"/>
        
        </g>
        
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
