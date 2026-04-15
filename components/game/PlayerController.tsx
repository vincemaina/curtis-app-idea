'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls, useKeyboardControls } from '@react-three/drei'
import * as THREE from 'three'
import type { NPC } from '@/lib/types'
import type { SupermarketItem } from '@/lib/supermarket-items'

type Keys = 'forward' | 'backward' | 'left' | 'right' | 'interact'

interface Props {
  npcs: NPC[]
  items: SupermarketItem[]
  collectedItemIds: string[]
  chatOpen: boolean
  shakeSignal: number
  npcPositionsRef: React.MutableRefObject<Map<string, THREE.Vector3>>
  onTalkToNPC: (npcId: string) => void
  onCollectItem: (itemId: string) => void
  onLockedChange: (locked: boolean) => void
}

const MOVE_SPEED     = 7
const NPC_DIST       = 4.5
const ITEM_DIST      = 2.8
const BOUNDS = { xMin: -19, xMax: 19, zMin: -22, zMax: 22 }

// ── Procedural footstep sound ──────────────────────────────────────────────────
function playFootstep(ctx: AudioContext) {
  const len = Math.floor(ctx.sampleRate * 0.072)
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const d   = buf.getChannelData(0)
  for (let i = 0; i < len; i++) {
    // Noise burst that decays sharply — sounds like a soft footfall
    d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.8) * 0.38
  }
  const src = ctx.createBufferSource()
  src.buffer = buf
  const lpf = ctx.createBiquadFilter()
  lpf.type = 'lowpass'
  lpf.frequency.value = 260
  src.connect(lpf)
  lpf.connect(ctx.destination)
  src.start()
}

export default function PlayerController({
  npcs,
  items,
  collectedItemIds,
  chatOpen,
  shakeSignal,
  npcPositionsRef,
  onTalkToNPC,
  onCollectItem,
  onLockedChange,
}: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef     = useRef<any>(null)
  const interactPressed = useRef(false)
  const forwardVec      = useRef(new THREE.Vector3())
  const rightVec        = useRef(new THREE.Vector3())
  const UP              = useRef(new THREE.Vector3(0, 1, 0))
  const _distVec        = useRef(new THREE.Vector3())
  const { camera }      = useThree()

  // ── Audio ──────────────────────────────────────────────────────────────────
  const audioCtxRef    = useRef<AudioContext | null>(null)
  const fridgeGainRef  = useRef<GainNode | null>(null)
  const stepTimerRef   = useRef(0)

  const initAudio = useCallback(() => {
    if (audioCtxRef.current) return
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    audioCtxRef.current = ctx

    // Fridge electrical hum — 60 Hz fundamental + 180 Hz harmonic
    const osc1 = ctx.createOscillator(); osc1.type = 'sawtooth'; osc1.frequency.value = 60
    const osc2 = ctx.createOscillator(); osc2.type = 'sine';     osc2.frequency.value = 180
    const lpf  = ctx.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = 400
    const gain = ctx.createGain(); gain.gain.value = 0
    fridgeGainRef.current = gain
    osc1.connect(lpf); osc2.connect(lpf)
    lpf.connect(gain); gain.connect(ctx.destination)
    osc1.start(); osc2.start()
  }, [])

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      audioCtxRef.current?.close()
    }
  }, [])

  // ── Screen shake ───────────────────────────────────────────────────────────
  const shakeRef        = useRef(0)           // current intensity
  const prevSignalRef   = useRef(shakeSignal)

  useEffect(() => {
    if (shakeSignal !== prevSignalRef.current) {
      prevSignalRef.current = shakeSignal
      shakeRef.current = 0.14
    }
  }, [shakeSignal])

  const [, getKeys] = useKeyboardControls<Keys>()

  // Unlock pointer when chat opens
  useEffect(() => {
    if (chatOpen && controlsRef.current?.isLocked) {
      controlsRef.current.unlock()
    }
  }, [chatOpen])

  // Bubble lock state up + init audio on first lock (user gesture = safe for AudioContext)
  useEffect(() => {
    const ref = controlsRef.current
    if (!ref) return
    const onLock   = () => { onLockedChange(true); initAudio() }
    const onUnlock = () => onLockedChange(false)
    ref.addEventListener('lock',   onLock)
    ref.addEventListener('unlock', onUnlock)
    return () => {
      ref.removeEventListener('lock',   onLock)
      ref.removeEventListener('unlock', onUnlock)
    }
  }, [onLockedChange, initAudio])

  useFrame((_, delta) => {
    const keys = getKeys()
    const ctx  = audioCtxRef.current

    if (!chatOpen && controlsRef.current?.isLocked) {
      // ── Movement ────────────────────────────────────────────────────────
      const moving = keys.forward || keys.backward || keys.left || keys.right
      if (moving) {
        camera.getWorldDirection(forwardVec.current)
        forwardVec.current.y = 0
        forwardVec.current.normalize()
        rightVec.current.crossVectors(forwardVec.current, UP.current)

        const speed = MOVE_SPEED * delta
        if (keys.forward)  camera.position.addScaledVector(forwardVec.current,  speed)
        if (keys.backward) camera.position.addScaledVector(forwardVec.current, -speed)
        if (keys.right)    camera.position.addScaledVector(rightVec.current,    speed)
        if (keys.left)     camera.position.addScaledVector(rightVec.current,   -speed)
      }

      // ── Footstep rhythm ─────────────────────────────────────────────────
      if (moving && ctx) {
        stepTimerRef.current -= delta
        if (stepTimerRef.current <= 0) {
          playFootstep(ctx)
          stepTimerRef.current = 0.38
        }
      } else if (!moving) {
        stepTimerRef.current = 0.1  // short delay before first step on fresh movement
      }

      // ── E key interaction ───────────────────────────────────────────────
      if (keys.interact && !interactPressed.current) {
        interactPressed.current = true

        let closestNPC: NPC | null = null
        let closestNPCDist = Infinity
        for (const npc of npcs) {
          const livePos = npcPositionsRef.current.get(npc.id)
          if (!livePos) continue
          _distVec.current.set(livePos.x, 1.7, livePos.z)
          const dist = camera.position.distanceTo(_distVec.current)
          if (dist < NPC_DIST && dist < closestNPCDist) {
            closestNPCDist = dist
            closestNPC = npc
          }
        }
        if (closestNPC) { onTalkToNPC(closestNPC.id); return }

        let closestItem: SupermarketItem | null = null
        let closestItemDist = Infinity
        for (const item of items) {
          if (collectedItemIds.includes(item.id)) continue
          const [x, , z] = item.position
          _distVec.current.set(x, 1.7, z)
          const dist = camera.position.distanceTo(_distVec.current)
          if (dist < ITEM_DIST && dist < closestItemDist) {
            closestItemDist = dist
            closestItem = item
          }
        }
        if (closestItem) onCollectItem(closestItem.id)
      }
      if (!keys.interact) interactPressed.current = false
    }

    // ── Floor lock + bounds ────────────────────────────────────────────────
    // Screen shake — applied on top of the locked y=1.7
    if (shakeRef.current > 0.001) {
      camera.position.y  = 1.7 + (Math.random() - 0.5) * shakeRef.current
      camera.position.x += (Math.random() - 0.5) * shakeRef.current * 0.35
      shakeRef.current   *= (1 - delta * 14)
    } else {
      camera.position.y = 1.7
    }
    camera.position.x = Math.max(BOUNDS.xMin, Math.min(BOUNDS.xMax, camera.position.x))
    camera.position.z = Math.max(BOUNDS.zMin, Math.min(BOUNDS.zMax, camera.position.z))

    // ── Fridge hum gain — fades in/out based on distance to refrigerators ─
    if (fridgeGainRef.current && ctx) {
      const distToFridge = Math.abs(camera.position.z - (-23.5))
      const targetGain = Math.max(0, 0.055 - distToFridge * 0.0032)
      fridgeGainRef.current.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.15)
    }
  })

  return <PointerLockControls ref={controlsRef} makeDefault />
}
