// ── Starting positions ────────────────────────────────────────────────────────
// World-space [x, y, z] for each NPC's spawn point.
// Supermarket is now 40×108m (z=25 front to z=-76 back).
// Shelf rows at z=[6, -3, -12, -21, -30, -39, -48, -57, -66].
// Aisle centres at x=-8, 0, 8.
export const NPC_POSITIONS: Record<string, Record<string, [number, number, number]>> = {
  supermarket: {
    'store-employee':      [ -8, 0,  3  ],  // Maria: aisle 1, row 1 restocking
    'manager':             [  9, 0, 14  ],  // Dave: front-right, wide floor walk
    'couple':              [ -7, 0, -21 ],  // Tom & Sarah: mid-store, row 4 browsing
    'young-professional':  [-14, 0, -2  ],  // Priya: produce section, looking lost
    'old-man':             [  8, 0, -48 ],  // Jim: deep store row 7, reading labels
  },
  underground: {
    'ticket-officer': [ -4, 0,  2 ],
    'commuter':        [  5, 0, -2 ],
    'tourist':         [  0, 0, -5 ],
    'busker':          [ -6, 0, -9 ],
    'older-traveller': [  4, 0, -12],
  },
  party: {
    'extrovert':       [  3, 0,  4 ],
    'colleague':       [ -3, 0,  2 ],
    'nervous-cousin':  [ -7, 0, -5 ],
    'parents-friend':  [  7, 0, -3 ],
    'sharp-friend':    [  0, 0, -8 ],
  },
}

export function getNPCPosition(
  scenarioId: string,
  npcId: string,
): [number, number, number] {
  return NPC_POSITIONS[scenarioId]?.[npcId] ?? [0, 0, 0]
}

// ── Patrol circuits ───────────────────────────────────────────────────────────
// Waypoints the NPC loops through when undisturbed.
// NPCs walk in aisle centres (x = -8, 0, 8) to avoid walking through shelves.
export const NPC_PATROLS: Record<string, Record<string, [number, number, number][]>> = {
  supermarket: {
    // Maria: rows 1–3 in aisle 1 (z=6 to -12), restocking
    'store-employee': [
      [-8, 0,  6],
      [-8, 0, -3],
      [-8, 0, -12],
    ],
    // Dave: broad floor walk across the front third of the store
    'manager': [
      [ 9, 0, 20],
      [ 9, 0,  6],
      [ 0, 0,  1],
      [-9, 0,  6],
      [-9, 0, 20],
    ],
    // Tom & Sarah: leisurely circuit across rows 4–5 (mid-store)
    'couple': [
      [-7, 0, -21],
      [-7, 0, -30],
      [-6, 0, -30],
      [-6, 0, -21],
    ],
    // Priya: small lost wandering near produce bins (left wall, z=−2 to −5)
    'young-professional': [
      [-14, 0, -1],
      [-15, 0, -1],
      [-15, 0, -5],
      [-14, 0, -5],
    ],
    // Jim: slow shuffle deep in store, rows 7–8 (z=-48 to -57)
    'old-man': [
      [ 8, 0, -48],
      [ 9, 0, -48],
      [ 9, 0, -57],
      [ 8, 0, -57],
    ],
  },
}

// ── Movement speeds (units / second) ─────────────────────────────────────────
export const NPC_SPEEDS: Record<string, Record<string, number>> = {
  supermarket: {
    'store-employee':     1.6,   // efficient worker
    'manager':            2.1,   // purposeful
    'couple':             0.7,   // leisurely browsing
    'young-professional': 0.5,   // slow, distracted
    'old-man':            0.32,  // slow, elderly shuffle
  },
}
