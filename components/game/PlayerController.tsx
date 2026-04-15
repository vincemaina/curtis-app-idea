'use client'

import { useEffect, useRef } from 'react'
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
  npcPositionsRef: React.MutableRefObject<Map<string, THREE.Vector3>>
  onTalkToNPC: (npcId: string) => void
  onCollectItem: (itemId: string) => void
  onLockedChange: (locked: boolean) => void
}

const MOVE_SPEED     = 7
const NPC_DIST       = 4.5
const ITEM_DIST      = 2.8
const BOUNDS = { xMin: -19, xMax: 19, zMin: -22, zMax: 22 }

export default function PlayerController({
  npcs,
  items,
  collectedItemIds,
  chatOpen,
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
  const _distVec        = useRef(new THREE.Vector3())  // reused — no per-frame allocs
  const { camera }      = useThree()

  const [, getKeys] = useKeyboardControls<Keys>()

  // Unlock pointer when chat opens
  useEffect(() => {
    if (chatOpen && controlsRef.current?.isLocked) {
      controlsRef.current.unlock()
    }
  }, [chatOpen])

  // Bubble lock state up to parent
  useEffect(() => {
    const ref = controlsRef.current
    if (!ref) return
    const onLock   = () => onLockedChange(true)
    const onUnlock = () => onLockedChange(false)
    ref.addEventListener('lock',   onLock)
    ref.addEventListener('unlock', onUnlock)
    return () => {
      ref.removeEventListener('lock',   onLock)
      ref.removeEventListener('unlock', onUnlock)
    }
  }, [onLockedChange])

  useFrame((_, delta) => {
    if (chatOpen || !controlsRef.current?.isLocked) return

    const keys = getKeys()

    // ── Movement ──────────────────────────────────────────────────
    if (keys.forward || keys.backward || keys.left || keys.right) {
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

    // Lock to floor / eye height, clamp to store bounds
    camera.position.y = 1.7
    camera.position.x = Math.max(BOUNDS.xMin, Math.min(BOUNDS.xMax, camera.position.x))
    camera.position.z = Math.max(BOUNDS.zMin, Math.min(BOUNDS.zMax, camera.position.z))

    // ── E key interaction ─────────────────────────────────────────
    if (keys.interact && !interactPressed.current) {
      interactPressed.current = true

      // 1. NPCs take priority — use live positions so moving NPCs are interactable
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
      if (closestNPC) {
        onTalkToNPC(closestNPC.id)
        return
      }

      // 2. Collectible items (tighter radius — need to be right in front)
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
  })

  return <PointerLockControls ref={controlsRef} makeDefault />
}
