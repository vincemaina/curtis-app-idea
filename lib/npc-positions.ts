// ── Starting positions ────────────────────────────────────────────────────────
// World-space [x, y, z] for each NPC's spawn point.
export const NPC_POSITIONS: Record<string, Record<string, [number, number, number]>> = {
  supermarket: {
    'store-employee':      [ -8, 0,  3  ],  // Maria: in aisle 1, restocking
    'manager':             [  9, 0,  4  ],  // Dave: front-right doing stock check
    'couple':              [ -7, 0, -4  ],  // Tom & Sarah: cereal aisle
    'young-professional':  [-14, 0, -2  ],  // Priya: produce section, looking lost
    'old-man':             [  8, 0, -13 ],  // Jim: back of store, reading labels
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
// NPCs walk in the aisle centres (x = -8, 0, 8) to avoid walking through shelves.
export const NPC_PATROLS: Record<string, Record<string, [number, number, number][]>> = {
  supermarket: {
    // Maria: back-and-forth in aisle 1 (tinned goods), rows 1–2
    'store-employee': [
      [-8, 0,  3],
      [-8, 0, -4],
      [-8, 0, -9],
    ],
    // Dave: broad floor walk across the front half of the store
    'manager': [
      [ 9, 0, 12],
      [ 9, 0,  4],
      [ 0, 0,  1],
      [-9, 0,  4],
      [-9, 0, 12],
    ],
    // Tom & Sarah: small circuit in aisle 1, debating cereals
    'couple': [
      [-7, 0, -3],
      [-7, 0, -7],
      [-6, 0, -7],
      [-6, 0, -3],
    ],
    // Priya: small lost wandering near produce bins
    'young-professional': [
      [-14, 0, -1],
      [-15, 0, -1],
      [-15, 0, -5],
      [-14, 0, -5],
    ],
    // Jim: slow shuffle in aisle 3, back half
    'old-man': [
      [ 8, 0, -12],
      [ 9, 0, -12],
      [ 9, 0, -16],
      [ 8, 0, -16],
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
