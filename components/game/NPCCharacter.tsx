'use client'

import { useRef, useState, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Outlines } from '@react-three/drei'
import * as THREE from 'three'
import type { NPC } from '@/lib/types'
import { NPC_PATROLS, NPC_SPEEDS } from '@/lib/npc-positions'

// Three-step toon gradient (sharp, cartoonish shading bands)
function useToonGradient() {
  return useMemo(() => {
    const map = new THREE.DataTexture(
      new Uint8Array([0, 96, 220, 255]),
      4, 1,
      THREE.RedFormat,
    )
    map.magFilter = THREE.NearestFilter
    map.minFilter = THREE.NearestFilter
    map.needsUpdate = true
    return map
  }, [])
}

// ── Colour maps ───────────────────────────────────────────────────────────────
const MOOD_COLORS: Record<string, string> = {
  friendly: '#2ecc71', neutral: '#95a5a6', busy: '#f39c12',
  stressed: '#e74c3c', sad:      '#3498db', confused: '#e67e22',
}
const NPC_BODY_COLORS: Record<string, string> = {
  'store-employee':     '#1a6b3c',
  'couple':             '#8e44ad',
  'old-man':            '#c0392b',
  'young-professional': '#2980b9',
  'manager':            '#2c3e50',
  'ticket-officer':     '#0d3b6e',
  'commuter':           '#555',
  'tourist':            '#27ae60',
  'busker':             '#8e44ad',
  'older-traveller':    '#c0392b',
  'extrovert':          '#e67e22',
  'colleague':          '#2980b9',
  'nervous-cousin':     '#7f8c8d',
  'parents-friend':     '#8e44ad',
  'sharp-friend':       '#c0392b',
}

// ── Behaviour state machine types ─────────────────────────────────────────────
type NPCState = 'patrolling' | 'idle' | 'facing_player' | 'moving_to_target'

interface Behavior {
  state: NPCState
  prevState: NPCState          // state to resume after facing player / reaching target
  waypointIndex: number
  idleTimer: number
  hasTarget: boolean
  target: THREE.Vector3
  fidgetCooldown: number       // seconds until next fidget (counts down while idle)
}

// ── Fidget animation state ─────────────────────────────────────────────────────
interface Fidget {
  type: 'look' | 'arm'
  progress: number   // 0 → 1: sin(progress * π) drives the animation
  speed: number      // progress units/sec (1 / total_duration)
  angle: number      // look: target Y rotation; arm: target X rotation delta
  side: 'L' | 'R'   // which arm to raise
}

// ── Constants ─────────────────────────────────────────────────────────────────
const APPROACH_DIST  = 4.8   // start looking at player
const RESUME_DIST    = 6.2   // hysteresis — resume patrol once player is this far
const ARRIVE_THRESH  = 0.25  // metres — "reached waypoint"

// ── Mood-based movement styles ────────────────────────────────────────────────
interface MoveStyle {
  idleMin:  number   // min seconds to pause at each waypoint
  idleMax:  number   // max seconds to pause at each waypoint
  turnLerp: number   // rotation lerp speed (higher = snappier)
  erratic:  boolean  // randomly abort waypoints mid-route for jittery feel
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
  targetOverride: [number, number, number] | null   // external "go here" command
  npcPositionsRef: React.MutableRefObject<Map<string, THREE.Vector3>>
  onTargetReached: () => void
  onProximityEnter?: () => void   // fires once when player first enters APPROACH_DIST
}

export default function NPCCharacter({
  npc,
  scenarioId,
  initialPosition,
  hasTalked,
  chatOpen,
  targetOverride,
  npcPositionsRef,
  onTargetReached,
  onProximityEnter,
}: Props) {
  const groupRef   = useRef<THREE.Group>(null)
  const meshRef    = useRef<THREE.Group>(null)  // body sub-group for bob
  const bodyRef    = useRef<THREE.Mesh>(null)   // torso mesh for breathing scale
  const headRef    = useRef<THREE.Group>(null)  // head group for fidget look-around

  // Limb pivot groups — animated each frame
  const legLRef    = useRef<THREE.Group>(null)
  const legRRef    = useRef<THREE.Group>(null)
  const armLRef    = useRef<THREE.Group>(null)
  const armRRef    = useRef<THREE.Group>(null)

  // Fidget animation state
  const fidgetRef  = useRef<Fidget | null>(null)

  const toonGradient = useToonGradient()

  // Walk-cycle state
  const walkPhaseRef = useRef(0)   // phase advances only while moving
  const swingRef     = useRef(0)   // current limb swing angle (lerped)

  // Live world position (updated each frame, shared via npcPositionsRef)
  const posRef     = useRef(new THREE.Vector3(initialPosition[0], 0, initialPosition[2]))
  const facingRef  = useRef(0)                  // current Y rotation (radians)

  const waypoints  = NPC_PATROLS[scenarioId]?.[npc.id] ?? []
  const speed      = NPC_SPEEDS[scenarioId]?.[npc.id] ?? 1.0

  const beh = useRef<Behavior>({
    state:          waypoints.length > 0 ? 'patrolling' : 'idle',
    prevState:      'patrolling',
    waypointIndex:  0,
    idleTimer:      0,
    hasTarget:      false,
    target:         new THREE.Vector3(),
    fidgetCooldown: 3 + Math.random() * 4,  // stagger first fidget per NPC
  })

  // Register (and later deregister) this NPC's live position
  useEffect(() => {
    npcPositionsRef.current.set(npc.id, posRef.current)
    return () => { npcPositionsRef.current.delete(npc.id) }
  }, [npc.id, npcPositionsRef])

  // React to external target override (e.g. NPC says "I'll go get that")
  useEffect(() => {
    if (targetOverride) {
      beh.current.hasTarget = true
      beh.current.target.set(targetOverride[0], 0, targetOverride[2])
      if (beh.current.state !== 'facing_player') {
        beh.current.prevState = 'patrolling'
        beh.current.state = 'moving_to_target'
      }
      // if currently facing player, will transition after player moves away
    } else {
      beh.current.hasTarget = false
      if (beh.current.state === 'moving_to_target') {
        beh.current.state = 'patrolling'
      }
    }
  }, [targetOverride])

  // Proximity UI state (triggers React re-render only on transition)
  const isNearRef        = useRef(false)
  const [isNear, setIsNear] = useState(false)
  // One-shot proximity callback — fires only the first time player approaches
  const proximityFiredRef = useRef(false)

  // Mood-based movement style
  const style = MOVE_STYLE[npc.mood] ?? MOVE_STYLE.neutral

  // Erratic NPCs get a panic timer that randomly aborts their current waypoint
  const panicTimerRef = useRef(0.4 + Math.random() * 0.8)

  // Temporary vectors (reused each frame — avoids allocations)
  const _toTarget  = useRef(new THREE.Vector3())
  const _toPlayer  = useRef(new THREE.Vector3())

  useFrame((state, delta) => {
    const b    = beh.current
    const cam  = state.camera
    const t    = state.clock.elapsedTime

    // ── Proximity detection ──────────────────────────────────────────────
    const distToPlayer = cam.position.distanceTo(posRef.current)
    const playerNear   = distToPlayer < APPROACH_DIST && !chatOpen
    const playerFar    = distToPlayer > RESUME_DIST

    // Update near UI state (only on transitions to avoid re-render spam)
    if (playerNear !== isNearRef.current) {
      isNearRef.current = playerNear
      setIsNear(playerNear)
      // One-shot proximity callback — only the first time player enters range
      if (playerNear && !proximityFiredRef.current) {
        proximityFiredRef.current = true
        onProximityEnter?.()
      }
    }

    // ── State transitions ────────────────────────────────────────────────
    if (playerNear && b.state !== 'facing_player') {
      b.prevState = b.state
      b.state     = 'facing_player'
    } else if (!playerNear && playerFar && b.state === 'facing_player') {
      // Resume whatever they were doing
      b.state = b.hasTarget ? 'moving_to_target' : (waypoints.length > 0 ? b.prevState : 'idle')
    }

    // ── Per-state logic ──────────────────────────────────────────────────
    let moved = false

    switch (b.state) {
      case 'patrolling': {
        if (waypoints.length === 0) { b.state = 'idle'; break }

        // Erratic NPCs randomly abort their current waypoint and jump to another
        if (style.erratic) {
          panicTimerRef.current -= delta
          if (panicTimerRef.current <= 0) {
            panicTimerRef.current = 0.5 + Math.random() * 1.2
            // Skip to a random different waypoint
            const next = (b.waypointIndex + 1 + Math.floor(Math.random() * (waypoints.length - 1))) % waypoints.length
            b.waypointIndex = next
          }
        }

        const wp = waypoints[b.waypointIndex]
        _toTarget.current.set(wp[0], 0, wp[2]).sub(posRef.current)
        const dist = _toTarget.current.length()

        if (dist < ARRIVE_THRESH) {
          // Reached waypoint — go idle briefly
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
        if (b.idleTimer <= 0 && waypoints.length > 0) {
          b.state = 'patrolling'
        }
        break
      }

      case 'facing_player': {
        // Turn toward the player, stand still
        _toPlayer.current
          .copy(cam.position)
          .sub(posRef.current)
          .setY(0)
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
          // Arrived at target
          b.hasTarget = false
          b.state     = waypoints.length > 0 ? 'patrolling' : 'idle'
          onTargetReached()
        } else {
          const step = Math.min(speed * 1.2 * delta, dist)   // slightly faster on a mission
          _toTarget.current.normalize().multiplyScalar(step)
          posRef.current.add(_toTarget.current)
          facingRef.current = Math.atan2(_toTarget.current.x, _toTarget.current.z)
          moved = true
        }
        break
      }
    }

    // ── Apply transforms to THREE objects ────────────────────────────────
    if (!groupRef.current || !meshRef.current) return

    // Position
    groupRef.current.position.x = posRef.current.x
    groupRef.current.position.z = posRef.current.z

    // Rotation — speed driven by mood (stressed = snappy, friendly = gentle)
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      facingRef.current,
      style.turnLerp * delta,
    )

    // Bob — more pronounced while walking
    const bobAmp   = moved ? 0.055 : 0.025
    const bobFreq  = moved ? 3.5   : 1.5
    meshRef.current.position.y = Math.sin(t * bobFreq + initialPosition[0]) * bobAmp

    // Walk-cycle limb animation
    if (moved) {
      walkPhaseRef.current += delta * 5.5
      swingRef.current = THREE.MathUtils.lerp(
        swingRef.current,
        Math.sin(walkPhaseRef.current) * 0.52,
        18 * delta,
      )
    } else {
      swingRef.current = THREE.MathUtils.lerp(swingRef.current, 0, 9 * delta)
    }
    const sw = swingRef.current
    if (legLRef.current) legLRef.current.rotation.x =  sw
    if (legRRef.current) legRRef.current.rotation.x = -sw
    if (armLRef.current) armLRef.current.rotation.x = -sw * 0.42
    if (armRRef.current) armRRef.current.rotation.x =  sw * 0.42

    // ── Fidget trigger (only while idle and not facing player) ───────────
    if (b.state === 'idle' && !moved) {
      b.fidgetCooldown -= delta
      if (b.fidgetCooldown <= 0 && !fidgetRef.current) {
        b.fidgetCooldown = 4 + Math.random() * 5
        const type = Math.random() < 0.55 ? 'look' : 'arm'
        fidgetRef.current = {
          type,
          progress: 0,
          speed: 1 / 2.2,   // full cycle takes 2.2 s
          angle: type === 'look'
            ? (Math.random() < 0.5 ? 1 : -1) * (0.25 + Math.random() * 0.3)
            : -(0.6 + Math.random() * 0.4),
          side: Math.random() < 0.5 ? 'L' : 'R',
        }
      }
    } else {
      // Cancel fidget if state changes (e.g. player approaches)
      if (fidgetRef.current) fidgetRef.current = null
    }

    // ── Drive fidget animation ───────────────────────────────────────────
    if (fidgetRef.current) {
      const f = fidgetRef.current
      f.progress += delta * f.speed
      if (f.progress >= 1) {
        fidgetRef.current = null
        // Snap back to rest
        if (headRef.current) headRef.current.rotation.y = 0
        if (armLRef.current) armLRef.current.rotation.x = 0
        if (armRRef.current) armRRef.current.rotation.x = 0
      } else {
        // sin envelope — smooth rise → peak → return
        const envelope = Math.sin(f.progress * Math.PI)
        if (f.type === 'look' && headRef.current) {
          headRef.current.rotation.y = f.angle * envelope
        } else if (f.type === 'arm') {
          const target = armLRef.current && f.side === 'L' ? armLRef.current
            : armRRef.current ?? null
          if (target) target.rotation.x = f.angle * envelope
        }
      }
    } else if (b.state !== 'idle') {
      // Ensure head snaps back while moving
      if (headRef.current) headRef.current.rotation.y = THREE.MathUtils.lerp(
        headRef.current.rotation.y, 0, 8 * delta,
      )
    }

    // Idle breathing — gentle Y-scale pulse, staggered per NPC via initialPosition[0]
    if (bodyRef.current) {
      const breatheAmp  = moved ? 0.005 : 0.022
      const breatheFreq = moved ? 3.5   : 0.9
      const breathPhase = initialPosition[0] * 0.7   // stagger between NPCs
      bodyRef.current.scale.y = 1 + Math.sin(t * breatheFreq + breathPhase) * breatheAmp
    }
  })

  const bodyColor = NPC_BODY_COLORS[npc.id] ?? '#555'
  const moodColor = MOOD_COLORS[npc.mood]   ?? '#95a5a6'

  return (
    // No position prop — fully controlled by useFrame above
    <group ref={groupRef}>
      {/* Floor shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.38, 8]} />
        <meshStandardMaterial color="#000" transparent opacity={0.22} />
      </mesh>

      {/* Body sub-group (bobs independently) */}
      <group ref={meshRef}>
        {/* Left leg — pivot at hip */}
        <group ref={legLRef} position={[-0.13, 0.92, 0]}>
          <mesh position={[0, -0.45, 0]} castShadow>
            <cylinderGeometry args={[0.085, 0.085, 0.9, 8]} />
            <meshToonMaterial color="#1a1a2e" gradientMap={toonGradient} />
          </mesh>
          {/* Foot */}
          <mesh position={[0, -0.93, 0.06]}>
            <boxGeometry args={[0.14, 0.1, 0.24]} />
            <meshToonMaterial color="#111" gradientMap={toonGradient} />
          </mesh>
        </group>

        {/* Right leg — pivot at hip */}
        <group ref={legRRef} position={[0.13, 0.92, 0]}>
          <mesh position={[0, -0.45, 0]} castShadow>
            <cylinderGeometry args={[0.085, 0.085, 0.9, 8]} />
            <meshToonMaterial color="#1a1a2e" gradientMap={toonGradient} />
          </mesh>
          {/* Foot */}
          <mesh position={[0, -0.93, 0.06]}>
            <boxGeometry args={[0.14, 0.1, 0.24]} />
            <meshToonMaterial color="#111" gradientMap={toonGradient} />
          </mesh>
        </group>

        {/* Body */}
        <mesh ref={bodyRef} position={[0, 1.15, 0]} castShadow>
          <cylinderGeometry args={[0.27, 0.31, 0.72, 12]} />
          <meshToonMaterial color={bodyColor} gradientMap={toonGradient} />
          <Outlines thickness={0.03} color="#111" opacity={0.85} />
        </mesh>

        {/* Left arm — pivot at shoulder */}
        <group ref={armLRef} position={[-0.38, 1.46, 0]}>
          <mesh position={[0, -0.28, 0]} rotation={[0, 0, 0.38]} castShadow>
            <cylinderGeometry args={[0.07, 0.065, 0.58, 8]} />
            <meshToonMaterial color={bodyColor} gradientMap={toonGradient} />
          </mesh>
          {/* Hand */}
          <mesh position={[-0.1, -0.55, 0]}>
            <sphereGeometry args={[0.075, 6, 6]} />
            <meshToonMaterial color="#f0c8a0" gradientMap={toonGradient} />
          </mesh>
        </group>

        {/* Right arm — pivot at shoulder */}
        <group ref={armRRef} position={[0.38, 1.46, 0]}>
          <mesh position={[0, -0.28, 0]} rotation={[0, 0, -0.38]} castShadow>
            <cylinderGeometry args={[0.07, 0.065, 0.58, 8]} />
            <meshToonMaterial color={bodyColor} gradientMap={toonGradient} />
          </mesh>
          {/* Hand */}
          <mesh position={[0.1, -0.55, 0]}>
            <sphereGeometry args={[0.075, 6, 6]} />
            <meshToonMaterial color="#f0c8a0" gradientMap={toonGradient} />
          </mesh>
        </group>

        {/* Head group — pivot at neck base (y=1.67) for look-around fidgets */}
        <group ref={headRef} position={[0, 1.67, 0]}>
          {/* Neck */}
          <mesh position={[0, -0.09, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.18, 8]} />
            <meshToonMaterial color="#f0c8a0" gradientMap={toonGradient} />
          </mesh>

          {/* Head */}
          <mesh position={[0, 0.20, 0]} castShadow>
            <sphereGeometry args={[0.24, 8, 8]} />
            <meshToonMaterial color="#f0c8a0" gradientMap={toonGradient} />
            <Outlines thickness={0.025} color="#111" opacity={0.85} />
          </mesh>

          {/* Eyes */}
          {([-0.09, 0.09] as const).map(x => (
            <mesh key={x} position={[x, 0.23, 0.21]}>
              <sphereGeometry args={[0.038, 6, 6]} />
              <meshToonMaterial color="#1a1a2e" gradientMap={toonGradient} />
            </mesh>
          ))}

          {/* Eyebrows */}
          {([-0.09, 0.09] as const).map(x => (
            <mesh key={x} position={[x, 0.30, 0.20]} rotation={[0.2, 0, 0]}>
              <boxGeometry args={[0.065, 0.018, 0.015]} />
              <meshToonMaterial color="#5a3a1a" gradientMap={toonGradient} />
            </mesh>
          ))}

          {/* Mood dot */}
          <mesh position={[0, 0.61, 0]}>
            <sphereGeometry args={[0.085, 6, 6]} />
            <meshStandardMaterial
              color={moodColor}
              emissive={moodColor}
              emissiveIntensity={0.9}
            />
          </mesh>
        </group>
      </group>

      {/* HTML label — attached to the group so it follows NPC position */}
      <Html position={[0, 2.75, 0]} center distanceFactor={8} zIndexRange={[0, 10]}>
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

// ── Helpers ───────────────────────────────────────────────────────────────────
function lerpAngle(from: number, to: number, t: number): number {
  let diff = to - from
  while (diff >  Math.PI) diff -= 2 * Math.PI
  while (diff < -Math.PI) diff += 2 * Math.PI
  return from + diff * Math.min(t, 1)
}
