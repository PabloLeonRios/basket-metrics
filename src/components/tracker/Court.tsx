// src/components/tracker/Court.tsx
'use client';
import { memo } from 'react';

interface CourtProps {
  onClick: (x: number, y: number) => void;
  shotCoordinates?: { x: number; y: number } | null; // Coordenadas del tiro pendiente
}

// Un componente simple que renderiza una media cancha de baloncesto SVG.
// El viewBox define el sistema de coordenadas (0,0) en la esquina superior izquierda.
const Court = memo(function Court({ onClick, shotCoordinates }: CourtProps) {
  const handleCourtClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const { x, y } = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    onClick(x, y);
  };

  return (
    <div className="w-full max-w-lg mx-auto aspect-[100/94] touch-none">
              <svg
                  viewBox="0 0 100 94"
                  xmlns="http://www.w3.org/2000/svg"
                  onClick={handleCourtClick}
                  className="w-full h-full bg-orange-200 dark:bg-orange-800 rounded-lg shadow-md"
              >
                  {/* Background: Simplified wood texture effect with a base color */}
                  <rect x="0" y="0" width="100" height="94" fill="#D3A76C" />
                  
                  {/* Court Lines (White, 0.5 stroke for visibility within viewBox) */}
                  <g stroke="white" strokeWidth="0.5" strokeLinejoin="round" strokeLinecap="round">
                      {/* Outer boundary (half court) */}
                      <rect x="0" y="0" width="100" height="94" fill="none" />
      
                      {/* Midcourt Line */}
                      <line x1="0" y1="47" x2="100" y2="47" />
      
                      {/* Key (Restricted Area) - FIBA: 4.9m wide, 5.8m from baseline */}
                      {/* Scaled: 32.67 units wide, 38.97 units long. Centered: x=33.66 */}
                      <rect x="33.66" y="0" width="32.67" height="38.97" fill="none" />
      
                      {/* Free Throw Line */}
                      <line x1="33.66" y1="38.97" x2="66.33" y2="38.97" />
      
                      {/* Free Throw Circle (Top half) - Radius: 1.8m -> 12.09 units. Center: cx=50, cy=38.97 */}
                      <path d="M50 38.97 A12.09 12.09 0 0 1 62.09 38.97" fill="none"/>
                      <path d="M50 38.97 A12.09 12.09 0 0 0 37.91 38.97" fill="none"/>
      
                      {/* Basket/Rim - Diameter: 0.45m -> 3 units. Center: cx=50, cy=10.58 */}
                      <circle cx="50" cy="10.58" r="1.5" fill="none" stroke="red" strokeWidth="0.5" />
      
                      {/* Backboard - 1.8m wide -> 12 units. Positioned 1.2m -> 8.06 units from baseline. */}
                      {/* Centered: x from 44 to 56 */}
                      <line x1="44" y1="8.06" x2="56" y2="8.06" stroke="gray" strokeWidth="1" />
      
                      {/* Three-point line - 6.75m from basket center. Scaled radius: 45.32 units */}
                      {/* Straight lines: 0.9m from sideline -> 6 units. Extends to y=21.48 */}
                      <line x1="6" y1="0" x2="6" y2="21.48" />
                      <line x1="94" y1="0" x2="94" y2="21.48" />
                      {/* Arc: Center at cx=50, cy=10.58, radius 45.32 */}
                      <path d="M6 21.48 A45.32 45.32 0 0 1 94 21.48" fill="none" />
      
                      {/* Small restricted area arc (dunkers spot) - 1.25m radius from basket center -> 8.41 units */}
                      {/* Center: cx=50, cy=10.58 */}
                      <path d="M50 10.58 A8.41 8.41 0 0 1 58.41 10.58" fill="none" strokeDasharray="1 0.5" />
                      <path d="M50 10.58 A8.41 8.41 0 0 0 41.59 10.58" fill="none" strokeDasharray="1 0.5" />
      
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
              </svg>    </div>
  );
});

export default Court;
