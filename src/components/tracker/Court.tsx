// src/components/tracker/Court.tsx
'use client';

import { memo } from 'react';
import {
  SVG_WIDTH, SVG_HEIGHT, scale, hoopX_svg, hoopY_svg,
  threePointRadius_svg, threePointSideLineXLeft_svg, threePointSideLineXRight_svg, threePointArcStartY_svg,
  KEY_WIDTH_M, KEY_HEIGHT_M, BACKBOARD_WIDTH_M, BACKBOARD_Y_M, HOOP_RADIUS_M,
  FREE_THROW_CIRCLE_RADIUS_M, NO_CHARGE_SEMI_CIRCLE_RADIUS_M
} from '@/lib/court-geometry';

interface CourtProps {
  onClick: (x: number, y: number) => void;
  shotCoordinates?: { x: number; y: number } | null;
}

const Court = memo(function Court({ onClick, shotCoordinates }: CourtProps) {
  const handleCourtClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const { x, y } = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    onClick(x, y);
  };

  const keyWidth_svg = scale(KEY_WIDTH_M);
  const keyHeight_svg = scale(KEY_HEIGHT_M);
  const keyX_svg = (SVG_WIDTH - keyWidth_svg) / 2;
  const backboardWidth_svg = scale(BACKBOARD_WIDTH_M);
  const backboardY_svg = scale(BACKBOARD_Y_M);
  const hoopRadius_svg = scale(HOOP_RADIUS_M);
  const freeThrowCircleRadius_svg = scale(FREE_THROW_CIRCLE_RADIUS_M);
  const noChargeRadius_svg = scale(NO_CHARGE_SEMI_CIRCLE_RADIUS_M);
  
  const threePointLinePath = `
    M ${threePointSideLineXLeft_svg},0
    L ${threePointSideLineXLeft_svg},${threePointArcStartY_svg}
    A ${threePointRadius_svg},${threePointRadius_svg} 0 0 1 ${threePointSideLineXRight_svg},${threePointArcStartY_svg}
    L ${threePointSideLineXRight_svg},0
  `;

  return (
    <div className="w-full max-w-lg mx-auto aspect-[100/94] touch-none">
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        xmlns="http://www.w3.org/2000/svg"
        onClick={handleCourtClick}
        className="w-full h-full bg-amber-600 dark:bg-amber-800 rounded-lg shadow-md"
      >
        <g stroke="#6E4C2A" strokeWidth="0.4" fill="none" className="dark:stroke-gray-300/70">
          <rect
            x={keyX_svg}
            y="0"
            width={keyWidth_svg}
            height={keyHeight_svg}
            className="fill-amber-700/40 dark:fill-amber-900/40"
            stroke="#6E4C2A"
          />
          <path d={threePointLinePath} strokeWidth="0.6" />
          <path d={`M ${keyX_svg} ${keyHeight_svg} A ${freeThrowCircleRadius_svg} ${freeThrowCircleRadius_svg} 0 0 1 ${keyX_svg + keyWidth_svg} ${keyHeight_svg}`} />
          <path d={`M ${keyX_svg} ${keyHeight_svg} A ${freeThrowCircleRadius_svg} ${freeThrowCircleRadius_svg} 0 0 0 ${keyX_svg + keyWidth_svg} ${keyHeight_svg}`} strokeDasharray="0.4,0.4" />
          <path d={`M ${hoopX_svg - noChargeRadius_svg} ${hoopY_svg} A ${noChargeRadius_svg} ${noChargeRadius_svg} 0 0 0 ${hoopX_svg + noChargeRadius_svg} ${hoopY_svg}`} />
          <line
            x1={hoopX_svg - backboardWidth_svg / 2}
            y1={backboardY_svg}
            x2={hoopX_svg + backboardWidth_svg / 2}
            y2={backboardY_svg}
            strokeWidth="0.5"
            className="dark:stroke-gray-300"
          />
          <circle
            cx={hoopX_svg}
            cy={hoopY_svg}
            r={hoopRadius_svg}
            stroke="#E53935"
            strokeWidth="0.4"
            className="fill-transparent"
          />
        </g>
        {shotCoordinates && (
          <circle cx={shotCoordinates.x} cy={shotCoordinates.y} r="1.5" fill="red" stroke="white" strokeWidth="0.5" />
        )}
      </svg>
    </div>
  );
});

export default Court;
