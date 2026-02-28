// src/lib/court-geometry.ts

// --- Constants ---
// All dimensions in meters, based on FIBA half-court
export const COURT_WIDTH_M = 15;
export const COURT_HEIGHT_M = 14; // Typical half-court length for diagrams
export const HOOP_RADIUS_M = 0.225;
export const HOOP_CENTER_X_M = COURT_WIDTH_M / 2; // 7.5m
export const HOOP_CENTER_Y_M = 1.575; // Distance from baseline
export const BACKBOARD_WIDTH_M = 1.8;
export const BACKBOARD_Y_M = 1.2; // Distance from baseline

// 3-Point Line (FIBA)
export const THREE_POINT_RADIUS_M = 6.75; // From center of hoop
export const THREE_POINT_SIDE_DIST_M = 0.9; // Distance from side lines

// Key
export const KEY_WIDTH_M = 4.9;
export const KEY_HEIGHT_M = 5.8;

// --- SVG Coordinate System ---
export const SVG_WIDTH = 100;
export const SVG_HEIGHT = (COURT_HEIGHT_M / COURT_WIDTH_M) * SVG_WIDTH; // Approx 93.33

/**
 * Scales a value from meters to SVG units.
 * @param val - The value in meters.
 * @returns The corresponding value in SVG units.
 */
export const scale = (val: number): number => (val / COURT_WIDTH_M) * SVG_WIDTH;

// --- Derived SVG Coordinates ---
export const hoopX_svg = scale(HOOP_CENTER_X_M);
export const hoopY_svg = scale(HOOP_CENTER_Y_M);
export const threePointRadius_svg = scale(THREE_POINT_RADIUS_M);
export const threePointSideLineXLeft_svg = scale(THREE_POINT_SIDE_DIST_M);
export const threePointSideLineXRight_svg = SVG_WIDTH - scale(THREE_POINT_SIDE_DIST_M);

// Calculate the Y-coordinate where the straight 3-point line meets the arc
// (x - h)^2 + (y - k)^2 = r^2
// We know x (threePointSideLineXLeft_svg), h (hoopX_svg), k (hoopY_svg), and r (threePointRadius_svg)
const dx = threePointSideLineXLeft_svg - hoopX_svg;
const r_squared = threePointRadius_svg * threePointRadius_svg;
const dx_squared = dx * dx;
// Note: if r_squared < dx_squared, it's a math error (shouldn't happen with correct constants)
const y_offset = r_squared > dx_squared ? Math.sqrt(r_squared - dx_squared) : 0;
// The intersection is on the court side of the hoop's Y-coordinate
export const threePointArcStartY_svg = hoopY_svg + y_offset;


/**
 * Determines if a shot taken at given SVG coordinates is a 3-pointer.
 * A shot is a 3-pointer if it is OUTSIDE the 3-point line.
 * @param x_svg - The x-coordinate of the shot in the SVG coordinate system.
 * @param y_svg - The y-coordinate of the shot in the SVG coordinate system.
 * @returns True if the shot is a 3-pointer, false otherwise.
 */
export function isThreePointer(x_svg: number, y_svg: number): boolean {
  // 1. Rule out invalid shots (e.g., behind the backboard)
  // The backboard is at y = scale(1.2), so anything less than that is not a valid field goal.
  if (y_svg < scale(BACKBOARD_Y_M)) {
    return false;
  }
  
  // 2. Check if the shot is from the "corner 3" area.
  // This is the area within the vertical lines but before the arc starts.
  if (y_svg < threePointArcStartY_svg) {
    if (x_svg < threePointSideLineXLeft_svg || x_svg > threePointSideLineXRight_svg) {
      // Outside the vertical lines => it's a 3-pointer
      return true;
    } else {
      // Inside the vertical lines => it's a 2-pointer
      return false;
    }
  }

  // 3. Check if the shot is from beyond the arc.
  const distanceToHoopCenter = Math.sqrt(
    Math.pow(x_svg - hoopX_svg, 2) + Math.pow(y_svg - hoopY_svg, 2)
  );
  
  // If the distance is greater than the 3-point radius, it's a 3-pointer.
  return distanceToHoopCenter > threePointRadius_svg;
}
