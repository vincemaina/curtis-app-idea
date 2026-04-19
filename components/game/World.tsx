'use client'

import { Canvas, useThree } from '@react-three/fiber'
import { KeyboardControls, Environment } from '@react-three/drei'
import { EffectComposer, Bloom, ToneMapping, N8AO, Noise } from '@react-three/postprocessing'
import { ToneMappingMode, BlendFunction } from 'postprocessing'
import { Suspense, useRef, useEffect } from 'react'
import * as THREE from 'three'
import type { Scenario, Message } from '@/lib/types'
import type { SupermarketItem } from '@/lib/supermarket-items'
import { BOUNDS as SUPERMARKET_BOUNDS, COLLISION_BOXES as SUPERMARKET_BOXES } from '@/lib/store-layout'
import { BOUNDS as UNDERGROUND_BOUNDS, COLLISION_BOXES as UNDERGROUND_BOXES } from '@/lib/underground-layout'
import { BOUNDS as PARTY_BOUNDS, COLLISION_BOXES as PARTY_BOXES } from '@/lib/party-layout'
import SupermarketScene from './SupermarketScene'
import UndergroundScene from './UndergroundScene'
import PartyScene from './PartyScene'
import NPCCharacter from './NPCCharacter'
import CollectibleItem from './CollectibleItem'
import PlayerController from './PlayerController'
import { getNPCPosition } from '@/lib/npc-positions'

// ── Per-scenario settings ─────────────────────────────────────────────────────
const CAMERA_STARTS: Record<string, [number, number, number]> = {
  supermarket:      [ 0,   1.7, 23],
  underground:      [ 0,   1.7,  6],
  'birthday-party': [-1,   1.7,  8],
}

const FOG_SETTINGS: Record<string, [string, number, number]> = {
  supermarket:      ['#c4bdb4', 38, 95],
  underground:      ['#1a1a2e',  8, 45],
  'birthday-party': ['#e8d8c0', 18, 55],
}

function getLayoutForScenario(scenarioId: string) {
  if (scenarioId === 'underground') return { bounds: UNDERGROUND_BOUNDS, collisionBoxes: UNDERGROUND_BOXES }
  if (scenarioId === 'birthday-party') return { bounds: PARTY_BOUNDS, collisionBoxes: PARTY_BOXES }
  return { bounds: SUPERMARKET_BOUNDS, collisionBoxes: SUPERMARKET_BOXES }
}

type KeyName = 'forward' | 'backward' | 'left' | 'right' | 'interact'

const KEY_MAP: { name: KeyName; keys: string[] }[] = [
  { name: 'forward',  keys: ['ArrowUp',    'KeyW'] },
  { name: 'backward', keys: ['ArrowDown',  'KeyS'] },
  { name: 'left',     keys: ['ArrowLeft',  'KeyA'] },
  { name: 'right',    keys: ['ArrowRight', 'KeyD'] },
  { name: 'interact', keys: ['KeyE'] },
]

// ── Resolution controller ─────────────────────────────────────────────────────
// Locks the WebGL render buffer to ~480p (standard-def feel).
// The canvas CSS stays at 100vw × 100vh — only the GPU pixel budget changes.
// Heavy film grain at the post-processing stage hides the upscaling softness.
const TARGET_H = 480   // SD render height

function PerformanceController() {
  const gl   = useThree(state => state.gl)
  const size = useThree(state => state.size)

  useEffect(() => {
    const scale = Math.min(1, TARGET_H / size.height)
    gl.setSize(
      Math.round(size.width  * scale),
      Math.round(size.height * scale),
      false,  // updateStyle=false → canvas CSS stays at 100vw×100vh
    )
  }, [gl, size])

  return null
}

interface Props {
  scenario: Scenario
  conversations: Record<string, Message[]>
  items: SupermarketItem[]
  collectedItemIds: string[]
  chatOpen: boolean
  activeNpcId: string | null
  isNpcSpeaking: boolean
  shakeSignal: number
  npcTargets: Record<string, [number, number, number] | null>
  onTalkToNPC: (npcId: string) => void
  onCollectItem: (itemId: string) => void
  onLockedChange: (locked: boolean) => void
  onTargetReached: (npcId: string) => void
  onNPCProximity: (npcId: string) => void
}

export default function World({
  scenario,
  conversations,
  items,
  collectedItemIds,
  chatOpen,
  activeNpcId,
  isNpcSpeaking,
  shakeSignal,
  npcTargets,
  onTalkToNPC,
  onCollectItem,
  onLockedChange,
  onTargetReached,
  onNPCProximity,
}: Props) {
  // Shared ref so NPCs can register their live world positions
  const npcPositionsRef = useRef(new Map<string, THREE.Vector3>())

  const cameraStart = CAMERA_STARTS[scenario.id] ?? [0, 1.7, 23]
  const [fogColor, fogNear, fogFar] = FOG_SETTINGS[scenario.id] ?? ['#c4bdb4', 38, 95]
  const { bounds, collisionBoxes } = getLayoutForScenario(scenario.id)

  return (
    <KeyboardControls map={KEY_MAP}>
      <Canvas
        camera={{ fov: 75, near: 0.1, far: 250, position: cameraStart }}
        dpr={1}          // PerformanceController handles actual pixel budget via gl.setSize
        shadows="soft"
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <Suspense fallback={null}>
          {/* Resolution + FPS controller — must be first so it captures the initial size */}
          <PerformanceController />

          <fog attach="fog" args={[fogColor, fogNear, fogFar]} />
          <Environment preset="warehouse" background={false} />

          {scenario.id === 'supermarket'      && <SupermarketScene />}
          {scenario.id === 'underground'      && <UndergroundScene />}
          {scenario.id === 'birthday-party'   && <PartyScene />}

          {scenario.npcs.map(npc => (
            <NPCCharacter
              key={npc.id}
              npc={npc}
              scenarioId={scenario.id}
              initialPosition={getNPCPosition(scenario.id, npc.id)}
              hasTalked={!!conversations[npc.id]?.length}
              chatOpen={chatOpen}
              isSpeaking={isNpcSpeaking && activeNpcId === npc.id}
              targetOverride={npcTargets[npc.id] ?? null}
              npcPositionsRef={npcPositionsRef}
              onTargetReached={() => onTargetReached(npc.id)}
              onProximityEnter={() => onNPCProximity(npc.id)}
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
            scenarioId={scenario.id}
            collisionBoxes={collisionBoxes}
            bounds={bounds}
            npcs={scenario.npcs}
            items={items}
            collectedItemIds={collectedItemIds}
            chatOpen={chatOpen}
            shakeSignal={shakeSignal}
            npcPositionsRef={npcPositionsRef}
            onTalkToNPC={onTalkToNPC}
            onCollectItem={onCollectItem}
            onLockedChange={onLockedChange}
          />

          <EffectComposer>
            <N8AO halfRes aoRadius={3} intensity={1.2} distanceFalloff={0.5} />
            <Bloom luminanceThreshold={0.55} luminanceSmoothing={0.9} intensity={0.45} />
            <ToneMapping mode={ToneMappingMode.AGX} />
            {/* Heavy soft-light grain — gives SD-upscaled image a retro, tactile look */}
            <Noise opacity={0.14} blendFunction={BlendFunction.SOFT_LIGHT} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </KeyboardControls>
  )
}
