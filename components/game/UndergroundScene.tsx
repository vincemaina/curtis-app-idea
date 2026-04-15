'use client'

import { useMemo } from 'react'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

export default function UndergroundScene() {
  // Reusable materials computed once
  const floorMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2a2a2e', roughness: 0.85, metalness: 0.05 }), [])
  const platformFloorMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3a3844', roughness: 0.8, metalness: 0.05 }), [])
  const ticketHallWallMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#e8e0d0', roughness: 0.9, metalness: 0.0 }), [])
  const tunnelWallMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4a3a2a', roughness: 0.95, metalness: 0.0, side: THREE.FrontSide }), [])
  const ceilingMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1a1a22', roughness: 0.9 }), [])
  const archMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4a3a2a', roughness: 0.95, metalness: 0.0, side: THREE.BackSide }), [])
  const trainRedMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#cc1010', roughness: 0.55, metalness: 0.1 }), [])
  const trainDarkMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2a2a3a', roughness: 0.7, metalness: 0.1 }), [])
  const windowMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1a2a4a', roughness: 0.3, metalness: 0.4 }), [])
  const chromeMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#aaaaaa', roughness: 0.2, metalness: 0.8 }), [])
  const yellowMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f5c400', roughness: 0.7, metalness: 0.0 }), [])
  const glassMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4a6080', transparent: true, opacity: 0.4, roughness: 0.1, metalness: 0.2 }), [])
  const counterMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#c8b89a', roughness: 0.7 }), [])
  const roundelRedMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#cc0000', roughness: 0.5, metalness: 0.1 }), [])
  const roundelBlueMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#003380', roughness: 0.5, metalness: 0.1 }), [])
  const centralWallMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3a2e20', roughness: 0.95 }), [])

  // Arch geometry: half-cylinder, open-ended, rendered BackSide
  const corridorArchGeo = useMemo(() => new THREE.CylinderGeometry(2.0, 2.0, 16, 20, 1, true, 0, Math.PI), [])
  const platformArchGeo = useMemo(() => new THREE.CylinderGeometry(2.4, 2.4, 19, 20, 1, true, 0, Math.PI), [])

  return (
    <group>

      {/* ── Lighting ─────────────────────────────────────────────────────────── */}
      <ambientLight color="#aac8ee" intensity={0.35} />

      {/* Warm ticket-office light */}
      <pointLight color="#ffe8b0" intensity={0.8} distance={7} position={[-7, 2, 0]} />

      {/* Fluorescent tube lights along corridors and platforms */}
      {([-5, -10, -15, -25, -32] as number[]).map((z) => (
        <group key={z}>
          <pointLight color="#d0e8ff" intensity={1.2} distance={8} position={[-5, 3.2, z]} />
          <pointLight color="#d0e8ff" intensity={1.2} distance={8} position={[4, 3.2, z]} />
        </group>
      ))}

      {/* Atmospheric blue light at end of Platform 1 tunnel */}
      <pointLight color="#0050b3" intensity={1.5} distance={12} position={[4, 2, -38]} />

      {/* Ticket hall overhead fill */}
      <pointLight color="#d8e8f8" intensity={0.9} distance={15} position={[0, 4, 2]} />

      {/* ── Floor panels ─────────────────────────────────────────────────────── */}
      {/* Entrance approach floor */}
      <mesh receiveShadow position={[0, 0, 6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 4]} />
        <primitive object={floorMat} attach="material" />
      </mesh>

      {/* Ticket hall floor */}
      <mesh receiveShadow position={[0, 0, 3]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 10]} />
        <primitive object={floorMat} attach="material" />
      </mesh>

      {/* Corridor A floor (right) */}
      <mesh receiveShadow position={[4, 0, -10]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 16]} />
        <primitive object={floorMat} attach="material" />
      </mesh>

      {/* Corridor B floor (left) */}
      <mesh receiveShadow position={[-5.5, 0, -10]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7, 16]} />
        <primitive object={floorMat} attach="material" />
      </mesh>

      {/* Platform 1 floor (East) */}
      <mesh receiveShadow position={[4.5, 0, -27.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[11, 19]} />
        <primitive object={platformFloorMat} attach="material" />
      </mesh>

      {/* Platform 2 floor (West) */}
      <mesh receiveShadow position={[-5.5, 0, -27.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[9, 19]} />
        <primitive object={platformFloorMat} attach="material" />
      </mesh>

      {/* ── Ticket hall walls + ceiling ──────────────────────────────────────── */}
      {/* Back wall of ticket hall (z=-2 face, facing +z) */}
      <mesh position={[0, 2.25, -2]} castShadow>
        <boxGeometry args={[20, 4.5, 0.15]} />
        <primitive object={ticketHallWallMat} attach="material" />
      </mesh>

      {/* Front wall of ticket hall / entrance (z=8) */}
      <mesh position={[0, 2.25, 8]} castShadow>
        <boxGeometry args={[20, 4.5, 0.15]} />
        <primitive object={ticketHallWallMat} attach="material" />
      </mesh>

      {/* Left wall of ticket hall */}
      <mesh position={[-10, 2.25, 3]} castShadow>
        <boxGeometry args={[0.15, 4.5, 10]} />
        <primitive object={ticketHallWallMat} attach="material" />
      </mesh>

      {/* Right wall of ticket hall */}
      <mesh position={[10, 2.25, 3]} castShadow>
        <boxGeometry args={[0.15, 4.5, 10]} />
        <primitive object={ticketHallWallMat} attach="material" />
      </mesh>

      {/* Ticket hall ceiling */}
      <mesh position={[0, 4.5, 3]}>
        <boxGeometry args={[20, 0.12, 10]} />
        <primitive object={ceilingMat} attach="material" />
      </mesh>

      {/* ── Ticket office kiosk (x[-10,-5], z[-1,1]) ────────────────────────── */}
      <group position={[-7.5, 0, 0]}>
        {/* Back wall */}
        <mesh position={[0, 1.25, -1]} castShadow>
          <boxGeometry args={[5, 2.5, 0.1]} />
          <primitive object={ticketHallWallMat} attach="material" />
        </mesh>
        {/* Left side wall */}
        <mesh position={[-2.45, 1.25, 0]} castShadow>
          <boxGeometry args={[0.1, 2.5, 2]} />
          <primitive object={ticketHallWallMat} attach="material" />
        </mesh>
        {/* Right side wall */}
        <mesh position={[2.45, 1.25, 0]} castShadow>
          <boxGeometry args={[0.1, 2.5, 2]} />
          <primitive object={ticketHallWallMat} attach="material" />
        </mesh>
        {/* Glass front panel */}
        <mesh position={[0, 1.55, 1]}>
          <boxGeometry args={[5, 1.5, 0.05]} />
          <primitive object={glassMat} attach="material" />
        </mesh>
        {/* Counter */}
        <mesh position={[0, 0.9, 0.8]} castShadow>
          <boxGeometry args={[5, 0.08, 1]} />
          <primitive object={counterMat} attach="material" />
        </mesh>
        {/* Kiosk roof */}
        <mesh position={[0, 2.55, 0]}>
          <boxGeometry args={[5, 0.1, 2]} />
          <primitive object={ceilingMat} attach="material" />
        </mesh>
      </group>

      {/* ── Ticket barriers (z≈-2) ───────────────────────────────────────────── */}
      <group>
        {([-7, -4, 2, 5] as number[]).map((x) => (
          <group key={x} position={[x, 0.45, -2]}>
            {/* Gate post */}
            <mesh castShadow>
              <boxGeometry args={[0.3, 0.9, 0.08]} />
              <primitive object={chromeMat} attach="material" />
            </mesh>
            {/* Gate wing (left) */}
            <mesh position={[-0.27, 0.15, 0]} castShadow>
              <boxGeometry args={[0.05, 0.02, 0.5]} />
              <primitive object={chromeMat} attach="material" />
            </mesh>
            {/* Gate wing (right) */}
            <mesh position={[0.27, 0.15, 0]} castShadow>
              <boxGeometry args={[0.05, 0.02, 0.5]} />
              <primitive object={chromeMat} attach="material" />
            </mesh>
            {/* Vertical support post */}
            <mesh position={[0, 0, 0]} castShadow>
              <boxGeometry args={[0.06, 0.9, 0.06]} />
              <primitive object={chromeMat} attach="material" />
            </mesh>
          </group>
        ))}
        {/* Barrier horizontal bar connecting posts */}
        <mesh position={[0, 1.05, -2]}>
          <boxGeometry args={[16, 0.06, 0.06]} />
          <primitive object={chromeMat} attach="material" />
        </mesh>
      </group>

      {/* ── Corridor A (right, x[-1,9], z[-2,-18]) ───────────────────────────── */}
      <group>
        {/* Right outer wall */}
        <mesh position={[9.85, 1.8, -10]} castShadow>
          <boxGeometry args={[0.3, 3.6, 16]} />
          <primitive object={tunnelWallMat} attach="material" />
        </mesh>
        {/* Left wall (central divider side) */}
        <mesh position={[-0.85, 1.8, -10]} castShadow>
          <boxGeometry args={[0.3, 3.6, 16]} />
          <primitive object={tunnelWallMat} attach="material" />
        </mesh>
        {/* Floor for corridor A already included above */}

        {/* Arched ceiling — half-cylinder, rotated to span the corridor */}
        {/* The arch runs along z-axis. CylinderGeometry radius=2, length=16 */}
        <mesh position={[4, 2.0, -10]} rotation={[Math.PI / 2, 0, 0]}>
          <primitive object={corridorArchGeo} attach="geometry" />
          <primitive object={archMat} attach="material" />
        </mesh>
      </group>

      {/* ── Corridor B (left, x[-9,-2], z[-2,-18]) ───────────────────────────── */}
      <group>
        {/* Left outer wall */}
        <mesh position={[-9.85, 1.8, -10]} castShadow>
          <boxGeometry args={[0.3, 3.6, 16]} />
          <primitive object={tunnelWallMat} attach="material" />
        </mesh>
        {/* Right wall (central divider side) */}
        <mesh position={[-2.15, 1.8, -10]} castShadow>
          <boxGeometry args={[0.3, 3.6, 16]} />
          <primitive object={tunnelWallMat} attach="material" />
        </mesh>

        {/* Arched ceiling */}
        <mesh position={[-5.5, 2.0, -10]} rotation={[Math.PI / 2, 0, 0]}>
          <primitive object={corridorArchGeo} attach="geometry" />
          <primitive object={archMat} attach="material" />
        </mesh>
      </group>

      {/* ── Central divider wall (x[-2,-1], z[-2,-18]) ────────────────────────── */}
      <mesh position={[-1.5, 1.8, -10]} castShadow>
        <boxGeometry args={[1, 3.6, 16]} />
        <primitive object={centralWallMat} attach="material" />
      </mesh>

      {/* ── Platform 1 (East, x[-1,10], z[-18,-37]) ──────────────────────────── */}
      <group>
        {/* Platform outer right wall */}
        <mesh position={[10.15, 2.0, -27.5]} castShadow>
          <boxGeometry args={[0.3, 4.0, 19]} />
          <primitive object={tunnelWallMat} attach="material" />
        </mesh>
        {/* Platform back wall (z=-37) */}
        <mesh position={[4.5, 2.0, -37.15]} castShadow>
          <boxGeometry args={[11, 4.0, 0.3]} />
          <primitive object={tunnelWallMat} attach="material" />
        </mesh>

        {/* Arched ceiling over platform 1 */}
        <mesh position={[4.5, 2.2, -27.5]} rotation={[Math.PI / 2, 0, 0]}>
          <primitive object={platformArchGeo} attach="geometry" />
          <primitive object={archMat} attach="material" />
        </mesh>

        {/* Yellow tactile strip at platform 1 edge */}
        <mesh position={[4.5, 0.02, -18.5]}>
          <boxGeometry args={[11, 0.04, 0.25]} />
          <primitive object={yellowMat} attach="material" />
        </mesh>
      </group>

      {/* ── Platform 2 (West, x[-10,-1], z[-18,-37]) ─────────────────────────── */}
      <group>
        {/* Platform outer left wall */}
        <mesh position={[-10.15, 2.0, -27.5]} castShadow>
          <boxGeometry args={[0.3, 4.0, 19]} />
          <primitive object={tunnelWallMat} attach="material" />
        </mesh>
        {/* Platform back wall (z=-37) */}
        <mesh position={[-5.5, 2.0, -37.15]} castShadow>
          <boxGeometry args={[9, 4.0, 0.3]} />
          <primitive object={tunnelWallMat} attach="material" />
        </mesh>

        {/* Arched ceiling over platform 2 */}
        <mesh position={[-5.5, 2.2, -27.5]} rotation={[Math.PI / 2, 0, 0]}>
          <primitive object={platformArchGeo} attach="geometry" />
          <primitive object={archMat} attach="material" />
        </mesh>

        {/* Yellow tactile strip at platform 2 edge */}
        <mesh position={[-5.5, 0.02, -18.5]}>
          <boxGeometry args={[9, 0.04, 0.25]} />
          <primitive object={yellowMat} attach="material" />
        </mesh>
      </group>

      {/* ── Platform divider wall between the two platforms ──────────────────── */}
      <mesh position={[-0.5, 2.0, -27.5]} castShadow>
        <boxGeometry args={[1, 4.0, 19]} />
        <primitive object={centralWallMat} attach="material" />
      </mesh>

      {/* ── Train on Platform 1 (tube red, x[0.5,9], z[-30,-37]) ─────────────── */}
      <group position={[4.75, 1.25, -33.5]}>
        {/* Main body */}
        <mesh castShadow>
          <boxGeometry args={[8.5, 2.5, 7]} />
          <primitive object={trainRedMat} attach="material" />
        </mesh>

        {/* Windows — right side (facing platform, negative x side = z face) */}
        {/* 6 windows on the near side (z = +3.5 face) */}
        {[-3.0, -1.8, -0.6, 0.6, 1.8, 3.0].map((wx, i) => (
          <mesh key={`p1w-near-${i}`} position={[wx, 0.45, 3.55]} castShadow>
            <boxGeometry args={[0.9, 0.75, 0.05]} />
            <primitive object={windowMat} attach="material" />
          </mesh>
        ))}
        {/* 6 windows on the far side (z = -3.5 face) */}
        {[-3.0, -1.8, -0.6, 0.6, 1.8, 3.0].map((wx, i) => (
          <mesh key={`p1w-far-${i}`} position={[wx, 0.45, -3.55]} castShadow>
            <boxGeometry args={[0.9, 0.75, 0.05]} />
            <primitive object={windowMat} attach="material" />
          </mesh>
        ))}

        {/* Front cab window */}
        <mesh position={[4.26, 0.55, 0]} castShadow>
          <boxGeometry args={[0.05, 0.9, 2.0]} />
          <primitive object={windowMat} attach="material" />
        </mesh>

        {/* Yellow warning stripe along bottom */}
        <mesh position={[0, -1.2, 3.56]} castShadow>
          <boxGeometry args={[8.5, 0.1, 0.08]} />
          <primitive object={yellowMat} attach="material" />
        </mesh>
        <mesh position={[0, -1.2, -3.56]} castShadow>
          <boxGeometry args={[8.5, 0.1, 0.08]} />
          <primitive object={yellowMat} attach="material" />
        </mesh>

        {/* Destination sign */}
        <Html position={[0, 1.85, 3.6]} center distanceFactor={6}>
          <div style={{
            background: '#003380',
            color: '#fff',
            padding: '3px 10px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            border: '2px solid #cc0000',
            fontFamily: 'sans-serif',
          }}>
            Platform 1 — Eastbound → High St Kensington
          </div>
        </Html>
      </group>

      {/* ── Train on Platform 2 (dark grey, x[-9,-0.5], z[-30,-37]) ──────────── */}
      <group position={[-4.75, 1.25, -33.5]}>
        {/* Main body */}
        <mesh castShadow>
          <boxGeometry args={[8.5, 2.5, 7]} />
          <primitive object={trainDarkMat} attach="material" />
        </mesh>

        {/* Windows — near side */}
        {[-3.0, -1.8, -0.6, 0.6, 1.8, 3.0].map((wx, i) => (
          <mesh key={`p2w-near-${i}`} position={[wx, 0.45, 3.55]} castShadow>
            <boxGeometry args={[0.9, 0.75, 0.05]} />
            <primitive object={windowMat} attach="material" />
          </mesh>
        ))}
        {/* Windows — far side */}
        {[-3.0, -1.8, -0.6, 0.6, 1.8, 3.0].map((wx, i) => (
          <mesh key={`p2w-far-${i}`} position={[wx, 0.45, -3.55]} castShadow>
            <boxGeometry args={[0.9, 0.75, 0.05]} />
            <primitive object={windowMat} attach="material" />
          </mesh>
        ))}

        {/* Destination sign */}
        <Html position={[0, 1.85, 3.6]} center distanceFactor={6}>
          <div style={{
            background: '#2a2a3a',
            color: '#ccc',
            padding: '3px 10px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            border: '2px solid #555',
            fontFamily: 'sans-serif',
          }}>
            Platform 2 — Westbound → Hammersmith
          </div>
        </Html>
      </group>

      {/* ── Directional signs at corridor entrances ───────────────────────────── */}
      {/* Corridor A (right → Platform 1) */}
      <Html position={[5, 3.2, -2]} center distanceFactor={8}>
        <div style={{
          background: '#003380',
          color: '#fff',
          padding: '4px 12px',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          border: '2px solid #cc0000',
          fontFamily: 'sans-serif',
        }}>
          → Platform 1 · Eastbound
        </div>
      </Html>

      {/* Corridor B (left → Platform 2) */}
      <Html position={[-5, 3.2, -2]} center distanceFactor={8}>
        <div style={{
          background: '#003380',
          color: '#fff',
          padding: '4px 12px',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          border: '2px solid #cc0000',
          fontFamily: 'sans-serif',
        }}>
          ← Platform 2 · Westbound
        </div>
      </Html>

      {/* ── Underground roundel logo at entrance ──────────────────────────────── */}
      <group position={[0, 3.5, 7.5]}>
        {/* Red circle ring (torus) */}
        <mesh>
          <torusGeometry args={[0.6, 0.08, 8, 16]} />
          <primitive object={roundelRedMat} attach="material" />
        </mesh>
        {/* Blue horizontal bar */}
        <mesh>
          <boxGeometry args={[1.4, 0.25, 0.05]} />
          <primitive object={roundelBlueMat} attach="material" />
        </mesh>
      </group>

      {/* ── Additional tunnel atmosphere ──────────────────────────────────────── */}
      {/* Corridor A end wall connecting to platform */}
      <mesh position={[4, 2.0, -18.05]}>
        <boxGeometry args={[10, 4.0, 0.1]} />
        <primitive object={tunnelWallMat} attach="material" />
      </mesh>

      {/* Corridor B end wall connecting to platform */}
      <mesh position={[-5.5, 2.0, -18.05]}>
        <boxGeometry args={[7, 4.0, 0.1]} />
        <primitive object={tunnelWallMat} attach="material" />
      </mesh>

      {/* Entrance surround arch (decorative) */}
      <mesh position={[0, 3.0, 7.8]}>
        <boxGeometry args={[20, 0.4, 0.2]} />
        <meshStandardMaterial color="#c00000" roughness={0.5} />
      </mesh>

    </group>
  )
}
