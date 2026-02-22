// src/components/charts/ShotChart.tsx
'use client';

import { memo } from 'react';
import Image from 'next/image';

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
      <div className="w-full max-w-md mx-auto aspect-[100/94] relative">
        <Image
          src="/prueba.png"
          alt="Media cancha de baloncesto"
          layout="fill"
          objectFit="cover"
          className="rounded-lg"
        />
        <svg
          viewBox="0 0 100 94"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full absolute top-0 left-0" // SVG overlay
        >
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
