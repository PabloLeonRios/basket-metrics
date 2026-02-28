// src/lib/court-geometry.ts

// --- Constants ---
// All dimensions in meters, based on FIBA half-court
export const COURT_WIDTH_M = 15;
export const COURT_HEIGHT_M = 14; 
export const HOOP_RADIUS_M = 0.225;
export const HOOP_CENTER_X_M = COURT_WIDTH_M / 2; // 7.5m
export const HOOP_CENTER_Y_M = 1.575; // Distance from baseline
export const BACKBOARD_WIDTH_M = 1.8;
export const BACKBOARD_Y_M = 1.2; // Distance from baseline
export const THREE_POINT_RADIUS_M = 6.75; 
export const THREE_POINT_SIDE_DIST_M = 0.9;
export const KEY_WIDTH_M = 4.9;
export const KEY_HEIGHT_M = 5.8;
export const FREE_THROW_CIRCLE_RADIUS_M = 1.8;
export const NO_CHARGE_SEMI_CIRCLE_RADIUS_M = 1.25;

// --- SVG Coordinate System ---
export const SVG_WIDTH = 100;
export const SVG_HEIGHT = (COURT_HEIGHT_M / COURT_WIDTH_M) * SVG_WIDTH;

/**
 * Scales a value from meters to SVG units.
 */
export const scale = (val: number): number => (val / COURT_WIDTH_M) * SVG_WIDTH;

// --- Derived SVG Coordinates ---
export const hoopX_svg = scale(HOOP_CENTER_X_M);
export const hoopY_svg = scale(HOOP_CENTER_Y_M);
export const threePointRadius_svg = scale(THREE_POINT_RADIUS_M);
export const threePointSideLineXLeft_svg = scale(THREE_POINT_SIDE_DIST_M);
export const threePointSideLineXRight_svg = SVG_WIDTH - scale(THREE_POINT_SIDE_DIST_M);

// Y-coordinate where the straight 3-point line meets the arc
// (x - h)^2 + (y - k)^2 = r^2
const dx = threePointSideLineXLeft_svg - hoopX_svg;
const r_squared = Math.pow(threePointRadius_svg, 2);
const dx_squared = Math.pow(dx, 2);
const y_offset = r_squared > dx_squared ? Math.sqrt(r_squared - dx_squared) : 0;
// The intersection point's Y is further from the baseline (y=0) than the hoop center
export const threePointArcStartY_svg = hoopY_svg + y_offset;


/**
 * Determines if a shot taken at given SVG coordinates is a 3-pointer.
 */
export function isThreePointer(x_svg: number, y_svg: number): boolean {
  // Rule out invalid shots (e.g., behind the backboard)
  if (y_svg < scale(BACKBOARD_Y_M)) {
    return false;
  }
  
  // Check if it's a 2-pointer by being inside the 3-point line
  const isInsideVerticalLines = x_svg >= threePointSideLineXLeft_svg && x_svg <= threePointSideLineXRight_svg;
  
  if (y_svg < threePointArcStartY_svg) {
    // If we are in the 'corner' area, a shot is a 2-pointer if it's between the vertical lines
    if (isInsideVerticalLines) {
        return false; // 2-pointer
    }
  }

  // Check against the arc
  const distanceToHoopCenter = Math.sqrt(
    Math.pow(x_svg - hoopX_svg, 2) + Math.pow(y_svg - hoopY_svg, 2)
  );

  if (distanceToHoopCenter <= threePointRadius_svg) {
      return false; // 2-pointer
  }

  // If none of the 2-point conditions are met, it's a 3-pointer
  return true;
}
