// src/components/charts/ShotChart.tsx
'use client';

import { memo } from 'react';

interface Shot {
  x: number;
  y: number;
  made: boolean;
}

interface ShotChartProps {
  shots: Shot[];
  title?: string;
}

// Re-usar las mismas dimensiones y lógica de escalado que en Court.tsx
const COURT_WIDTH_M = 15;
const COURT_HEIGHT_M = 14;
const SVG_WIDTH = 100;
const SVG_HEIGHT = (COURT_HEIGHT_M / COURT_WIDTH_M) * SVG_WIDTH;

const scale = (val: number) => (val / COURT_WIDTH_M) * SVG_WIDTH;

const THREE_POINT_RADIUS_M = 6.75;
const KEY_WIDTH_M = 4.9;
const KEY_HEIGHT_M = 5.8;
const HOOP_CENTER_Y_M = 1.575;
const RESTRICTED_AREA_RADIUS_M = 1.25;
const THREE_POINT_SIDE_M = 0.9;


const ShotChart = memo(function ShotChart({ shots, title }: ShotChartProps) {
    // Coordenadas SVG
    const hoopX = SVG_WIDTH / 2;
    const hoopY = scale(HOOP_CENTER_Y_M);
    const threePointRadius = scale(THREE_POINT_RADIUS_M);
    
    const keyWidth = scale(KEY_WIDTH_M);
    const keyHeight = scale(KEY_HEIGHT_M);
    const keyX = (SVG_WIDTH - keyWidth) / 2;

    const freeThrowLineY = scale(KEY_HEIGHT_M);
    const restrictedRadius = scale(RESTRICTED_AREA_RADIUS_M);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg">
      {title && <h3 className="text-xl font-bold mb-3 text-center text-gray-800 dark:text-gray-100">{title}</h3>}
      <div className="w-full max-w-md mx-auto aspect-[100/94]">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full bg-orange-200 dark:bg-gray-700 rounded-lg"
        >
           <g stroke="#1f2937" strokeWidth="0.5" fill="none" className="dark:stroke-gray-300">
                {/* Key */}
                <rect x={keyX} y="0" width={keyWidth} height={keyHeight} className="fill-orange-300 dark:fill-gray-600" stroke="none" />
                <line x1={keyX} y1="0" x2={keyX} y2={keyHeight} />
                <line x1={keyX + keyWidth} y1="0" x2={keyX + keyWidth} y2={keyHeight} />
                <line x1={keyX} y1={keyHeight} x2={keyX + keyWidth} y2={keyHeight} />

                {/* Free throw circle arc */}
                <path d={`M ${keyX} ${freeThrowLineY} A ${scale(1.8)} ${scale(1.8)} 0 0 1 ${keyX + keyWidth} ${freeThrowLineY}`} />

                {/* Restricted area arc */}
                <path d={`M ${hoopX - restrictedRadius} ${hoopY} A ${restrictedRadius} ${restrictedRadius} 0 0 0 ${hoopX + restrictedRadius} ${hoopY}`} />

                {/* Three point line */}
                <path d={`M ${scale(THREE_POINT_SIDE_M)} 0 L ${scale(THREE_POINT_SIDE_M)} ${hoopY - threePointRadius} A ${threePointRadius} ${threePointRadius} 0 0 1 ${SVG_WIDTH - scale(THREE_POINT_SIDE_M)} ${hoopY - threePointRadius} L ${SVG_WIDTH - scale(THREE_POINT_SIDE_M)} 0`} />

                {/* Hoop */}
                <circle cx={hoopX} cy={hoopY} r={scale(0.225)} className="fill-transparent stroke-red-500" strokeWidth="0.4" />
                {/* Backboard */}
                <line x1={hoopX - scale(0.9)} y1={scale(1.2)} x2={hoopX + scale(0.9)} y2={scale(1.2)} strokeWidth="0.5" />
            </g>

          {/* Render shots */}
          {shots.map((shot, index) => (
            <circle
              key={index}
              cx={shot.x}
              cy={shot.y}
              r="1.2"
              fill={shot.made ? '#4ade80' : '#f87171'} // green-400 for make, red-400 for miss
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
