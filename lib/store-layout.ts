// ── Store geometry constants ───────────────────────────────────────────────────
// Single source of truth shared by SupermarketScene (rendering) and
// PlayerController (collision detection).

// Shelf column X positions
export const SHELF_X = [-12, -4, 4, 12] as const

// Shelf row Z positions — 9 rows stretching deep into the store
export const SHELF_ROWS_Z = [6, -3, -12, -21, -30, -39, -48, -57, -66] as const

// Player movement bounds (metres)
export const BOUNDS = {
  xMin: -18.5,
  xMax:  18.5,
  zMin: -76,
  zMax:  25,
} as const

// Store extents (for walls, floor, ceiling)
export const STORE = {
  width:   40,
  length:  108,
  zCenter: -25,   // (zMin + zMax) / 2 ≈ -25
  backZ:   -78,
  frontZ:   28,
} as const

// ── Aisle navigation ──────────────────────────────────────────────────────────
// The three walkway aisles between the 4 shelf columns (numbered left→right).
// Aisle 1: x=-8  (between x=-12 and x=-4 shelves — Tinned/Soup/Household)
// Aisle 2: x= 0  (between x=-4  and x=4  shelves — Cereals/Dairy/Drinks)
// Aisle 3: x= 8  (between x=4   and x=12 shelves — World Foods/Health)
export const AISLE_WALKWAY_X: Readonly<Record<number, number>> = {
  1: -8,
  2:  0,
  3:  8,
} as const

// Z position an NPC targets when searching an aisle (mid-store, row 5)
export const AISLE_SEARCH_Z = -30

// ── Collision boxes ────────────────────────────────────────────────────────────
// Each entry is [xMin, zMin, xMax, zMax] in world-space XZ.
// Boxes are inflated by ~0.45 m (player radius) so the camera never clips geometry.

const SHELF_HW = 1.7   // half-width (1.25 shelf + 0.45 player radius)
const SHELF_HD = 0.7   // half-depth (0.25 shelf + 0.45 player radius)

export const COLLISION_BOXES: ReadonlyArray<readonly [number, number, number, number]> = [
  // ── Shelf units (4 columns × 9 rows) ────────────────────────────────────
  ...SHELF_X.flatMap(x =>
    SHELF_ROWS_Z.map(z =>
      [x - SHELF_HW, z - SHELF_HD, x + SHELF_HW, z + SHELF_HD] as const
    )
  ),

  // ── Refrigerator wall (back of store) ───────────────────────────────────
  [-17, -78, 17, -74],

  // ── Checkout counters (z ≈ 22) ──────────────────────────────────────────
  [-8, 21, -6, 23],
  [-4, 21, -2, 23],
  [ 2, 21,  4, 23],
  [ 6, 21,  8, 23],

  // ── Produce / fresh section (left wall) ─────────────────────────────────
  [-19.5, -2, -17, 8],
] as const
