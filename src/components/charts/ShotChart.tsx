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

const ShotChart = memo(function ShotChart({ shots, title }: ShotChartProps) {
  return (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-md">
      {title && <h3 className="text-lg font-bold mb-2 text-center">{title}</h3>}
      <div className="w-full max-w-md mx-auto aspect-[100/94]">
        <svg
          viewBox="0 0 100 94"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full bg-orange-200 dark:bg-orange-800 rounded-lg"
        >
          {/* Court lines */}
          <rect x="31" y="47" width="38" height="38" fill="none" stroke="black" strokeWidth="0.5" />
          <circle cx="50" cy="47" r="8" fill="none" stroke="black" strokeWidth="0.5" strokeDasharray="2,1.5" />
          <path d="M6 47 A 44 44 0 0 1 94 47" fill="none" stroke="black" strokeWidth="0.5" />
          <line x1="6" y1="47" x2="6" y2="85.25" stroke="black" strokeWidth="0.5" />
          <line x1="94" y1="47" x2="94" y2="85.25" stroke="black" strokeWidth="0.5" />
          <rect x="44" y="41" width="12" height="0.5" fill="none" stroke="black" strokeWidth="0.5" />
          <circle cx="50" cy="47" r="3" fill="none" stroke="black" strokeWidth="0.5" />

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
            />
          ))}
        </svg>
      </div>
      <div className="flex justify-center items-center gap-4 mt-2 text-sm">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-400"></div>
          <span>Anotado</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-400"></div>
          <span>Fallado</span>
        </div>
      </div>
    </div>
  );
});

export default ShotChart;
