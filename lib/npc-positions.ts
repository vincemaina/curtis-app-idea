// World-space positions [x, y, z] for each NPC per scenario
export const NPC_POSITIONS: Record<string, Record<string, [number, number, number]>> = {
  supermarket: {
    'store-employee':      [  0, 0,  8 ],  // Maria: near entrance restocking
    'manager':             [  9, 0,  4 ],  // Dave: front-right doing stock check
    'couple':              [ -6, 0, -5 ],  // Tom & Sarah: cereal aisle mid-store
    'young-professional':  [ -9, 0, -6 ],  // Priya: produce entrance, looking lost
    'old-man':             [  8, 0, -14],  // Jim: back of store reading soup label
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
