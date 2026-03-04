'use client';

/**
 * ============================
 *  NOTAS PARA PABLITO (Mongo)
 * ============================
 * Este componente es 100% UI.
 * No depende de Mongo. Se puede mantener igual en DEMO y PROD.
 *
 * Si en backend se agregan "teamColor" o "isRival",
 * se puede extender con props (variant) sin tocar la lógica.
 */

import React from 'react';

type JerseyVariant = 'default' | 'mine' | 'rival' | 'inactive';

export default function JerseyIcon({
  number,
  className = '',
  variant = 'default',
}: {
  number?: number | string;
  className?: string;
  variant?: JerseyVariant;
}) {
  const num = number ?? '';

  // Paleta suave (no “a los gritos”), combinando con tu naranja del UI
  const palette = (() => {
    switch (variant) {
      case 'mine':
        return {
          stroke: '#F97316', // orange-500
          fillTop: '#F8FAFC', // slate-50
          fillBody: '#F1F5F9', // slate-100
          shadow: 'rgba(249,115,22,0.18)',
          text: '#0F172A', // slate-900
          plate: '#FFFFFF',
          plateStroke: '#E2E8F0', // slate-200
        };
      case 'rival':
        return {
          stroke: '#EF4444', // red-500
          fillTop: '#FEF2F2', // red-50
          fillBody: '#FEE2E2', // red-100
          shadow: 'rgba(239,68,68,0.18)',
          text: '#7F1D1D', // red-900
          plate: '#FFFFFF',
          plateStroke: '#FECACA', // red-200
        };
      case 'inactive':
        return {
          stroke: '#94A3B8', // slate-400
          fillTop: '#F8FAFC',
          fillBody: '#E2E8F0',
          shadow: 'rgba(148,163,184,0.22)',
          text: '#334155', // slate-700
          plate: '#FFFFFF',
          plateStroke: '#CBD5E1', // slate-300
        };
      default:
        return {
          stroke: '#94A3B8', // slate-400
          fillTop: '#F8FAFC',
          fillBody: '#F1F5F9',
          shadow: 'rgba(15,23,42,0.10)',
          text: '#0F172A',
          plate: '#FFFFFF',
          plateStroke: '#E2E8F0',
        };
    }
  })();

  return (
    <div className={className} aria-label={`Camiseta ${num}`}>
      <svg viewBox="0 0 120 120" className="w-full h-full" role="img">
        <defs>
          {/* Sombra suave */}
          <filter id="jerseyShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor={palette.shadow} />
          </filter>

          {/* Brillo suave arriba */}
          <linearGradient id="jerseyGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={palette.fillTop} />
            <stop offset="100%" stopColor={palette.fillBody} />
          </linearGradient>

          {/* Textura sutil (puntos) */}
          <pattern id="jerseyDots" width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.6" fill="rgba(15,23,42,0.08)" />
          </pattern>

          {/* Clip para aplicar textura solo dentro del cuerpo */}
          <clipPath id="jerseyClip">
            <path d="M35 23 L48 13 Q60 7 72 13 L85 23 L98 33 Q100 35 98 38 L90 53 Q88 56 84 55 L84 97 Q84 104 77 104 L43 104 Q36 104 36 97 L36 55 Q32 56 30 53 L22 38 Q20 35 22 33 Z" />
          </clipPath>
        </defs>

        {/* Camiseta */}
        <g filter="url(#jerseyShadow)">
          {/* Contorno principal */}
          <path
            d="M35 23 L48 13 Q60 7 72 13 L85 23 L98 33 Q100 35 98 38 L90 53 Q88 56 84 55 L84 97 Q84 104 77 104 L43 104 Q36 104 36 97 L36 55 Q32 56 30 53 L22 38 Q20 35 22 33 Z"
            fill="url(#jerseyGrad)"
            stroke={palette.stroke}
            strokeWidth="2.6"
            strokeLinejoin="round"
          />

          {/* Cuello */}
          <path
            d="M52 14 Q60 10 68 14 Q66 22 60 23 Q54 22 52 14 Z"
            fill={palette.plate}
            stroke={palette.plateStroke}
            strokeWidth="1.5"
          />

          {/* Textura sutil */}
          <g clipPath="url(#jerseyClip)" opacity="0.55">
            <rect x="18" y="10" width="90" height="110" fill="url(#jerseyDots)" />
          </g>

          {/* Costuras (líneas suaves) */}
          <path
            d="M48 24 Q60 28 72 24"
            fill="none"
            stroke="rgba(15,23,42,0.10)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M36 55 L36 97"
            fill="none"
            stroke="rgba(15,23,42,0.08)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M84 55 L84 97"
            fill="none"
            stroke="rgba(15,23,42,0.08)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />

          {/* Placa del número */}
          <rect
            x="42"
            y="54"
            width="36"
            height="30"
            rx="10"
            fill={palette.plate}
            stroke={palette.plateStroke}
            strokeWidth="1.6"
          />

          {/* Número */}
          <text
            x="60"
            y="76"
            textAnchor="middle"
            fontSize="18"
            fontWeight="800"
            fill={palette.text}
            style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto' }}
          >
            {String(num)}
          </text>
        </g>
      </svg>
    </div>
  );
}
