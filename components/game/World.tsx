'use client'

import { Canvas } from '@react-three/fiber'
import { KeyboardControls } from '@react-three/drei'
import { Suspense } from 'react'
import type { Scenario, Message } from '@/lib/types'
import type { SupermarketItem } from '@/lib/supermarket-items'
import SupermarketScene from './SupermarketScene'
import NPCCharacter from './NPCCharacter'
import CollectibleItem from './CollectibleItem'
import PlayerController from './PlayerController'
import { getNPCPosition } from '@/lib/npc-positions'

type KeyName = 'forward' | 'backward' | 'left' | 'right' | 'interact'

const KEY_MAP: { name: KeyName; keys: string[] }[] = [
  { name: 'forward',  keys: ['ArrowUp',    'KeyW'] },
  { name: 'backward', keys: ['ArrowDown',  'KeyS'] },
  { name: 'left',     keys: ['ArrowLeft',  'KeyA'] },
  { name: 'right',    keys: ['ArrowRight', 'KeyD'] },
  { name: 'interact', keys: ['KeyE'] },
]

interface Props {
  scenario: Scenario
  conversations: Record<string, Message[]>
  items: SupermarketItem[]
  collectedItemIds: string[]
  chatOpen: boolean
  onTalkToNPC: (npcId: string) => void
  onCollectItem: (itemId: string) => void
  onLockedChange: (locked: boolean) => void
}

export default function World({
  scenario,
  conversations,
  items,
  collectedItemIds,
  chatOpen,
  onTalkToNPC,
  onCollectItem,
  onLockedChange,
}: Props) {
  return (
    <KeyboardControls map={KEY_MAP}>
      <Canvas
        camera={{ fov: 75, near: 0.1, far: 200, position: [0, 1.7, 20] }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        style={{ width: '100vw', height: '100vh', display: 'block' }}
      >
        <Suspense fallback={null}>
          <SupermarketScene />

          {scenario.npcs.map(npc => (
            <NPCCharacter
              key={npc.id}
              npc={npc}
              position={getNPCPosition(scenario.id, npc.id)}
              hasTalked={!!conversations[npc.id]?.length}
              chatOpen={chatOpen}
            />
          ))}

          {items.map(item => (
            <CollectibleItem
              key={item.id}
              item={item}
              collected={collectedItemIds.includes(item.id)}
            />
          ))}

          <PlayerController
            npcs={scenario.npcs}
            scenarioId={scenario.id}
            items={items}
            collectedItemIds={collectedItemIds}
            chatOpen={chatOpen}
            onTalkToNPC={onTalkToNPC}
            onCollectItem={onCollectItem}
            onLockedChange={onLockedChange}
          />
        </Suspense>
      </Canvas>
    </KeyboardControls>
  )
}
