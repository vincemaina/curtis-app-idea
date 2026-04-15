'use client'

import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls, useKeyboardControls } from '@react-three/drei'
import * as THREE from 'three'
import type { NPC } from '@/lib/types'
import { getNPCPosition } from '@/lib/npc-positions'

type Keys = 'forward' | 'backward' | 'left' | 'right' | 'interact'

interface Props {
  npcs: NPC[]
  scenarioId: string
  chatOpen: boolean
  onTalkToNPC: (npcId: string) => void
  onLockedChange: (locked: boolean) => void
}

const MOVE_SPEED = 7          // units/second
const INTERACT_DIST = 5       // units
const BOUNDS = { xMin: -19, xMax: 19, zMin: -22, zMax: 22 }

export default function PlayerController({
  npcs,
  scenarioId,
  chatOpen,
  onTalkToNPC,
  onLockedChange,
}: Props) {
  // typed as any to avoid deep drei/three type import chain
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null)
  const interactPressed = useRef(false)
  const forwardVec = useRef(new THREE.Vector3())
  const rightVec = useRef(new THREE.Vector3())
  const UP = useRef(new THREE.Vector3(0, 1, 0))
  const { camera } = useThree()

  const [, getKeys] = useKeyboardControls<Keys>()

  // Unlock pointer when chat opens
  useEffect(() => {
    if (chatOpen && controlsRef.current?.isLocked) {
      controlsRef.current.unlock()
    }
  }, [chatOpen])

  // Notify parent of lock state changes
  useEffect(() => {
    const ref = controlsRef.current
    if (!ref) return
    const handleLock   = () => onLockedChange(true)
    const handleUnlock = () => onLockedChange(false)
    ref.addEventListener('lock',   handleLock)
    ref.addEventListener('unlock', handleUnlock)
    return () => {
      ref.removeEventListener('lock',   handleLock)
      ref.removeEventListener('unlock', handleUnlock)
    }
  }, [onLockedChange])

  useFrame((_, delta) => {
    if (chatOpen || !controlsRef.current?.isLocked) return

    const keys = getKeys()

    // --- Movement ---
    if (keys.forward || keys.backward || keys.left || keys.right) {
      // Project camera forward onto XZ plane so looking up/down doesn't fly
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

    // Lock to eye height
    camera.position.y = 1.7

    // Wall bounds
    camera.position.x = Math.max(BOUNDS.xMin, Math.min(BOUNDS.xMax, camera.position.x))
    camera.position.z = Math.max(BOUNDS.zMin, Math.min(BOUNDS.zMax, camera.position.z))

    // --- E-key interaction ---
    if (keys.interact && !interactPressed.current) {
      interactPressed.current = true

      let closestNpc: NPC | null = null
      let closestDist = Infinity

      for (const npc of npcs) {
        const [x, , z] = getNPCPosition(scenarioId, npc.id)
        const npcVec = new THREE.Vector3(x, 1.7, z)
        const dist = camera.position.distanceTo(npcVec)
        if (dist < INTERACT_DIST && dist < closestDist) {
          closestDist = dist
          closestNpc = npc
        }
      }

      if (closestNpc) onTalkToNPC(closestNpc.id)
    }
    if (!keys.interact) interactPressed.current = false
  })

  return <PointerLockControls ref={controlsRef} makeDefault />
}
