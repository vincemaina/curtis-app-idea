'use client'

import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { KeyboardControls, Environment } from '@react-three/drei'
import { EffectComposer, Bloom, ToneMapping, N8AO, Noise } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { Suspense, useRef, useEffect } from 'react'
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

// ── Resolution controller ─────────────────────────────────────────────────────
// Caps the WebGL render buffer to 720p height at most, then scales dynamically
// based on live FPS so mid-range devices stay at 60 fps.
// The canvas CSS remains 100vw × 100vh — only the GPU pixel budget changes.
// HUD / chat DOM elements are unaffected and always render at native resolution.
const TARGET_H    = 720          // max render height in pixels
const SCALE_MIN   = 0.55         // minimum scale (≈ 396p on 720-equivalent)
const ADJUST_MS   = 2000         // wait this long between auto-adjustments
const FPS_SAMPLES = 90           // rolling window size

function PerformanceController() {
  const gl         = useThree(state => state.gl)
  const size       = useThree(state => state.size)
  const fpsHistory = useRef<number[]>([])
  const scaleRef   = useRef(1)
  const lastAdjust = useRef(0)

  // Cap to TARGET_H whenever canvas size changes (initial load + window resize)
  useEffect(() => {
    const capScale = Math.min(1, TARGET_H / size.height)
    scaleRef.current = capScale
    gl.setSize(
      Math.round(size.width  * capScale),
      Math.round(size.height * capScale),
      false,  // updateStyle=false → canvas CSS stays at 100vw×100vh
    )
  }, [gl, size])

  // FPS-based dynamic scaling within the 720p budget
  useFrame((_, delta) => {
    const fps = 1 / Math.max(delta, 0.001)
    fpsHistory.current.push(fps)
    if (fpsHistory.current.length > FPS_SAMPLES) fpsHistory.current.shift()

    const now = performance.now()
    if (now - lastAdjust.current < ADJUST_MS)        return
    if (fpsHistory.current.length < FPS_SAMPLES / 2) return

    const avg      = fpsHistory.current.reduce((a, b) => a + b, 0) / fpsHistory.current.length
    const capScale = Math.min(1, TARGET_H / size.height)

    if (avg < 50 && scaleRef.current > SCALE_MIN) {
      // Dropping frames — reduce resolution
      scaleRef.current = Math.max(SCALE_MIN, scaleRef.current - 0.06)
      gl.setSize(
        Math.round(size.width  * scaleRef.current),
        Math.round(size.height * scaleRef.current),
        false,
      )
      lastAdjust.current = now
    } else if (avg > 62 && scaleRef.current < capScale) {
      // Stable — recover resolution slowly
      scaleRef.current = Math.min(capScale, scaleRef.current + 0.03)
      gl.setSize(
        Math.round(size.width  * scaleRef.current),
        Math.round(size.height * scaleRef.current),
        false,
      )
      lastAdjust.current = now
    }
  })

  return null
}

interface Props {
  scenario: Scenario
  conversations: Record<string, Message[]>
  items: SupermarketItem[]
  collectedItemIds: string[]
  chatOpen: boolean
  shakeSignal: number
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
  shakeSignal,
  npcTargets,
  onTalkToNPC,
  onCollectItem,
  onLockedChange,
  onTargetReached,
}: Props) {
  // Shared ref so NPCs can register their live world positions
  const npcPositionsRef = useRef(new Map<string, THREE.Vector3>())

  return (
    <KeyboardControls map={KEY_MAP}>
      <Canvas
        camera={{ fov: 75, near: 0.1, far: 250, position: [0, 1.7, 23] }}
        dpr={1}          // PerformanceController handles actual pixel budget via gl.setSize
        shadows="soft"
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        style={{ width: '100vw', height: '100vh', display: 'block' }}
      >
        <Suspense fallback={null}>
          {/* Resolution + FPS controller — must be first so it captures the initial size */}
          <PerformanceController />

          <fog attach="fog" args={['#c4bdb4', 38, 95]} />
          <Environment preset="warehouse" background={false} />
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
            {/* Subtle film grain — hides 720p upscaling softness and adds cinematic texture */}
            <Noise opacity={0.035} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </KeyboardControls>
  )
}
