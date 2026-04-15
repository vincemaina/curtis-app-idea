// ── Party (birthday house) geometry constants ──────────────────────────────────
// Shared by PartyScene (rendering) and PlayerController (collision).
//
// Floor plan (XZ, y=0):
//   Living room   x[-12, 2], z[-4, 10]   (large front room)
//   Kitchen       x[ 2, 12], z[-4, 10]   (right side, joined at x=2)
//   Garden        x[-12,12], z[-14,-4]   (back, through gap at z=-4)
//
// Doorways:
//   Living room ↔ Kitchen: gap at x=2, z[0,4]
//   Living room ↔ Garden:  gap at z=-4, x[-3,3]

// Player movement bounds
export const BOUNDS = {
  xMin: -12,
  xMax:  12,
  zMin: -14,
  zMax:  10,
} as const

// Collision boxes [xMin, zMin, xMax, zMax]
export const COLLISION_BOXES: ReadonlyArray<readonly [number, number, number, number]> = [
  // ── Internal wall between living room and kitchen (x≈2) ──────────────────
  // Two segments with a doorway gap at z[0,4]
  [1.55, 3.95, 2.45, 10.45],   // upper wall segment (z=4 to 10)
  [1.55, -4.45, 2.45, 0.05],   // lower wall segment (z=-4 to 0)

  // ── Internal wall between house and garden (z≈-4) ────────────────────────
  // Two segments with a garden door gap at x[-3,3]
  [-12.45, -4.45, -3.05, -3.55],  // left segment
  [ 2.95, -4.45, 12.45, -3.55],   // right segment

  // ── Furniture ─────────────────────────────────────────────────────────────
  // Sofa (living room, against left wall)
  [-11.5, 5.0, -6.5, 8.0],

  // Bookshelf (living room, left wall)
  [-12.45, -0.45, -10.55, 5.05],

  // Kitchen island
  [3.55, 1.55, 8.45, 5.45],

  // Garden patio table + chairs
  [-2.45, -12.45, 2.45, -7.55],
] as const
