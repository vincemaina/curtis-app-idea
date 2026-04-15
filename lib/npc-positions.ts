// ── Starting positions ────────────────────────────────────────────────────────
// World-space [x, y, z] for each NPC's spawn point.
// IDs must match exactly the id strings in lib/scenarios.ts.
export const NPC_POSITIONS: Record<string, Record<string, [number, number, number]>> = {
  supermarket: {
    'store-employee':      [ -8, 0,  3  ],  // Maria: aisle 1, row 1 restocking
    'manager':             [  9, 0, 14  ],  // Dave: front-right, wide floor walk
    'couple':              [ -7, 0, -21 ],  // Tom & Sarah: mid-store, row 4
    'young-professional':  [-14, 0, -2  ],  // Priya: produce section, lost
    'old-man':             [  8, 0, -48 ],  // Jim: deep store row 7, reads labels
  },
  underground: {
    'ticket-officer':    [-8,   0,  0  ],  // Marcus: ticket office kiosk (left side)
    'regular-commuter':  [ 4,   0, -5  ],  // Janet: corridor A, heading to Platform 1
    'tourist':           [ 1,   0, -3  ],  // Hiroshi: ticket hall, near wall map
    'busker':            [-5,   0,  5.5],  // Leo: entrance zone, on guitar case
    'lost-older-woman':  [-1,   0, -2  ],  // Eileen: near ticket barriers
  },
  'birthday-party': {
    'extrovert-friend':    [-2,  0,  7  ],  // Charlie: drinks area, living room
    'work-colleague':      [-10, 0,  2  ],  // Sophie: bookshelf, living room
    'alexs-cousin':        [-9,  0, -1  ],  // Remi: chair near left wall, living room
    'alexs-mum':           [ 5,  0,  7  ],  // Pat: kitchen, near food
    'confident-stranger':  [-4,  0,  3  ],  // Jess: middle of living room
    'quiet-garden-friend': [ 0,  0,-11  ],  // Sam: patio table, garden
    'loud-neighbour':      [ 6,  0,  4  ],  // Bea: kitchen area
    'alexs-sibling':       [-2,  0,  8  ],  // Jordan: near entrance, moving around
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
// [] = stationary (idle at spawn position forever).
export const NPC_PATROLS: Record<string, Record<string, [number, number, number][]>> = {
  supermarket: {
    // Maria: rows 1–3 in aisle 1, restocking
    'store-employee': [
      [-8, 0,  6],
      [-8, 0, -3],
      [-8, 0, -12],
    ],
    // Dave: purposeful floor walk across front third of store
    'manager': [
      [ 9, 0, 20],
      [ 9, 0,  6],
      [ 0, 0,  1],
      [-9, 0,  6],
      [-9, 0, 20],
    ],
    // Tom & Sarah: leisurely circuit across rows 4–5
    'couple': [
      [-7, 0, -21],
      [-7, 0, -30],
      [-6, 0, -30],
      [-6, 0, -21],
    ],
    // Priya: stressed pacing near produce bins
    'young-professional': [
      [-14, 0, -1],
      [-14, 0, -5],
    ],
    // Jim: stands still by shelf — proximity fires his greeting
    'old-man': [],
  },

  underground: {
    // Marcus: slow pace in the ticket office kiosk area
    'ticket-officer': [
      [-8, 0, -1],
      [-8, 0,  1],
    ],
    // Janet: walking toward Platform 1 corridor, then back (commuter loop)
    'regular-commuter': [
      [ 4, 0,  -5],
      [ 4, 0, -15],
    ],
    // Hiroshi: confused wandering in the ticket hall near the wall map
    'tourist': [
      [ 1, 0, -3],
      [ 2, 0, -1],
      [ 0, 0, -4],
    ],
    // Leo: stationary at entrance — proximity fires
    'busker': [],
    // Eileen: hovering indecisively near barriers — proximity fires
    'lost-older-woman': [
      [-1, 0, -1.5],
      [-1, 0, -2.5],
    ],
  },

  'birthday-party': {
    // Charlie: mingles between drinks area and centre of living room
    'extrovert-friend': [
      [-2, 0,  7],
      [-2, 0,  3],
      [ 0, 0,  5],
    ],
    // Sophie: stays near bookshelf area (stationary-ish)
    'work-colleague': [
      [-10, 0, 2],
      [-10, 0, 4],
    ],
    // Remi: stationary in chair — proximity fires greeting
    'alexs-cousin': [],
    // Pat: kitchen patrol near food table
    'alexs-mum': [
      [5, 0, 7],
      [7, 0, 6],
      [7, 0, 8],
      [5, 0, 8],
    ],
    // Jess: slow drift around middle of living room
    'confident-stranger': [
      [-4, 0,  3],
      [-2, 0,  1],
      [-6, 0,  1],
    ],
    // Sam: stationary at garden patio table
    'quiet-garden-friend': [],
    // Bea: kitchen loop, animated and present
    'loud-neighbour': [
      [6, 0, 4],
      [5, 0, 6],
      [8, 0, 5],
    ],
    // Jordan: busiest — moves between living room and kitchen
    'alexs-sibling': [
      [-2, 0, 8],
      [-2, 0, 4],
      [ 3, 0, 7],
      [ 3, 0, 4],
    ],
  },
}

// ── Movement speeds (units / second) ─────────────────────────────────────────
export const NPC_SPEEDS: Record<string, Record<string, number>> = {
  supermarket: {
    'store-employee':     2.0,   // efficient worker
    'manager':            3.0,   // purposeful stride
    'couple':             0.95,  // leisurely browsing
    'young-professional': 1.5,   // stressed pacing
    'old-man':            0.22,  // elderly shuffle
  },
  underground: {
    'ticket-officer':    0.6,   // slow pacing in the booth
    'regular-commuter':  2.8,   // commuter pace
    'tourist':           0.6,   // slow confused wandering
    'busker':            0.0,   // stationary
    'lost-older-woman':  0.5,   // cautious hovering
  },
  'birthday-party': {
    'extrovert-friend':    1.4,
    'work-colleague':      0.4,
    'alexs-cousin':        0.0,  // stationary (sitting)
    'alexs-mum':           0.9,
    'confident-stranger':  0.7,
    'quiet-garden-friend': 0.0,  // stationary (sitting outside)
    'loud-neighbour':      1.1,
    'alexs-sibling':       1.8,  // rushing around hosting
  },
}
