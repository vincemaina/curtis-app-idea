// Physical items the player can collect in the supermarket to complete objectives.
// Positions are in world-space [x, y, z].
export interface SupermarketItem {
  id: string
  name: string
  emoji: string
  objectiveId: string          // completing this item = completing this objective
  position: [number, number, number]
  aisleHint: string            // shown in the interaction prompt
}

export const SUPERMARKET_ITEMS: SupermarketItem[] = [
  {
    id: 'chickpeas',
    name: 'Chickpeas (400g)',
    emoji: '🥫',
    objectiveId: 'find-chickpeas',
    position: [-10.5, 0.65, 0.6],   // Aisle 1, front of left shelf (row 1)
    aisleHint: 'Aisle 1 · Tinned Goods',
  },
  {
    id: 'tomatoes',
    name: 'Tinned Tomatoes (400g)',
    emoji: '🍅',
    objectiveId: 'find-tomatoes',
    position: [-5.8, 0.65, 0.6],    // Aisle 1, front of right shelf (row 1)
    aisleHint: 'Aisle 1 · Tinned Goods',
  },
  {
    id: 'coconut',
    name: 'Coconut Milk (400ml)',
    emoji: '🥥',
    objectiveId: 'find-coconut',
    position: [6.2, 1.3, -9.4],     // Aisle 3, middle shelf (row 2)
    aisleHint: 'Aisle 3 · World Foods & Baking',
  },
  {
    id: 'potatoes',
    name: 'Potatoes (500g)',
    emoji: '🥔',
    objectiveId: 'find-potatoes',
    position: [-14.2, 0.62, 2.2],   // Fresh produce section
    aisleHint: 'Fresh Produce',
  },
]
