// src/components/charts/ShotChart.tsx
'use client';

import { memo } from 'react';
import {
  SVG_WIDTH,
  SVG_HEIGHT,
  scale,
  hoopX_svg,
  hoopY_svg,
  threePointRadius_svg,
  threePointSideLineXLeft_svg,
  threePointSideLineXRight_svg,
  threePointArcStartY_svg,
  KEY_WIDTH_M,
  KEY_HEIGHT_M,
  BACKBOARD_WIDTH_M,
  BACKBOARD_Y_M,
  HOOP_RADIUS_M,
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
  // Derived coordinates for drawing from the geometry library
  const keyWidth_svg = scale(KEY_WIDTH_M);
  const keyHeight_svg = scale(KEY_HEIGHT_M);
  const keyX_svg = (SVG_WIDTH - keyWidth_svg) / 2;
  const backboardWidth_svg = scale(BACKBOARD_WIDTH_M);
  const backboardY_svg = scale(BACKBOARD_Y_M);
  const hoopRadius_svg = scale(HOOP_RADIUS_M);
  
  // Path for the 3-point line
  const threePointLinePath = `
    M ${threePointSideLineXLeft_svg},0
    L ${threePointSideLineXLeft_svg},${threePointArcStartY_svg}
    A ${threePointRadius_svg},${threePointRadius_svg} 0 0 1 ${threePointSideLineXRight_svg},${threePointArcStartY_svg}
    L ${threePointSideLineXRight_svg},0
  `;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg">
      {title && <h3 className="text-xl font-bold mb-3 text-center text-gray-800 dark:text-gray-100">{title}</h3>}
      <div className="w-full max-w-md mx-auto aspect-[100/94]">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full bg-amber-600 dark:bg-amber-800 rounded-lg"
        >
          {/* Court markings */}
          <g stroke="#1f2937" strokeWidth="0.3" fill="none" className="dark:stroke-gray-400">
            <rect
              x={keyX_svg}
              y="0"
              width={keyWidth_svg}
              height={keyHeight_svg}
              className="fill-amber-700/80 dark:fill-amber-900/80"
              stroke="none"
            />
            <line x1={keyX_svg} y1="0" x2={keyX_svg} y2={keyHeight_svg} />
            <line x1={keyX_svg + keyWidth_svg} y1="0" x2={keyX_svg + keyWidth_svg} y2={keyHeight_svg} />
            <line x1={keyX_svg} y1={keyHeight_svg} x2={keyX_svg + keyWidth_svg} y2={keyHeight_svg} />
            <path d={threePointLinePath} />
            {/* Free-throw circle arc */}
            <path d={`M ${keyX_svg} ${keyHeight_svg} A ${scale(1.8)} ${scale(1.8)} 0 0 1 ${keyX_svg + keyWidth_svg} ${keyHeight_svg}`} />
            <line
              x1={hoopX_svg - backboardWidth_svg / 2}
              y1={backboardY_svg}
              x2={hoopX_svg + backboardWidth_svg / 2}
              y2={backboardY_svg}
              strokeWidth="0.5"
              className="stroke-gray-600 dark:stroke-gray-400"
            />
            <circle
              cx={hoopX_svg}
              cy={hoopY_svg}
              r={hoopRadius_svg}
              className="fill-transparent stroke-red-500"
              strokeWidth="0.4"
            />
          </g>

          {/* Render shots */}
          {shots.map((shot, index) => (
            <circle
              key={index}
              cx={shot.x}
              cy={shot.y}
              r="1.2"
              fill={shot.made ? '#4ade80' : '#f87171'}
              stroke="white"
              strokeWidth="0.3"
              opacity="0.9"
            />
          ))}
        </svg>
      </div>
      <div className="flex justify-center items-center gap-6 mt-4 text-sm text-gray-700 dark:text-gray-300">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-400 border border-gray-300 dark:border-gray-600"></div>
          <span>Anotado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-400 border border-gray-300 dark:border-gray-600"></div>
          <span>Fallado</span>
        </div>
      </div>
    </div>
  );
});

export default ShotChart;
