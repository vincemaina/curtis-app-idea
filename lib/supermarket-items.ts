// Physical items the player can collect in the supermarket to complete objectives.
// Positions are in world-space [x, y, z].
export interface SupermarketItem {
  id: string
  name: string
  emoji: string
  objectiveId: string          // completing this item = completing this objective
  position: [number, number, number]
  aisleHint: string            // shown in the interaction prompt
  aisleNumber: number          // which aisle (1-3) contains this item; 0 = fresh produce (no aisle)
}

export const SUPERMARKET_ITEMS: SupermarketItem[] = [
  {
    id: 'chickpeas',
    name: 'Chickpeas (400g)',
    emoji: '🥫',
    objectiveId: 'find-chickpeas',
    position: [-10.5, 0.65, 5.5],   // Aisle 1, row 1 (z=6), lower shelf
    aisleHint: 'Aisle 1 · Tinned Goods',
    aisleNumber: 1,
  },
  {
    id: 'tomatoes',
    name: 'Tinned Tomatoes (400g)',
    emoji: '🍅',
    objectiveId: 'find-tomatoes',
    position: [-5.8, 0.65, 5.5],    // Aisle 1, row 1 (z=6), lower shelf
    aisleHint: 'Aisle 1 · Tinned Goods',
    aisleNumber: 1,
  },
  {
    id: 'coconut',
    name: 'Coconut Milk (400ml)',
    emoji: '🥥',
    objectiveId: 'find-coconut',
    position: [6.2, 1.3, -12.5],    // Aisle 3, row 3 (z=-12), middle shelf
    aisleHint: 'Aisle 3 · World Foods & Baking',
    aisleNumber: 3,
  },
  {
    id: 'potatoes',
    name: 'Potatoes (500g)',
    emoji: '🥔',
    objectiveId: 'find-potatoes',
    position: [-14.2, 0.62, 2.2],   // Fresh produce section (left wall)
    aisleHint: 'Fresh Produce',
    aisleNumber: 0,                  // not in a numbered aisle
  },
]
