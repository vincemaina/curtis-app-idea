// ── Underground station geometry constants ─────────────────────────────────────
// Shared by UndergroundScene (rendering) and PlayerController (collision).
//
// Station layout (XZ plan, y=0 floor):
//   Entrance zone     x[-10,10],  z[4,8]
//   Ticket hall       x[-10,10],  z[-2,8]   (open concourse)
//   Ticket office     x[-10,-6],  z[-1,1]   (kiosk, collision)
//   Corridor A → P1   x[-1, 9],   z[-2,-18] (eastbound/right)
//   Corridor B → P2   x[-9, -2],  z[-2,-18] (westbound/left)
//   Central wall      x[-2,-1],   z[-2,-18] (divides the two corridors)
//   Platform 1 (East) x[-1,10],   z[-18,-37]
//   Platform 2 (West) x[-10,-1],  z[-18,-37]
//   Train (Plat 1)    x[0.5, 9],  z[-30,-37] (correct, eastbound)
//   Train (Plat 2)    x[-9,-0.5], z[-30,-37] (wrong, westbound)

import type { SupermarketItem } from '@/lib/supermarket-items'

// Player movement bounds
export const BOUNDS = {
  xMin: -11,
  xMax:  11,
  zMin: -38,
  zMax:   8,
} as const

// Collision boxes [xMin, zMin, xMax, zMax] — inflated by player radius (~0.45m)
export const COLLISION_BOXES: ReadonlyArray<readonly [number, number, number, number]> = [
  // ── Central divider between Corridor A (right) and Corridor B (left) ────
  [-2.45, -18, -0.55, -1.6],

  // ── Ticket office kiosk (left side of ticket hall) ───────────────────────
  [-10.45, -1.45, -5.55, 1.45],

  // ── Ticket barriers — two banks with a clear gap in the middle ───────────
  [-9, -2.55, -4.5, -1.45],  // left bank
  [ 1.5, -2.55,  7, -1.45],  // right bank
  // Gap: x=-4.5 to 1.5 (players walk through middle)

  // ── Train carriage bodies (back section only — front is the boarding face) ─
  [0.05, -37, 9.45, -32],   // Platform 1 train (correct)
  [-9.45, -37, -0.05, -32], // Platform 2 train (wrong)
] as const

// ── Collectible items ─────────────────────────────────────────────────────────
// The player boards the eastbound train on Platform 1 to complete their journey.
export const UNDERGROUND_ITEMS: SupermarketItem[] = [
  {
    id: 'board-eastbound',
    name: 'Board Eastbound Train (Platform 1)',
    emoji: '🚇',
    objectiveId: 'board-train',
    position: [4.5, 1.0, -30.5],   // in front of Platform 1 train door
    aisleHint: 'Platform 1 · Eastbound',
    aisleNumber: 0,
  },
]
