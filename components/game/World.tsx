'use client'

import { Canvas } from '@react-three/fiber'
import { KeyboardControls } from '@react-three/drei'
import { Suspense, useRef } from 'react'
import * as THREE from 'three'
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
  npcTargets: Record<string, [number, number, number] | null>
  onTalkToNPC: (npcId: string) => void
  onCollectItem: (itemId: string) => void
  onLockedChange: (locked: boolean) => void
  onTargetReached: (npcId: string) => void
}

export default function World({
  scenario,
  conversations,
  items,
  collectedItemIds,
  chatOpen,
  npcTargets,
  onTalkToNPC,
  onCollectItem,
  onLockedChange,
  onTargetReached,
}: Props) {
  // Shared ref so NPCs can register their live world positions (for future collision use etc.)
  const npcPositionsRef = useRef(new Map<string, THREE.Vector3>())

  return (
    <KeyboardControls map={KEY_MAP}>
      <Canvas
        camera={{ fov: 75, near: 0.1, far: 200, position: [0, 1.7, 20] }}
        shadows="soft"
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        style={{ width: '100vw', height: '100vh', display: 'block' }}
      >
        <Suspense fallback={null}>
          <fog attach="fog" args={['#c4bdb4', 28, 58]} />
          <SupermarketScene />

          {scenario.npcs.map(npc => (
            <NPCCharacter
              key={npc.id}
              npc={npc}
              scenarioId={scenario.id}
              initialPosition={getNPCPosition(scenario.id, npc.id)}
              hasTalked={!!conversations[npc.id]?.length}
              chatOpen={chatOpen}
              targetOverride={npcTargets[npc.id] ?? null}
              npcPositionsRef={npcPositionsRef}
              onTargetReached={() => onTargetReached(npc.id)}
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
            items={items}
            collectedItemIds={collectedItemIds}
            chatOpen={chatOpen}
            npcPositionsRef={npcPositionsRef}
            onTalkToNPC={onTalkToNPC}
            onCollectItem={onCollectItem}
            onLockedChange={onLockedChange}
          />
        </Suspense>
      </Canvas>
    </KeyboardControls>
  )
}
