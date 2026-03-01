// src/components/charts/ShotChart.tsx
'use client';

import { memo } from 'react';
import {
  SVG_WIDTH, SVG_HEIGHT, scale, hoopX_svg, hoopY_svg,
  threePointRadius_svg, threePointSideLineXLeft_svg, threePointSideLineXRight_svg, threePointArcStartY_svg,
  KEY_WIDTH_M, KEY_HEIGHT_M, BACKBOARD_WIDTH_M, BACKBOARD_Y_M, HOOP_RADIUS_M,
  FREE_THROW_CIRCLE_RADIUS_M, NO_CHARGE_SEMI_CIRCLE_RADIUS_M
} from '@/lib/court-geometry';

interface Shot {
  x: number;
  y: number;
  made: boolean;
}

interface ShotChartProps {
  shots: Shot[];
  title?: string;
}

const ShotChart = memo(function ShotChart({ shots, title }: ShotChartProps) {
  const keyWidth_svg = scale(KEY_WIDTH_M);
  const keyHeight_svg = scale(KEY_HEIGHT_M);
  const keyX_svg = (SVG_WIDTH - keyWidth_svg) / 2;
  const backboardWidth_svg = scale(BACKBOARD_WIDTH_M);
  const backboardY_svg = scale(BACKBOARD_Y_M);
  const hoopRadius_svg = scale(HOOP_RADIUS_M);
  const freeThrowCircleRadius_svg = scale(FREE_THROW_CIRCLE_RADIUS_M);
  const noChargeRadius_svg = scale(NO_CHARGE_SEMI_CIRCLE_RADIUS_M);

  const threePointLinePath = `
    M ${threePointSideLineXRight_svg},0
    L ${threePointSideLineXRight_svg},${threePointArcStartY_svg}
    A ${threePointRadius_svg},${threePointRadius_svg} 0 0 1 ${threePointSideLineXLeft_svg},${threePointArcStartY_svg}
    L ${threePointSideLineXLeft_svg},0
    Z
  `;

  return (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-lg">
      {title && <h3 className="text-xl font-bold mb-3 text-center text-gray-800 dark:text-gray-100">{title}</h3>}
      <div className="w-full max-w-lg mx-auto aspect-[100/94] touch-none relative overflow-hidden rounded-lg shadow-2xl border-4 border-gray-800 dark:border-gray-900">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          style={{ backgroundColor: '#D4A373' }}
        >
          <defs>
            {/* Wood texture pattern */}
            <pattern id="wood-pattern" patternUnits="userSpaceOnUse" width="10" height="40" patternTransform="rotate(0)">
              {/* Base plank */}
              <rect width="10" height="40" fill="#CD9B66" />
              {/* Alternate plank shade */}
              <rect width="5" height="40" fill="#D4A373" />
              <rect x="0" y="10" width="10" height="1" fill="rgba(0,0,0,0.05)" />
              <rect x="5" y="30" width="5" height="1" fill="rgba(0,0,0,0.05)" />
              <line x1="5" y1="0" x2="5" y2="40" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />
            </pattern>

            {/* Subtle lighting gradient */}
            <radialGradient id="lighting" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="white" stopOpacity="0.25" />
              <stop offset="100%" stopColor="black" stopOpacity="0.15" />
            </radialGradient>
          </defs>

          {/* Base wood floor */}
          <rect width="100%" height="100%" fill="url(#wood-pattern)" />
          {/* Stadium lighting overlay */}
          <rect width="100%" height="100%" fill="url(#lighting)" pointerEvents="none" />

          <g stroke="#FFFFFF" strokeWidth="0.4" fill="none" className="opacity-90">
            {/* 2-Point Zone Fill (inside the 3-point line) */}
            <path d={threePointLinePath} fill="#FFFFFF" fillOpacity="0.1" strokeWidth="1.5" />

            {/* Paint area (Key) */}
            <rect
              x={keyX_svg}
              y="0"
              width={keyWidth_svg}
              height={keyHeight_svg}
              fill="#1D4ED8"
              fillOpacity="0.8"
              strokeWidth="0.8"
            />

            {/* Free throw circle (top half solid) */}
            <path d={`M ${keyX_svg} ${keyHeight_svg} A ${freeThrowCircleRadius_svg} ${freeThrowCircleRadius_svg} 0 0 1 ${keyX_svg + keyWidth_svg} ${keyHeight_svg}`} />

            {/* Free throw circle (bottom half dashed) */}
            <path d={`M ${keyX_svg} ${keyHeight_svg} A ${freeThrowCircleRadius_svg} ${freeThrowCircleRadius_svg} 0 0 0 ${keyX_svg + keyWidth_svg} ${keyHeight_svg}`} strokeDasharray="1.5,1.5" />

            {/* Restricted area (no charge semi-circle) */}
            <path d={`M ${hoopX_svg - noChargeRadius_svg} ${hoopY_svg} A ${noChargeRadius_svg} ${noChargeRadius_svg} 0 0 0 ${hoopX_svg + noChargeRadius_svg} ${hoopY_svg}`} />

            {/* Post marks along the key */}
            <line x1={keyX_svg - 0.5} y1={keyHeight_svg * 0.4} x2={keyX_svg} y2={keyHeight_svg * 0.4} strokeWidth="0.6" />
            <line x1={keyX_svg + keyWidth_svg} y1={keyHeight_svg * 0.4} x2={keyX_svg + keyWidth_svg + 0.5} y2={keyHeight_svg * 0.4} strokeWidth="0.6" />
            <line x1={keyX_svg - 0.5} y1={keyHeight_svg * 0.6} x2={keyX_svg} y2={keyHeight_svg * 0.6} strokeWidth="0.6" />
            <line x1={keyX_svg + keyWidth_svg} y1={keyHeight_svg * 0.6} x2={keyX_svg + keyWidth_svg + 0.5} y2={keyHeight_svg * 0.6} strokeWidth="0.6" />

            {/* Backboard Support */}
            <rect
              x={hoopX_svg - 0.5}
              y={0}
              width="1"
              height={backboardY_svg}
              fill="#888"
              stroke="none"
            />

            {/* Backboard */}
            <line
              x1={hoopX_svg - backboardWidth_svg / 2}
              y1={backboardY_svg}
              x2={hoopX_svg + backboardWidth_svg / 2}
              y2={backboardY_svg}
              strokeWidth="0.8"
              stroke="#FFF"
            />
            {/* Backboard inner square */}
            <rect
              x={hoopX_svg - backboardWidth_svg / 6}
              y={backboardY_svg - 0.5}
              width={backboardWidth_svg / 3}
              height="1"
              stroke="#FFF"
              strokeWidth="0.2"
              fill="none"
            />

            {/* Hoop / Rim */}
            <circle
              cx={hoopX_svg}
              cy={hoopY_svg}
              r={hoopRadius_svg}
              stroke="#FF5722"
              strokeWidth="0.6"
              fill="none"
            />
            {/* Net suggestion */}
            <path
              d={`M ${hoopX_svg - hoopRadius_svg + 0.2} ${hoopY_svg} L ${hoopX_svg - hoopRadius_svg / 2} ${hoopY_svg + 1.5} L ${hoopX_svg + hoopRadius_svg / 2} ${hoopY_svg + 1.5} L ${hoopX_svg + hoopRadius_svg - 0.2} ${hoopY_svg}`}
              stroke="#FFF"
              strokeWidth="0.2"
              strokeDasharray="0.5, 0.5"
              fill="none"
            />
          </g>

          {shots.map((shot, index) => (
            <circle
              key={index}
              cx={shot.x}
              cy={shot.y}
              r="1.2"
              fill={shot.made ? '#16A34A' : '#EF4444'}
              stroke="white"
              strokeWidth="0.2"
              opacity="0.9"
            />
          ))}
        </svg>
      </div>
      <div className="flex justify-center items-center gap-6 mt-4 text-sm text-gray-700 dark:text-gray-300">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-600 border border-gray-300 dark:border-gray-600"></div>
          <span>Anotado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500 border border-gray-300 dark:border-gray-600"></div>
          <span>Fallado</span>
        </div>
      </div>
    </div>
  );
});

export default ShotChart;
