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
        {/* Jersey Body */}
        <path
          d="M20,30 Q25,25 30,30 L30,70 Q50,80 70,70 L70,30 Q75,25 80,30 L90,20 L60,10 L40,10 L10,20 Z"
          className="fill-current text-gray-200 dark:text-gray-700"
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
