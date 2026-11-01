export type Point = { readonly x: number; readonly y: number };

export const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

// Point at `radius` from (cx, cy) in direction `degrees` (0 = right, 90 = down,
// as in screen coordinates).
export const polar = (
  cx: number,
  cy: number,
  radius: number,
  degrees: number,
): Point => ({
  x: cx + radius * Math.cos(toRadians(degrees)),
  y: cy + radius * Math.sin(toRadians(degrees)),
});
