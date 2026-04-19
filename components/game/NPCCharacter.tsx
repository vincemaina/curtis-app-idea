'use client'

import { useRef, useState, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { NPC } from '@/lib/types'
import { NPC_PATROLS, NPC_SPEEDS } from '@/lib/npc-positions'

// ── PBR material hooks ────────────────────────────────────────────────────────

function useSkinMaterial(skinColor: string) {
  return useMemo(() => {
    const col = new THREE.Color(skinColor)
    return new THREE.MeshPhysicalMaterial({
      color: col,
      roughness: 0.76,
      metalness: 0,
      sheen: 0.28,
      sheenRoughness: 0.88,
      sheenColor: col.clone().lerp(new THREE.Color('#e07050'), 0.22),
    })
  }, [skinColor])
}

function useHairMaterial(hairColor: string) {
  return useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(hairColor),
    roughness: 0.95,
    metalness: 0,
  }), [hairColor])
}

function useClothingMaterial(bodyColor: string) {
  return useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(bodyColor),
    roughness: 0.84,
    metalness: 0.04,
  }), [bodyColor])
}

// ── Colour maps ───────────────────────────────────────────────────────────────
const MOOD_COLORS: Record<string, string> = {
  friendly: '#2ecc71', neutral: '#95a5a6', busy: '#f39c12',
  stressed: '#e74c3c', sad: '#3498db',    confused: '#e67e22',
}
const NPC_BODY_COLORS: Record<string, string> = {
  'store-employee':     '#1a6b3c',
  'couple':             '#8e44ad',
  'old-man':            '#c0392b',
  'young-professional': '#2980b9',
  'manager':            '#2c3e50',
  'ticket-officer':     '#0d3b6e',
  'regular-commuter':   '#3d5a80',
  'tourist':            '#27ae60',
  'busker':             '#8e44ad',
  'lost-older-woman':   '#c0392b',
  'extrovert-friend':   '#e67e22',
  'work-colleague':     '#2980b9',
  'alexs-cousin':       '#7f8c8d',
  'alexs-mum':          '#8e44ad',
  'confident-stranger': '#c0392b',
  'quiet-garden-friend':'#34495e',
  'loud-neighbour':     '#e91e8c',
  'alexs-sibling':      '#27ae60',
}

// ── Behaviour state machine ───────────────────────────────────────────────────
type NPCState = 'patrolling' | 'idle' | 'facing_player' | 'moving_to_target'

interface Behavior {
  state: NPCState
  prevState: NPCState
  waypointIndex: number
  idleTimer: number
  hasTarget: boolean
  target: THREE.Vector3
  fidgetCooldown: number
}

interface Fidget {
  type: 'look' | 'arm'
  progress: number
  speed: number
  angle: number
  side: 'L' | 'R'
}

const APPROACH_DIST = 4.8
const RESUME_DIST   = 6.2
const ARRIVE_THRESH = 0.25

interface MoveStyle {
  idleMin: number; idleMax: number; turnLerp: number; erratic: boolean
}
const MOVE_STYLE: Record<string, MoveStyle> = {
  stressed: { idleMin: 0.05, idleMax: 0.15, turnLerp: 24, erratic: true  },
  busy:     { idleMin: 0.1,  idleMax: 0.35, turnLerp: 14, erratic: false },
  neutral:  { idleMin: 0.6,  idleMax: 1.8,  turnLerp:  8, erratic: false },
  friendly: { idleMin: 1.0,  idleMax: 2.5,  turnLerp:  6, erratic: false },
  confused: { idleMin: 0.5,  idleMax: 1.5,  turnLerp:  7, erratic: false },
  sad:      { idleMin: 1.2,  idleMax: 3.0,  turnLerp:  5, erratic: false },
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  npc: NPC
  scenarioId: string
  initialPosition: [number, number, number]
  hasTalked: boolean
  chatOpen: boolean
  isSpeaking: boolean
  targetOverride: [number, number, number] | null
  npcPositionsRef: React.MutableRefObject<Map<string, THREE.Vector3>>
  onTargetReached: () => void
  onProximityEnter?: () => void
}

export default function NPCCharacter({
  npc,
  scenarioId,
  initialPosition,
  hasTalked,
  chatOpen,
  isSpeaking,
  targetOverride,
  npcPositionsRef,
  onTargetReached,
  onProximityEnter,
}: Props) {
  // ── Refs ──────────────────────────────────────────────────────────────────
  const groupRef  = useRef<THREE.Group>(null)
  const meshRef   = useRef<THREE.Group>(null)
  const bodyRef   = useRef<THREE.Mesh>(null)
  const headRef   = useRef<THREE.Group>(null)
  const legLRef   = useRef<THREE.Group>(null)
  const legRRef   = useRef<THREE.Group>(null)
  const armLRef   = useRef<THREE.Group>(null)
  const armRRef   = useRef<THREE.Group>(null)

  // Facial animation
  const jawRef      = useRef<THREE.Group>(null)
  const eyelidLRef  = useRef<THREE.Mesh>(null)
  const eyelidRRef  = useRef<THREE.Mesh>(null)
  const eyeLRef     = useRef<THREE.Group>(null)
  const eyeRRef     = useRef<THREE.Group>(null)

  const blinkTimerRef    = useRef(1.5 + Math.random() * 3)
  const blinkProgressRef = useRef(0)

  const fidgetRef    = useRef<Fidget | null>(null)
  const walkPhaseRef = useRef(0)
  const swingRef     = useRef(0)
  const posRef       = useRef(new THREE.Vector3(initialPosition[0], 0, initialPosition[2]))
  const facingRef    = useRef(0)

  const waypoints = NPC_PATROLS[scenarioId]?.[npc.id] ?? []
  const speed     = NPC_SPEEDS[scenarioId]?.[npc.id] ?? 1.0

  const beh = useRef<Behavior>({
    state:          waypoints.length > 0 ? 'patrolling' : 'idle',
    prevState:      'patrolling',
    waypointIndex:  0,
    idleTimer:      0,
    hasTarget:      false,
    target:         new THREE.Vector3(),
    fidgetCooldown: 3 + Math.random() * 4,
  })

  useEffect(() => {
    npcPositionsRef.current.set(npc.id, posRef.current)
    return () => { npcPositionsRef.current.delete(npc.id) }
  }, [npc.id, npcPositionsRef])

  useEffect(() => {
    if (targetOverride) {
      beh.current.hasTarget = true
      beh.current.target.set(targetOverride[0], 0, targetOverride[2])
      if (beh.current.state !== 'facing_player') {
        beh.current.prevState = 'patrolling'
        beh.current.state = 'moving_to_target'
      }
    } else {
      beh.current.hasTarget = false
      if (beh.current.state === 'moving_to_target') beh.current.state = 'patrolling'
    }
  }, [targetOverride])

  const isNearRef         = useRef(false)
  const [isNear, setIsNear] = useState(false)
  const proximityFiredRef = useRef(false)

  const style         = MOVE_STYLE[npc.mood] ?? MOVE_STYLE.neutral
  const panicTimerRef = useRef(0.4 + Math.random() * 0.8)
  const _toTarget     = useRef(new THREE.Vector3())
  const _toPlayer     = useRef(new THREE.Vector3())

  // ── Derived appearance values ─────────────────────────────────────────────
  const bodyColor  = NPC_BODY_COLORS[npc.id] ?? '#555'
  const moodColor  = MOOD_COLORS[npc.mood]   ?? '#95a5a6'
  const skinColor  = npc.skinTone  ?? '#f0c8a0'
  const hairColor  = npc.hairColor ?? '#2c1a0e'
  const hairStyle  = npc.hairStyle ?? (npc.gender === 'female' ? 'long' : 'short')

  const skinMat     = useSkinMaterial(skinColor)
  const hairMat     = useHairMaterial(hairColor)
  const clothingMat = useClothingMaterial(bodyColor)

  const lipColor = useMemo(
    () => new THREE.Color(skinColor).lerp(new THREE.Color('#c06050'), 0.35).getStyle(),
    [skinColor],
  )

  const irisColor = useMemo(() => {
    const seed = npc.id.charCodeAt(0) % 4
    return ['#4a7ab5', '#6b4226', '#3a7a4a', '#7a6b3a'][seed]
  }, [npc.id])

  // ── Per-frame logic ───────────────────────────────────────────────────────
  useFrame((state, delta) => {
    const b   = beh.current
    const cam = state.camera
    const t   = state.clock.elapsedTime

    const distToPlayer = cam.position.distanceTo(posRef.current)
    const playerNear   = distToPlayer < APPROACH_DIST && !chatOpen
    const playerFar    = distToPlayer > RESUME_DIST

    if (playerNear !== isNearRef.current) {
      isNearRef.current = playerNear
      setIsNear(playerNear)
      if (playerNear && !proximityFiredRef.current) {
        proximityFiredRef.current = true
        onProximityEnter?.()
      }
    }

    if (playerNear && b.state !== 'facing_player') {
      b.prevState = b.state; b.state = 'facing_player'
    } else if (!playerNear && playerFar && b.state === 'facing_player') {
      b.state = b.hasTarget ? 'moving_to_target' : (waypoints.length > 0 ? b.prevState : 'idle')
    }

    let moved = false

    switch (b.state) {
      case 'patrolling': {
        if (waypoints.length === 0) { b.state = 'idle'; break }
        if (style.erratic) {
          panicTimerRef.current -= delta
          if (panicTimerRef.current <= 0) {
            panicTimerRef.current = 0.5 + Math.random() * 1.2
            b.waypointIndex = (b.waypointIndex + 1 + Math.floor(Math.random() * (waypoints.length - 1))) % waypoints.length
          }
        }
        const wp = waypoints[b.waypointIndex]
        _toTarget.current.set(wp[0], 0, wp[2]).sub(posRef.current)
        const dist = _toTarget.current.length()
        if (dist < ARRIVE_THRESH) {
          b.waypointIndex = (b.waypointIndex + 1) % waypoints.length
          b.idleTimer     = style.idleMin + Math.random() * (style.idleMax - style.idleMin)
          b.state         = 'idle'
        } else {
          const step = Math.min(speed * delta, dist)
          _toTarget.current.normalize().multiplyScalar(step)
          posRef.current.add(_toTarget.current)
          facingRef.current = Math.atan2(_toTarget.current.x, _toTarget.current.z)
          moved = true
        }
        break
      }
      case 'idle': {
        b.idleTimer -= delta
        if (b.idleTimer <= 0 && waypoints.length > 0) b.state = 'patrolling'
        break
      }
      case 'facing_player': {
        _toPlayer.current.copy(cam.position).sub(posRef.current).setY(0)
        if (_toPlayer.current.lengthSq() > 0.01) {
          const target = Math.atan2(_toPlayer.current.x, _toPlayer.current.z)
          facingRef.current = lerpAngle(facingRef.current, target, style.turnLerp * 0.5 * delta)
        }
        break
      }
      case 'moving_to_target': {
        _toTarget.current.copy(beh.current.target).sub(posRef.current)
        const dist = _toTarget.current.length()
        if (dist < ARRIVE_THRESH + 0.4) {
          b.hasTarget = false
          b.state     = waypoints.length > 0 ? 'patrolling' : 'idle'
          onTargetReached()
        } else {
          const step = Math.min(speed * 1.2 * delta, dist)
          _toTarget.current.normalize().multiplyScalar(step)
          posRef.current.add(_toTarget.current)
          facingRef.current = Math.atan2(_toTarget.current.x, _toTarget.current.z)
          moved = true
        }
        break
      }
    }

    if (!groupRef.current || !meshRef.current) return

    groupRef.current.position.x = posRef.current.x
    groupRef.current.position.z = posRef.current.z
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y, facingRef.current, style.turnLerp * delta,
    )

    const bobAmp  = moved ? 0.055 : 0.025
    const bobFreq = moved ? 3.5   : 1.5
    meshRef.current.position.y = Math.sin(t * bobFreq + initialPosition[0]) * bobAmp

    if (moved) {
      walkPhaseRef.current += delta * 5.5
      swingRef.current = THREE.MathUtils.lerp(swingRef.current, Math.sin(walkPhaseRef.current) * 0.52, 18 * delta)
    } else {
      swingRef.current = THREE.MathUtils.lerp(swingRef.current, 0, 9 * delta)
    }
    const sw = swingRef.current
    if (legLRef.current) legLRef.current.rotation.x =  sw
    if (legRRef.current) legRRef.current.rotation.x = -sw
    if (armLRef.current) armLRef.current.rotation.x = -sw * 0.42
    if (armRRef.current) armRRef.current.rotation.x =  sw * 0.42

    if (b.state === 'idle' && !moved) {
      b.fidgetCooldown -= delta
      if (b.fidgetCooldown <= 0 && !fidgetRef.current) {
        b.fidgetCooldown = 4 + Math.random() * 5
        const type = Math.random() < 0.55 ? 'look' : 'arm'
        fidgetRef.current = {
          type, progress: 0, speed: 1 / 2.2,
          angle: type === 'look'
            ? (Math.random() < 0.5 ? 1 : -1) * (0.25 + Math.random() * 0.3)
            : -(0.6 + Math.random() * 0.4),
          side: Math.random() < 0.5 ? 'L' : 'R',
        }
      }
    } else {
      if (fidgetRef.current) fidgetRef.current = null
    }

    if (fidgetRef.current) {
      const f = fidgetRef.current
      f.progress += delta * f.speed
      if (f.progress >= 1) {
        fidgetRef.current = null
        if (headRef.current) headRef.current.rotation.y = 0
        if (armLRef.current) armLRef.current.rotation.x = 0
        if (armRRef.current) armRRef.current.rotation.x = 0
      } else {
        const envelope = Math.sin(f.progress * Math.PI)
        if (f.type === 'look' && headRef.current) {
          headRef.current.rotation.y = f.angle * envelope
        } else if (f.type === 'arm') {
          const target = f.side === 'L' ? armLRef.current : armRRef.current
          if (target) target.rotation.x = f.angle * envelope
        }
      }
    } else if (b.state !== 'idle') {
      if (headRef.current) headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, 0, 8 * delta)
    }

    if (bodyRef.current) {
      const bAmp  = moved ? 0.005 : 0.022
      const bFreq = moved ? 3.5   : 0.9
      bodyRef.current.scale.y = 1 + Math.sin(t * bFreq + initialPosition[0] * 0.7) * bAmp
    }

    // ── Blinking ──────────────────────────────────────────────────────────
    blinkTimerRef.current -= delta
    if (blinkTimerRef.current <= 0 && blinkProgressRef.current === 0) {
      blinkProgressRef.current = 0.001
      blinkTimerRef.current = 2.5 + Math.random() * 4.5
    }
    if (blinkProgressRef.current > 0) {
      blinkProgressRef.current = Math.min(1, blinkProgressRef.current + delta * 8)
      const lidDrop = Math.sin(blinkProgressRef.current * Math.PI) * 0.046
      if (eyelidLRef.current) eyelidLRef.current.position.y = -lidDrop
      if (eyelidRRef.current) eyelidRRef.current.position.y = -lidDrop
      if (blinkProgressRef.current >= 1) blinkProgressRef.current = 0
    }

    // ── Lip sync ──────────────────────────────────────────────────────────
    if (jawRef.current) {
      const targetOpen = isSpeaking
        ? Math.max(0,
            Math.sin(t * 9.1  + initialPosition[0]) * 0.45 +
            Math.sin(t * 14.3 + initialPosition[2]) * 0.35 +
            Math.sin(t * 4.7) * 0.20,
          ) * 0.042
        : 0
      jawRef.current.position.y = THREE.MathUtils.lerp(jawRef.current.position.y, -targetOpen, 14 * delta)
    }

    // ── Eye gaze drift toward player ──────────────────────────────────────
    if (eyeLRef.current && eyeRRef.current) {
      let gazeX = 0, gazeY = 0
      if (playerNear) {
        _toPlayer.current.copy(cam.position).sub(posRef.current)
        gazeX = THREE.MathUtils.clamp(_toPlayer.current.x * 0.04, -0.025, 0.025)
        gazeY = THREE.MathUtils.clamp((_toPlayer.current.y - 1.7) * 0.04, -0.02, 0.02)
      }
      eyeLRef.current.position.x = THREE.MathUtils.lerp(eyeLRef.current.position.x, -0.075 + gazeX, 4 * delta)
      eyeLRef.current.position.y = THREE.MathUtils.lerp(eyeLRef.current.position.y,  0.245 + gazeY, 4 * delta)
      eyeRRef.current.position.x = THREE.MathUtils.lerp(eyeRRef.current.position.x,  0.075 + gazeX, 4 * delta)
      eyeRRef.current.position.y = THREE.MathUtils.lerp(eyeRRef.current.position.y,  0.245 + gazeY, 4 * delta)
    }
  })

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <group ref={groupRef}>
      {/* Floor shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.38, 10]} />
        <meshStandardMaterial color="#000" transparent opacity={0.2} />
      </mesh>

      <group ref={meshRef}>
        {/* ── Legs ─────────────────────────────────────────────────── */}
        <group ref={legLRef} position={[-0.13, 0.92, 0]}>
          <mesh position={[0, -0.23, 0]} castShadow>
            <cylinderGeometry args={[0.09, 0.085, 0.46, 10]} />
            <primitive object={clothingMat} attach="material" />
          </mesh>
          <mesh position={[0, -0.62, 0.01]} castShadow>
            <cylinderGeometry args={[0.078, 0.065, 0.38, 10]} />
            <primitive object={clothingMat} attach="material" />
          </mesh>
          <mesh position={[0, -0.845, 0.07]}>
            <boxGeometry args={[0.13, 0.09, 0.26]} />
            <meshStandardMaterial color="#111" roughness={0.9} />
          </mesh>
        </group>

        <group ref={legRRef} position={[0.13, 0.92, 0]}>
          <mesh position={[0, -0.23, 0]} castShadow>
            <cylinderGeometry args={[0.09, 0.085, 0.46, 10]} />
            <primitive object={clothingMat} attach="material" />
          </mesh>
          <mesh position={[0, -0.62, 0.01]} castShadow>
            <cylinderGeometry args={[0.078, 0.065, 0.38, 10]} />
            <primitive object={clothingMat} attach="material" />
          </mesh>
          <mesh position={[0, -0.845, 0.07]}>
            <boxGeometry args={[0.13, 0.09, 0.26]} />
            <meshStandardMaterial color="#111" roughness={0.9} />
          </mesh>
        </group>

        {/* ── Torso ─────────────────────────────────────────────────── */}
        <mesh ref={bodyRef} position={[0, 1.16, 0]} castShadow>
          <cylinderGeometry args={[0.24, 0.29, 0.70, 14]} />
          <primitive object={clothingMat} attach="material" />
        </mesh>
        {/* Shoulder pads */}
        <mesh position={[-0.33, 1.48, 0]}>
          <sphereGeometry args={[0.105, 8, 6]} />
          <primitive object={clothingMat} attach="material" />
        </mesh>
        <mesh position={[0.33, 1.48, 0]}>
          <sphereGeometry args={[0.105, 8, 6]} />
          <primitive object={clothingMat} attach="material" />
        </mesh>

        {/* ── Arms ──────────────────────────────────────────────────── */}
        <group ref={armLRef} position={[-0.38, 1.46, 0]}>
          <mesh position={[-0.04, -0.22, 0]} rotation={[0, 0, 0.32]} castShadow>
            <cylinderGeometry args={[0.072, 0.064, 0.44, 10]} />
            <primitive object={clothingMat} attach="material" />
          </mesh>
          <mesh position={[-0.08, -0.52, 0]} rotation={[0, 0, 0.22]} castShadow>
            <cylinderGeometry args={[0.058, 0.048, 0.36, 10]} />
            <primitive object={skinMat} attach="material" />
          </mesh>
          <mesh position={[-0.13, -0.72, 0]}>
            <sphereGeometry args={[0.066, 8, 7]} />
            <primitive object={skinMat} attach="material" />
          </mesh>
        </group>

        <group ref={armRRef} position={[0.38, 1.46, 0]}>
          <mesh position={[0.04, -0.22, 0]} rotation={[0, 0, -0.32]} castShadow>
            <cylinderGeometry args={[0.072, 0.064, 0.44, 10]} />
            <primitive object={clothingMat} attach="material" />
          </mesh>
          <mesh position={[0.08, -0.52, 0]} rotation={[0, 0, -0.22]} castShadow>
            <cylinderGeometry args={[0.058, 0.048, 0.36, 10]} />
            <primitive object={skinMat} attach="material" />
          </mesh>
          <mesh position={[0.13, -0.72, 0]}>
            <sphereGeometry args={[0.066, 8, 7]} />
            <primitive object={skinMat} attach="material" />
          </mesh>
        </group>

        {/* ── Head group ────────────────────────────────────────────── */}
        <group ref={headRef} position={[0, 1.67, 0]}>
          {/* Neck */}
          <mesh position={[0, -0.08, 0]}>
            <cylinderGeometry args={[0.095, 0.105, 0.17, 10]} />
            <primitive object={skinMat} attach="material" />
          </mesh>

          {/* Head — slightly non-spherical */}
          <mesh position={[0, 0.20, 0]} scale={[1, 1.08, 0.94]} castShadow>
            <sphereGeometry args={[0.225, 16, 14]} />
            <primitive object={skinMat} attach="material" />
          </mesh>

          {/* ── Eyes ── */}
          <group ref={eyeLRef} position={[-0.075, 0.245, 0]}>
            {/* Sclera */}
            <mesh position={[0, 0, 0.195]}>
              <sphereGeometry args={[0.040, 10, 9]} />
              <meshPhysicalMaterial color="#f0ede8" roughness={0.1} metalness={0} clearcoat={0.5} />
            </mesh>
            {/* Iris */}
            <mesh position={[0, 0, 0.228]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.022, 0.022, 0.006, 12]} />
              <meshStandardMaterial color={irisColor} roughness={0.2} />
            </mesh>
            {/* Pupil */}
            <mesh position={[0, 0, 0.233]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 0.005, 10]} />
              <meshStandardMaterial color="#0a0a0a" roughness={0.1} />
            </mesh>
            {/* Specular highlight */}
            <mesh position={[0.009, 0.009, 0.235]}>
              <sphereGeometry args={[0.005, 6, 5]} />
              <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={1.2} />
            </mesh>
            {/* Eyelid — slides down on blink */}
            <mesh ref={eyelidLRef} position={[0, 0.022, 0.196]}>
              <boxGeometry args={[0.078, 0.034, 0.018]} />
              <primitive object={skinMat} attach="material" />
            </mesh>
          </group>

          <group ref={eyeRRef} position={[0.075, 0.245, 0]}>
            <mesh position={[0, 0, 0.195]}>
              <sphereGeometry args={[0.040, 10, 9]} />
              <meshPhysicalMaterial color="#f0ede8" roughness={0.1} metalness={0} clearcoat={0.5} />
            </mesh>
            <mesh position={[0, 0, 0.228]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.022, 0.022, 0.006, 12]} />
              <meshStandardMaterial color={irisColor} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0, 0.233]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 0.005, 10]} />
              <meshStandardMaterial color="#0a0a0a" roughness={0.1} />
            </mesh>
            <mesh position={[0.009, 0.009, 0.235]}>
              <sphereGeometry args={[0.005, 6, 5]} />
              <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={1.2} />
            </mesh>
            <mesh ref={eyelidRRef} position={[0, 0.022, 0.196]}>
              <boxGeometry args={[0.078, 0.034, 0.018]} />
              <primitive object={skinMat} attach="material" />
            </mesh>
          </group>

          {/* ── Eyebrows (mood-driven angle) ── */}
          {([-0.075, 0.075] as const).map((x, i) => {
            const browZ =
              npc.mood === 'stressed' || npc.mood === 'confused' ? (x < 0 ?  0.30 : -0.30) :
              npc.mood === 'friendly'                            ? (x < 0 ? -0.15 :  0.15) :
              npc.mood === 'sad'                                 ? (x < 0 ? -0.25 :  0.25) : 0
            return (
              <mesh key={i} position={[x, 0.315, 0.196]} rotation={[0.18, 0, browZ]}>
                <boxGeometry args={[0.058, 0.014, 0.012]} />
                <meshStandardMaterial color={hairColor} roughness={0.9} />
              </mesh>
            )
          })}

          {/* ── Nose ── */}
          <mesh position={[0, 0.14, 0.228]} scale={[1, 1.1, 0.6]}>
            <sphereGeometry args={[0.028, 8, 6]} />
            <primitive object={skinMat} attach="material" />
          </mesh>
          <mesh position={[-0.018, 0.128, 0.228]}>
            <sphereGeometry args={[0.013, 6, 5]} />
            <primitive object={skinMat} attach="material" />
          </mesh>
          <mesh position={[0.018, 0.128, 0.228]}>
            <sphereGeometry args={[0.013, 6, 5]} />
            <primitive object={skinMat} attach="material" />
          </mesh>

          {/* ── Mouth ── */}
          <group position={[0, 0.078, 0.218]}>
            {/* Upper lip */}
            <mesh position={[0, 0.012, 0.004]}>
              <boxGeometry args={[0.068, 0.020, 0.012]} />
              <meshPhysicalMaterial color={lipColor} roughness={0.55} metalness={0} />
            </mesh>
            {/* Lower lip / jaw — animated for lip sync */}
            <group ref={jawRef}>
              <mesh position={[0, -0.014, 0.002]}>
                <boxGeometry args={[0.072, 0.018, 0.013]} />
                <meshPhysicalMaterial color={lipColor} roughness={0.55} metalness={0} />
              </mesh>
              {/* Mouth interior — visible when jaw drops */}
              <mesh position={[0, 0.001, -0.004]}>
                <boxGeometry args={[0.054, 0.020, 0.010]} />
                <meshStandardMaterial color="#2a0808" roughness={1} />
              </mesh>
            </group>
            {/* Mood corners */}
            {npc.mood === 'friendly' && (
              <>
                <mesh position={[-0.038, 0.004, 0.006]} rotation={[0, 0,  0.5]}>
                  <boxGeometry args={[0.022, 0.010, 0.010]} />
                  <meshPhysicalMaterial color={lipColor} roughness={0.55} />
                </mesh>
                <mesh position={[ 0.038, 0.004, 0.006]} rotation={[0, 0, -0.5]}>
                  <boxGeometry args={[0.022, 0.010, 0.010]} />
                  <meshPhysicalMaterial color={lipColor} roughness={0.55} />
                </mesh>
              </>
            )}
            {npc.mood === 'sad' && (
              <>
                <mesh position={[-0.038, -0.006, 0.006]} rotation={[0, 0, -0.5]}>
                  <boxGeometry args={[0.022, 0.010, 0.010]} />
                  <meshPhysicalMaterial color={lipColor} roughness={0.55} />
                </mesh>
                <mesh position={[ 0.038, -0.006, 0.006]} rotation={[0, 0,  0.5]}>
                  <boxGeometry args={[0.022, 0.010, 0.010]} />
                  <meshPhysicalMaterial color={lipColor} roughness={0.55} />
                </mesh>
              </>
            )}
          </group>

          {/* ── Hair ── */}
          {hairStyle !== 'bald' && (
            <group position={[0, 0.20, 0]}>
              {/* Base cap */}
              <mesh position={[0, 0.115, 0]}>
                <sphereGeometry args={[0.232, 14, 10, 0, Math.PI * 2, 0,
                  hairStyle === 'afro' ? Math.PI * 0.72 : Math.PI * 0.54,
                ]} />
                <primitive object={hairMat} attach="material" />
              </mesh>
              {/* Hairline fringe */}
              <mesh position={[0, 0.06, 0.205]} rotation={[0.35, 0, 0]}>
                <boxGeometry args={[0.30, 0.055, 0.022]} />
                <primitive object={hairMat} attach="material" />
              </mesh>
              {/* Temple pieces */}
              <mesh position={[-0.21, 0.04, 0.10]} rotation={[0, 0.4, 0]}>
                <boxGeometry args={[0.04, 0.14, 0.09]} />
                <primitive object={hairMat} attach="material" />
              </mesh>
              <mesh position={[0.21, 0.04, 0.10]} rotation={[0, -0.4, 0]}>
                <boxGeometry args={[0.04, 0.14, 0.09]} />
                <primitive object={hairMat} attach="material" />
              </mesh>

              {hairStyle === 'afro' && (
                <mesh position={[0, 0.13, 0]}>
                  <sphereGeometry args={[0.31, 12, 9]} />
                  <primitive object={hairMat} attach="material" />
                </mesh>
              )}

              {(hairStyle === 'long' || hairStyle === 'wavy' || hairStyle === 'ponytail') && (
                <>
                  <mesh position={[0, -0.08, -0.14]} rotation={[0.10, 0, 0]}>
                    <boxGeometry args={[
                      hairStyle === 'ponytail' ? 0.28 : 0.38,
                      hairStyle === 'long' ? 0.62 : hairStyle === 'ponytail' ? 0.22 : 0.40,
                      0.10,
                    ]} />
                    <primitive object={hairMat} attach="material" />
                  </mesh>
                  {hairStyle !== 'ponytail' && (
                    <>
                      <mesh position={[-0.215, -0.05, 0.02]} rotation={[0, 0, 0.20]}>
                        <boxGeometry args={[0.09, 0.46, 0.11]} />
                        <primitive object={hairMat} attach="material" />
                      </mesh>
                      <mesh position={[0.215, -0.05, 0.02]} rotation={[0, 0, -0.20]}>
                        <boxGeometry args={[0.09, 0.46, 0.11]} />
                        <primitive object={hairMat} attach="material" />
                      </mesh>
                    </>
                  )}
                  {hairStyle === 'ponytail' && (
                    <>
                      <mesh position={[0, 0.06, -0.23]}>
                        <torusGeometry args={[0.052, 0.014, 6, 10]} />
                        <meshStandardMaterial color="#222" roughness={0.9} />
                      </mesh>
                      <mesh position={[0, -0.12, -0.28]} rotation={[-0.28, 0, 0]}>
                        <cylinderGeometry args={[0.048, 0.030, 0.48, 8]} />
                        <primitive object={hairMat} attach="material" />
                      </mesh>
                    </>
                  )}
                </>
              )}

              {hairStyle === 'medium' && (
                <>
                  <mesh position={[-0.195, 0.08, 0.02]} rotation={[0, 0, 0.22]}>
                    <sphereGeometry args={[0.115, 8, 7, 0, Math.PI * 2, 0, Math.PI * 0.65]} />
                    <primitive object={hairMat} attach="material" />
                  </mesh>
                  <mesh position={[0.195, 0.08, 0.02]} rotation={[0, 0, -0.22]}>
                    <sphereGeometry args={[0.115, 8, 7, 0, Math.PI * 2, 0, Math.PI * 0.65]} />
                    <primitive object={hairMat} attach="material" />
                  </mesh>
                  <mesh position={[0, 0.05, -0.13]}>
                    <boxGeometry args={[0.36, 0.20, 0.10]} />
                    <primitive object={hairMat} attach="material" />
                  </mesh>
                </>
              )}
            </group>
          )}

          {/* Mood dot */}
          <mesh position={[0, 0.64, 0]}>
            <sphereGeometry args={[0.08, 8, 7]} />
            <meshStandardMaterial color={moodColor} emissive={moodColor} emissiveIntensity={1.1} />
          </mesh>
        </group>
      </group>

      {/* HTML label */}
      <Html position={[0, 2.82, 0]} center distanceFactor={8} zIndexRange={[0, 10]}>
        <div
          style={{
            background: isNear ? 'rgba(124,92,252,0.92)' : 'rgba(0,0,0,0.72)',
            color: '#fff',
            padding: '4px 10px',
            borderRadius: '7px',
            fontSize: '13px',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            border: isNear
              ? '1px solid rgba(200,180,255,0.6)'
              : '1px solid rgba(255,255,255,0.18)',
            pointerEvents: 'none',
            userSelect: 'none',
            lineHeight: 1.4,
            transition: 'background 0.2s, border 0.2s',
          }}
        >
          {npc.avatarEmoji} {npc.name}
          {hasTalked && <span style={{ color: '#90ee90', marginLeft: 5 }}>✓</span>}
          {isNear && (
            <div style={{ fontSize: 11, color: '#d4b4ff', marginTop: 2 }}>
              Press E to talk
            </div>
          )}
        </div>
      </Html>
    </group>
  )
}

function lerpAngle(from: number, to: number, t: number): number {
  let diff = to - from
  while (diff >  Math.PI) diff -= 2 * Math.PI
  while (diff < -Math.PI) diff += 2 * Math.PI
  return from + diff * Math.min(t, 1)
}
