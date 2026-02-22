// src/components/ui/JerseyIcon.tsx
import React from 'react';

interface JerseyIconProps {
  number?: number | string;
  className?: string;
}

const JerseyIcon: React.FC<JerseyIconProps> = ({ number, className }) => {
  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Improved Jersey Body */}
        <path
          d="M15 25 L30 35 L30 75 Q50 85 70 75 L70 35 L85 25 L75 10 L25 10 Z"
          className="fill-current text-gray-200 dark:text-gray-700"
          stroke="#9CA3AF"
          strokeWidth="2"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-gray-600 dark:text-gray-300">
          {number || '?'}
        </span>
      </div>
    </div>
  );
};

export default JerseyIcon;
