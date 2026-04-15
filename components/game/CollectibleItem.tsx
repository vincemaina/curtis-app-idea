'use client'

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { SupermarketItem } from '@/lib/supermarket-items'

const NEARBY_DIST = 2.8

interface Props {
  item: SupermarketItem
  collected: boolean
}

export default function CollectibleItem({ item, collected }: Props) {
  const meshRef  = useRef<THREE.Mesh>(null)
  const posVec   = useRef(new THREE.Vector3(...item.position))
  const nearRef  = useRef(false)
  const [isNear, setIsNear] = useState(false)

  useFrame(state => {
    if (collected || !meshRef.current) return

    // Gentle pulse scale
    const t = state.clock.elapsedTime
    const scale = 1 + Math.sin(t * 2.5) * 0.08
    meshRef.current.scale.setScalar(scale)

    // Slow spin
    meshRef.current.rotation.y = t * 0.8

    // Proximity to camera
    const dist = state.camera.position.distanceTo(posVec.current)
    const near = dist < NEARBY_DIST
    if (near !== nearRef.current) {
      nearRef.current = near
      setIsNear(near)
    }
  })

  if (collected) {
    // Leave a faint "taken" marker
    return (
      <mesh position={item.position}>
        <boxGeometry args={[0.22, 0.28, 0.22]} />
        <meshStandardMaterial color="#333" transparent opacity={0.25} />
      </mesh>
    )
  }

  return (
    <group position={item.position}>
      {/* Glow halo */}
      <mesh>
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshStandardMaterial
          color="#7c5cfc"
          emissive="#7c5cfc"
          emissiveIntensity={0.35}
          transparent
          opacity={0.25}
        />
      </mesh>

      {/* Item box */}
      <mesh ref={meshRef}>
        <boxGeometry args={[0.22, 0.28, 0.22]} />
        <meshStandardMaterial
          color="#e8d88a"
          emissive="#c4aa00"
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* Emoji + name label */}
      <Html position={[0, 0.55, 0]} center distanceFactor={6} zIndexRange={[0, 5]}>
        <div
          style={{
            background: isNear ? 'rgba(124,92,252,0.92)' : 'rgba(0,0,0,0.75)',
            color: '#fff',
            padding: '3px 9px',
            borderRadius: '7px',
            fontSize: '12px',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            border: isNear
              ? '1px solid rgba(200,180,255,0.6)'
              : '1px solid rgba(255,255,255,0.2)',
            pointerEvents: 'none',
            userSelect: 'none',
            lineHeight: 1.5,
            transition: 'background 0.2s',
          }}
        >
          {item.emoji} {item.name}
          {isNear && (
            <div style={{ fontSize: 11, color: '#d4b4ff', marginTop: 2 }}>
              Press E to pick up
            </div>
          )}
        </div>
      </Html>
    </group>
  )
}
