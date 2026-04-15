'use client'

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { NPC } from '@/lib/types'

const MOOD_COLORS: Record<string, string> = {
  friendly:  '#2ecc71',
  neutral:   '#95a5a6',
  busy:      '#f39c12',
  stressed:  '#e74c3c',
  sad:       '#3498db',
  confused:  '#e67e22',
}

const NPC_BODY_COLORS: Record<string, string> = {
  'store-employee':     '#1a6b3c',  // green uniform
  'couple':             '#8e44ad',  // purple casual
  'old-man':            '#c0392b',  // red cardigan
  'young-professional': '#2980b9',  // blue blazer
  'manager':            '#2c3e50',  // dark suit
  // underground
  'ticket-officer':     '#0d3b6e',
  'commuter':           '#555',
  'tourist':            '#27ae60',
  'busker':             '#8e44ad',
  'older-traveller':    '#c0392b',
  // party
  'extrovert':          '#e67e22',
  'colleague':          '#2980b9',
  'nervous-cousin':     '#7f8c8d',
  'parents-friend':     '#8e44ad',
  'sharp-friend':       '#c0392b',
}

const INTERACT_DISTANCE = 5

interface Props {
  npc: NPC
  position: [number, number, number]
  hasTalked: boolean
  chatOpen: boolean
}

export default function NPCCharacter({ npc, position, hasTalked, chatOpen }: Props) {
  const groupRef = useRef<THREE.Group>(null)
  const posVec = useRef(new THREE.Vector3(position[0], position[1], position[2]))
  const nearbyRef = useRef(false)
  const [isNearby, setIsNearby] = useState(false)

  useFrame(state => {
    if (!groupRef.current) return

    // Gentle idle bob
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.2 + position[0]) * 0.04

    // Slow turn toward player
    const toPlayer = new THREE.Vector3()
      .subVectors(state.camera.position, posVec.current)
    toPlayer.y = 0
    if (toPlayer.lengthSq() > 0.01) {
      const angle = Math.atan2(toPlayer.x, toPlayer.z)
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        angle,
        0.03,
      )
    }

    // Proximity check — only update React state on transitions
    const dist = state.camera.position.distanceTo(posVec.current)
    const nearby = dist < INTERACT_DISTANCE && !chatOpen
    if (nearby !== nearbyRef.current) {
      nearbyRef.current = nearby
      setIsNearby(nearby)
    }
  })

  const bodyColor = NPC_BODY_COLORS[npc.id] ?? '#555'
  const moodColor = MOOD_COLORS[npc.mood] ?? '#95a5a6'

  return (
    <group ref={groupRef} position={position}>
      {/* Floor shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.38, 16]} />
        <meshStandardMaterial color="#000" transparent opacity={0.25} />
      </mesh>

      {/* Legs */}
      {([-0.13, 0.13] as const).map(x => (
        <mesh key={x} position={[x, 0.45, 0]}>
          <cylinderGeometry args={[0.09, 0.09, 0.9, 8]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      ))}

      {/* Body */}
      <mesh position={[0, 1.15, 0]}>
        <cylinderGeometry args={[0.27, 0.31, 0.72, 10]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>

      {/* Arms */}
      <mesh position={[-0.42, 1.1, 0]} rotation={[0, 0, 0.5]}>
        <cylinderGeometry args={[0.07, 0.07, 0.6, 8]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      <mesh position={[0.42, 1.1, 0]} rotation={[0, 0, -0.5]}>
        <cylinderGeometry args={[0.07, 0.07, 0.6, 8]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>

      {/* Neck */}
      <mesh position={[0, 1.58, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.16, 8]} />
        <meshStandardMaterial color="#f0c8a0" />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.85, 0]}>
        <sphereGeometry args={[0.24, 12, 12]} />
        <meshStandardMaterial color="#f0c8a0" />
      </mesh>

      {/* Eyes */}
      {([-0.09, 0.09] as const).map(x => (
        <mesh key={x} position={[x, 1.88, 0.21]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      ))}

      {/* Mood dot above head */}
      <mesh position={[0, 2.26, 0]}>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshStandardMaterial color={moodColor} emissive={moodColor} emissiveIntensity={0.7} />
      </mesh>

      {/* HTML label */}
      <Html position={[0, 2.7, 0]} center distanceFactor={8} zIndexRange={[0, 10]}>
        <div
          style={{
            background: isNearby ? 'rgba(124,92,252,0.92)' : 'rgba(0,0,0,0.72)',
            color: '#fff',
            padding: '4px 10px',
            borderRadius: '7px',
            fontSize: '13px',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            border: isNearby
              ? '1px solid rgba(200,180,255,0.6)'
              : '1px solid rgba(255,255,255,0.18)',
            pointerEvents: 'none',
            userSelect: 'none',
            lineHeight: 1.4,
            transition: 'background 0.2s, border 0.2s',
          }}
        >
          {npc.avatarEmoji} {npc.name}
          {hasTalked && (
            <span style={{ color: '#90ee90', marginLeft: 5 }}>✓</span>
          )}
          {isNearby && (
            <div style={{ fontSize: 11, color: '#d4b4ff', marginTop: 2 }}>
              Press E to talk
            </div>
          )}
        </div>
      </Html>
    </group>
  )
}
