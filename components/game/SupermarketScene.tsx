'use client'

import { Html, useTexture } from '@react-three/drei'
import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SHELF_X, SHELF_ROWS_Z } from '@/lib/store-layout'

// ── Ceiling fan ────────────────────────────────────────────────────────────────
function CeilingFan({ position, speed = 2.2 }: {
  position: [number, number, number]
  speed?: number
}) {
  const bladesRef = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (bladesRef.current) bladesRef.current.rotation.y += delta * speed
  })
  return (
    <group position={position}>
      {/* Drop rod */}
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.55, 6]} />
        <meshStandardMaterial color="#999" metalness={0.55} roughness={0.35} />
      </mesh>
      {/* Motor housing */}
      <mesh>
        <cylinderGeometry args={[0.13, 0.13, 0.14, 14]} />
        <meshStandardMaterial color="#aaa" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Blades */}
      <group ref={bladesRef} position={[0, -0.05, 0]}>
        {[0, 1, 2, 3].map(i => (
          <group key={i} rotation={[0, (i * Math.PI) / 2, 0]}>
            <mesh position={[0.52, -0.01, 0]} rotation={[0.14, 0, 0]}>
              <boxGeometry args={[0.88, 0.022, 0.19]} />
              <meshStandardMaterial color="#c8a855" roughness={0.75} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}

// ── Aisle hanging sign ─────────────────────────────────────────────────────────
function AisleSign({
  position,
  line1,
  line2,
  color = '#7c5cfc',
}: {
  position: [number, number, number]
  line1: string
  line2?: string
  color?: string
}) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[3.4, 0.72, 0.1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[0.06, 0.6, 0.06]} />
        <meshStandardMaterial color="#999" metalness={0.5} roughness={0.4} />
      </mesh>
      <Html position={[0, 0, 0.06]} center distanceFactor={14} zIndexRange={[0, 2]}>
        <div style={{
          color: '#fff', fontWeight: 800, fontSize: '15px', lineHeight: 1.3,
          whiteSpace: 'nowrap', textAlign: 'center', pointerEvents: 'none',
          userSelect: 'none', textShadow: '0 1px 3px rgba(0,0,0,0.6)',
        }}>
          {line1}
          {line2 && <div style={{ fontSize: '12px', opacity: 0.85 }}>{line2}</div>}
        </div>
      </Html>
    </group>
  )
}

// ── Shelf unit with varied products ───────────────────────────────────────────
const PRODUCT_COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
  '#1abc9c', '#e67e22', '#c0392b', '#16a085', '#8e44ad',
  '#d35400', '#27ae60',
]

type TexMaps = { map: THREE.Texture; normalMap: THREE.Texture; roughnessMap: THREE.Texture }

function ShelfUnit({ position, width = 2.5, seed = 0, shelfMaps }: {
  position: [number, number, number]
  width?: number
  seed?: number
  shelfMaps?: TexMaps
}) {
  const cols = Math.floor(width / 0.29)

  return (
    <group position={position}>
      {/* Back panel */}
      <mesh position={[0, 1, -0.25]} receiveShadow>
        <boxGeometry args={[width, 2, 0.06]} />
        {shelfMaps
          ? <meshStandardMaterial {...shelfMaps} color="#c8a870" roughness={0.85} />
          : <meshStandardMaterial color="#6b5230" roughness={0.9} />}
      </mesh>
      {/* Side panels */}
      {([-width / 2, width / 2] as const).map((x, i) => (
        <mesh key={i} position={[x, 1, 0]} receiveShadow>
          <boxGeometry args={[0.06, 2, 0.5]} />
          {shelfMaps
            ? <meshStandardMaterial {...shelfMaps} color="#c8a870" roughness={0.85} />
            : <meshStandardMaterial color="#7a5e32" roughness={0.85} />}
        </mesh>
      ))}

      {/* Shelf levels with products */}
      {[0.3, 0.95, 1.6].map((y, si) => (
        <group key={si}>
          {/* Shelf board */}
          <mesh position={[0, y, 0]} receiveShadow castShadow>
            <boxGeometry args={[width, 0.07, 0.5]} />
            {shelfMaps
              ? <meshStandardMaterial {...shelfMaps} color="#d4b07a" roughness={0.8} />
              : <meshStandardMaterial color="#9b7a3c" roughness={0.8} metalness={0.05} />}
          </mesh>
          {/* Price strip */}
          <mesh position={[0, y - 0.05, 0.26]}>
            <boxGeometry args={[width, 0.06, 0.02]} />
            <meshStandardMaterial color="#e8e8e0" roughness={0.9} />
          </mesh>

          {/* Products */}
          {Array.from({ length: cols }, (_, ci) => {
            const colIdx  = (seed * 13 + si * 7 + ci * 3) % PRODUCT_COLORS.length
            const typeIdx = (seed * 5  + si * 4 + ci * 7) % 4
            const px      = (ci - (cols - 1) / 2) * 0.29
            const color   = PRODUCT_COLORS[colIdx]
            const labelColor = PRODUCT_COLORS[(colIdx + 3) % PRODUCT_COLORS.length]

            if (typeIdx === 1) {
              // Tin can
              return (
                <group key={ci} position={[px, y + 0.155, 0]}>
                  <mesh castShadow>
                    <cylinderGeometry args={[0.09, 0.09, 0.28, 10]} />
                    <meshStandardMaterial color={color} roughness={0.5} metalness={0.2} />
                  </mesh>
                  {/* Label band */}
                  <mesh position={[0, 0, 0]}>
                    <cylinderGeometry args={[0.092, 0.092, 0.16, 10]} />
                    <meshStandardMaterial color={labelColor} roughness={0.7} />
                  </mesh>
                </group>
              )
            }
            if (typeIdx === 2) {
              // Bottle / tall product
              return (
                <group key={ci} position={[px, y + 0.22, 0]}>
                  <mesh castShadow>
                    <cylinderGeometry args={[0.065, 0.08, 0.42, 8]} />
                    <meshStandardMaterial color={color} roughness={0.3} metalness={0.05} transparent opacity={0.82} />
                  </mesh>
                  {/* Cap */}
                  <mesh position={[0, 0.24, 0]}>
                    <cylinderGeometry args={[0.04, 0.04, 0.07, 8]} />
                    <meshStandardMaterial color="#ddd" metalness={0.6} roughness={0.3} />
                  </mesh>
                </group>
              )
            }
            if (typeIdx === 3) {
              // Wide flat box (cereal / pasta)
              return (
                <mesh key={ci} position={[px, y + 0.2, 0]} castShadow>
                  <boxGeometry args={[0.26, 0.38, 0.12]} />
                  <meshStandardMaterial color={color} roughness={0.8} />
                </mesh>
              )
            }
            // Default: standard box
            return (
              <mesh key={ci} position={[px, y + 0.16, 0]} castShadow>
                <boxGeometry args={[0.22, 0.28, 0.22]} />
                <meshStandardMaterial color={color} roughness={0.75} />
              </mesh>
            )
          })}
        </group>
      ))}

      {/* Top cap */}
      <mesh position={[0, 2.02, 0]}>
        <boxGeometry args={[width, 0.07, 0.5]} />
        {shelfMaps
          ? <meshStandardMaterial {...shelfMaps} color="#d4b07a" roughness={0.8} />
          : <meshStandardMaterial color="#9b7a3c" roughness={0.8} />}
      </mesh>
    </group>
  )
}

// ── End-cap display stand ──────────────────────────────────────────────────────
function EndCap({ position, rotation = 0, seed = 0 }: {
  position: [number, number, number]
  rotation?: number
  seed?: number
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Base */}
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <boxGeometry args={[1.6, 0.12, 0.6]} />
        <meshStandardMaterial color="#555570" roughness={0.6} metalness={0.3} />
      </mesh>
      {/* Display back */}
      <mesh position={[0, 0.85, -0.27]} castShadow>
        <boxGeometry args={[1.6, 1.5, 0.06]} />
        <meshStandardMaterial color="#3a3a55" roughness={0.7} />
      </mesh>
      {/* 2 shelf levels */}
      {[0.4, 0.9].map((y, li) => (
        <group key={li}>
          <mesh position={[0, y, 0]}>
            <boxGeometry args={[1.5, 0.05, 0.5]} />
            <meshStandardMaterial color="#7a5e32" roughness={0.8} />
          </mesh>
          {/* Promo products */}
          {[-0.45, -0.15, 0.15, 0.45].map((x, pi) => {
            const c = PRODUCT_COLORS[(seed + li * 4 + pi) % PRODUCT_COLORS.length]
            return (
              <mesh key={pi} position={[x, y + 0.16, 0]} castShadow>
                <boxGeometry args={[0.24, 0.28, 0.22]} />
                <meshStandardMaterial color={c} roughness={0.75} />
              </mesh>
            )
          })}
        </group>
      ))}
      {/* Promo sign */}
      <mesh position={[0, 1.5, -0.24]}>
        <boxGeometry args={[1.3, 0.3, 0.04]} />
        <meshStandardMaterial color="#e74c3c" emissive="#e74c3c" emissiveIntensity={0.2} roughness={0.6} />
      </mesh>
    </group>
  )
}

// ── Refrigerator unit (glass doors) ───────────────────────────────────────────
function FridgeUnit({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Main cabinet */}
      <mesh position={[0, 1.15, 0]} receiveShadow castShadow>
        <boxGeometry args={[1.8, 2.3, 0.55]} />
        <meshStandardMaterial color="#c8d0d8" roughness={0.25} metalness={0.5} />
      </mesh>
      {/* Glass door */}
      <mesh position={[0, 1.1, 0.29]}>
        <boxGeometry args={[1.6, 2.0, 0.04]} />
        <meshStandardMaterial
          color="#a8c8e8"
          transparent
          opacity={0.28}
          roughness={0.05}
          metalness={0.1}
        />
      </mesh>
      {/* Door frame */}
      <mesh position={[0, 1.1, 0.3]}>
        <boxGeometry args={[1.65, 2.05, 0.03]} />
        <meshStandardMaterial color="#a0a8b0" roughness={0.3} metalness={0.6} wireframe />
      </mesh>
      {/* Door handle */}
      <mesh position={[0.7, 1.1, 0.33]}>
        <cylinderGeometry args={[0.018, 0.018, 1.4, 8]} />
        <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Interior shelves with products */}
      {[0.4, 0.9, 1.4, 1.9].map((y, si) => (
        <group key={si}>
          <mesh position={[0, y, 0]}>
            <boxGeometry args={[1.5, 0.04, 0.38]} />
            <meshStandardMaterial color="#d0d8e0" roughness={0.4} metalness={0.3} />
          </mesh>
          {[-0.5, -0.15, 0.2, 0.55].map((x, pi) => {
            const c = PRODUCT_COLORS[(si * 7 + pi * 3) % PRODUCT_COLORS.length]
            return (
              <mesh key={pi} position={[x, y + 0.13, 0]}>
                <cylinderGeometry args={[0.07, 0.07, 0.22, 8]} />
                <meshStandardMaterial color={c} roughness={0.5} metalness={0.1} />
              </mesh>
            )
          })}
        </group>
      ))}
    </group>
  )
}

// ── Shopping trolley ───────────────────────────────────────────────────────────
function Trolley({ position, rotation = 0 }: {
  position: [number, number, number]
  rotation?: number
}) {
  const METAL = { color: '#b0b8c0', metalness: 0.7, roughness: 0.3 } as const
  const WIRE  = { color: '#9aa0a8', metalness: 0.5, roughness: 0.5, wireframe: true } as const
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Wire basket */}
      <mesh position={[0, 0.88, 0]}>
        <boxGeometry args={[0.88, 0.48, 0.52]} />
        <meshStandardMaterial {...WIRE} />
      </mesh>
      {/* Bottom panel */}
      <mesh position={[0, 0.65, 0]}>
        <boxGeometry args={[0.84, 0.04, 0.48]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      {/* Top rim */}
      <mesh position={[0, 1.14, 0]}>
        <boxGeometry args={[0.9, 0.04, 0.54]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      {/* Handle */}
      <mesh position={[-0.46, 1.02, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.018, 0.018, 0.88, 8]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      {/* 4 legs */}
      {([[-0.38, -0.22], [0.38, -0.22], [-0.38, 0.22], [0.38, 0.22]] as const).map(([x, z], i) => (
        <mesh key={i} position={[x, 0.33, z]}>
          <cylinderGeometry args={[0.012, 0.012, 0.5, 6]} />
          <meshStandardMaterial {...METAL} />
        </mesh>
      ))}
      {/* Wheels */}
      {([[-0.38, -0.22], [0.38, -0.22], [-0.38, 0.22], [0.38, 0.22]] as const).map(([x, z], i) => (
        <mesh key={i} position={[x, 0.085, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.075, 0.075, 0.055, 10]} />
          <meshStandardMaterial color="#222" roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

// ── Produce bin ────────────────────────────────────────────────────────────────
function ProduceBin({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.3, 0]} receiveShadow castShadow>
        <boxGeometry args={[1.4, 0.6, 1]} />
        <meshStandardMaterial color="#6b4226" roughness={0.9} />
      </mesh>
      {/* Front price label */}
      <mesh position={[0, 0.22, 0.52]}>
        <boxGeometry args={[1.2, 0.18, 0.02]} />
        <meshStandardMaterial color="#fff8e0" roughness={1} />
      </mesh>
      {Array.from({ length: 10 }, (_, i) => (
        <mesh
          key={i}
          position={[
            ((i % 4) - 1.5) * 0.32,
            0.73,
            Math.floor(i / 4) * 0.36 - 0.18,
          ]}
          castShadow
        >
          <sphereGeometry args={[0.14, 8, 8]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
      ))}
    </group>
  )
}

// ── Checkout counter ───────────────────────────────────────────────────────────
function CheckoutCounter({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 1, 0.85]} />
        <meshStandardMaterial color="#4a4a62" roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Conveyor belt */}
      <mesh position={[0, 1.02, 0]}>
        <boxGeometry args={[2, 0.06, 0.72]} />
        <meshStandardMaterial color="#1a1a22" roughness={0.8} />
      </mesh>
      {/* Belt texture lines */}
      {[-0.7, -0.3, 0.1, 0.5, 0.9].map((x, i) => (
        <mesh key={i} position={[x, 1.06, 0]}>
          <boxGeometry args={[0.06, 0.01, 0.7]} />
          <meshStandardMaterial color="#2a2a30" roughness={1} />
        </mesh>
      ))}
      {/* Screen */}
      <mesh position={[0.72, 1.42, -0.22]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.48, 0.38, 0.04]} />
        <meshStandardMaterial color="#111" emissive="#1a3a2a" emissiveIntensity={0.7} roughness={0.2} />
      </mesh>
      {/* Divider */}
      <mesh position={[0, 1.18, -0.35]}>
        <boxGeometry args={[0.04, 0.3, 0.04]} />
        <meshStandardMaterial color="#888" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  )
}

// ── Ceiling light fixture ──────────────────────────────────────────────────────
function CeilingLight({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Fixture housing */}
      <mesh>
        <boxGeometry args={[2.6, 0.1, 0.44]} />
        <meshStandardMaterial color="#e8e8e0" emissive="#fffbe8" emissiveIntensity={0.5} roughness={0.4} />
      </mesh>
      {/* Tube glow */}
      <mesh position={[0, -0.06, 0]}>
        <boxGeometry args={[2.4, 0.04, 0.08]} />
        <meshStandardMaterial color="#fffef0" emissive="#fffef0" emissiveIntensity={1.8} />
      </mesh>
    </group>
  )
}

// ── Main scene ─────────────────────────────────────────────────────────────────
export default function SupermarketScene() {
  // ── Poly Haven textures ────────────────────────────────────────────────────
  const floorMaps = useTexture({
    map:          '/textures/floor_color.jpg',
    normalMap:    '/textures/floor_normal.jpg',
    roughnessMap: '/textures/floor_roughness.jpg',
  })
  const wallMaps = useTexture({
    map:          '/textures/wall_color.jpg',
    normalMap:    '/textures/wall_normal.jpg',
    roughnessMap: '/textures/wall_roughness.jpg',
  })
  const shelfMaps = useTexture({
    map:          '/textures/shelf_color.jpg',
    normalMap:    '/textures/shelf_normal.jpg',
    roughnessMap: '/textures/shelf_roughness.jpg',
  })

  useEffect(() => {
    const configure = (maps: typeof floorMaps, rs: number, rt: number) =>
      Object.values(maps).forEach(t => {
        t.wrapS = t.wrapT = THREE.RepeatWrapping
        t.repeat.set(rs, rt)
        t.anisotropy = 8
        t.needsUpdate = true
      })
    configure(floorMaps,  28, 75)   // floor: ~1.4 m tiles across 40 × 108 m
    configure(wallMaps,   20, 2.5)  // wall:  ~2 m tiles
    configure(shelfMaps,   5, 1)    // shelves: 5 tiles per 2.5 m span
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Grid of ceiling point-lights covering the full 108 m depth
  const LIGHT_XS = [-8,  8] as const
  const LIGHT_ZS = [12, -2, -16, -30, -44, -58, -70] as const

  // End-cap positions — one pair per 3 aisle rows
  const END_CAP_ZS = [7, -2, -12, -21, -30, -39, -48, -57, -66].map((z, i) => ({ z, seed: i * 2 }))

  return (
    <group>
      {/* ── Lighting ────────────────────────────────────────────────── */}
      <ambientLight intensity={0.55} color="#ffe8cc" />

      {/* Single shadow-casting directional (front half only) */}
      <directionalLight
        position={[4, 14, 18]}
        intensity={0.6}
        color="#fff4e0"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-bias={-0.001}
      />

      {/* Grid of ceiling fills — no shadows, cover the full depth */}
      {LIGHT_XS.map(x => LIGHT_ZS.map(z => (
        <pointLight key={`pl-${x}-${z}`} position={[x, 4.5, z]} intensity={32} color="#fff8ee" distance={22} decay={2} />
      )))}
      {/* Centre aisle lights */}
      {LIGHT_ZS.map(z => (
        <pointLight key={`plc-${z}`} position={[0, 4.5, z]} intensity={22} color="#fff8ee" distance={20} decay={2} />
      ))}

      {/* Zone accents */}
      <pointLight position={[ 0, 2.5, -73]} intensity={6}  color="#88bbff" distance={18} decay={2} />
      <pointLight position={[-16, 2.5,  3]} intensity={4}  color="#d8f0d8" distance={12} decay={2} />
      <pointLight position={[ 0, 3.5,  24]} intensity={7}  color="#ffe4b0" distance={20} decay={2} />
      <pointLight position={[ 0, 3.0, -35]} intensity={5}  color="#ffeecc" distance={18} decay={2} />

      {/* ── Floor ──────────────────────────────────────────────────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -25]} receiveShadow>
        <planeGeometry args={[40, 108]} />
        <meshStandardMaterial {...floorMaps} roughness={0.18} metalness={0.04} />
      </mesh>

      {/* ── Ceiling ────────────────────────────────────────────────── */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5, -25]}>
        <planeGeometry args={[40, 108]} />
        <meshStandardMaterial color="#f0eeea" roughness={1} />
      </mesh>
      {/* Ceiling grid beams */}
      {[-15, -5, 5, 15].map(x =>
        [-65, -45, -25, -5, 15].map(z => (
          <mesh key={`cgrid-${x}-${z}`} position={[x, 4.96, z]}>
            <boxGeometry args={[0.1, 0.08, 22]} />
            <meshStandardMaterial color="#d8d4ce" roughness={0.9} />
          </mesh>
        ))
      )}

      {/* ── Ceiling light fixtures ──────────────────────────────────── */}
      {[-10, -2, 6, 14].map(x =>
        [10, -3, -16, -29, -42, -55, -68].map(z => (
          <CeilingLight key={`clf-${x}-${z}`} position={[x, 4.9, z]} />
        ))
      )}

      {/* ── Ceiling fans (spread along depth) ───────────────────────── */}
      <CeilingFan position={[-8, 4.82,  14]} speed={2.0} />
      <CeilingFan position={[ 8, 4.82,  14]} speed={2.4} />
      <CeilingFan position={[ 0, 4.82,  -1]} speed={1.8} />
      <CeilingFan position={[-8, 4.82, -16]} speed={2.2} />
      <CeilingFan position={[ 8, 4.82, -32]} speed={2.0} />
      <CeilingFan position={[ 0, 4.82, -48]} speed={2.3} />
      <CeilingFan position={[-8, 4.82, -64]} speed={1.9} />

      {/* ── Walls ──────────────────────────────────────────────────── */}
      {/* Back wall */}
      <mesh position={[0, 2.5, -78]} receiveShadow>
        <boxGeometry args={[40, 5, 0.3]} />
        <meshStandardMaterial {...wallMaps} color="#f0ede8" roughness={0.88} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-20, 2.5, -25]} receiveShadow>
        <boxGeometry args={[0.3, 5, 108]} />
        <meshStandardMaterial {...wallMaps} color="#f0ede8" roughness={0.88} />
      </mesh>
      {/* Right wall */}
      <mesh position={[20, 2.5, -25]} receiveShadow>
        <boxGeometry args={[0.3, 5, 108]} />
        <meshStandardMaterial {...wallMaps} color="#f0ede8" roughness={0.88} />
      </mesh>
      {/* Front — left of entrance */}
      <mesh position={[-11, 2.5, 28]}>
        <boxGeometry args={[18, 5, 0.3]} />
        <meshStandardMaterial {...wallMaps} color="#f0ede8" roughness={0.88} />
      </mesh>
      {/* Front — right of entrance */}
      <mesh position={[11, 2.5, 28]}>
        <boxGeometry args={[18, 5, 0.3]} />
        <meshStandardMaterial {...wallMaps} color="#f0ede8" roughness={0.88} />
      </mesh>

      {/* Skirting boards */}
      <mesh position={[0, 0.12, -77.85]}>
        <boxGeometry args={[40, 0.24, 0.06]} />
        <meshStandardMaterial color="#d0cac0" roughness={0.8} />
      </mesh>
      <mesh position={[-19.85, 0.12, -25]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[108, 0.24, 0.06]} />
        <meshStandardMaterial color="#d0cac0" roughness={0.8} />
      </mesh>
      <mesh position={[19.85, 0.12, -25]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[108, 0.24, 0.06]} />
        <meshStandardMaterial color="#d0cac0" roughness={0.8} />
      </mesh>

      {/* ── Entry mat ──────────────────────────────────────────────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 25]} receiveShadow>
        <planeGeometry args={[8, 3.5]} />
        <meshStandardMaterial color="#2a2a42" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 25]}>
        <planeGeometry args={[7.6, 0.25]} />
        <meshStandardMaterial color="#7c5cfc" emissive="#7c5cfc" emissiveIntensity={0.3} roughness={0.8} />
      </mesh>

      {/* ── Checkout counters (z ≈ 22) ─────────────────────────────── */}
      {[-7, -3, 3, 7].map(x => (
        <CheckoutCounter key={x} position={[x, 0, 22]} />
      ))}
      {[-5, -1, 1, 5].map(x => (
        <mesh key={x} position={[x, 0.7, 22]}>
          <boxGeometry args={[0.06, 1.4, 1.2]} />
          <meshStandardMaterial color="#555570" roughness={0.5} metalness={0.3} />
        </mesh>
      ))}

      {/* ── Shelf aisles (4 columns × 9 rows) ──────────────────────── */}
      {SHELF_ROWS_Z.map((z, ri) =>
        SHELF_X.map((x, ci) => (
          <ShelfUnit
            key={`shelf-${ri}-${ci}`}
            position={[x, 0, z]}
            width={2.5}
            seed={ri * 4 + ci}
            shelfMaps={shelfMaps as TexMaps}
          />
        ))
      )}

      {/* ── End-cap displays (both ends of each aisle row) ──────────── */}
      {END_CAP_ZS.map(({ z, seed }) => (
        <group key={`ec-${z}`}>
          <EndCap position={[-16.5, 0, z]} rotation={Math.PI / 2}  seed={seed}     />
          <EndCap position={[ 15.5, 0, z]} rotation={-Math.PI / 2} seed={seed + 1} />
        </group>
      ))}

      {/* ── Produce section (left wall, near entrance) ──────────────── */}
      <ProduceBin position={[-15.5, 0,  2]} color="#2ecc71" />
      <ProduceBin position={[-15.5, 0,  5]} color="#e74c3c" />
      <ProduceBin position={[-15.5, 0,  8]} color="#f39c12" />
      <ProduceBin position={[-15.5, 0, -1]} color="#9b59b6" />
      <ProduceBin position={[-15.5, 0, -4]} color="#e67e22" />
      <mesh position={[-18.8, 1.2, 3.5]}>
        <boxGeometry args={[2.2, 2.4, 14]} />
        <meshStandardMaterial color="#3a5c3a" roughness={0.9} />
      </mesh>

      {/* ── Refrigerator wall (z ≈ -75.5) ───────────────────────────── */}
      {[-14, -10, -6, -2, 2, 6, 10, 14].map((x, i) => (
        <FridgeUnit key={i} position={[x, 0, -75.5]} />
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, -75]}>
        <planeGeometry args={[32, 1.5]} />
        <meshStandardMaterial color="#b8c8d8" roughness={0.3} metalness={0.1} />
      </mesh>

      {/* ── Shopping trolleys (near entrance) ───────────────────────── */}
      <Trolley position={[ 5, 0, 23]} rotation={0.3}  />
      <Trolley position={[ 7, 0, 22]} rotation={0.1}  />
      <Trolley position={[-5, 0, 23]} rotation={-0.2} />
      <Trolley position={[-8, 0, 24]} rotation={0.5}  />

      {/* ── Aisle hanging signs ─────────────────────────────────────── */}
      {/* Row 1 (z=6) */}
      <AisleSign position={[-8,  3.85,  7]}  line1="Aisle 1" line2="Tinned Goods · Canned Veg" />
      <AisleSign position={[ 0,  3.85,  7]}  line1="Aisle 2" line2="Cereals &amp; Breakfast"   color="#1a7a4a" />
      <AisleSign position={[ 8,  3.85,  7]}  line1="Aisle 3" line2="World Foods &amp; Baking"  color="#8e4400" />
      {/* Row 2 (z=-3) */}
      <AisleSign position={[-8,  3.85, -2]}  line1="Aisle 1" line2="Pasta · Rice · Sauces" />
      <AisleSign position={[ 0,  3.85, -2]}  line1="Aisle 2" line2="Biscuits · Snacks"         color="#1a7a4a" />
      <AisleSign position={[ 8,  3.85, -2]}  line1="Aisle 3" line2="Coconut · Spices · Oils"   color="#8e4400" />
      {/* Row 3 (z=-12) */}
      <AisleSign position={[-8,  3.85, -11]} line1="Aisle 1" line2="Soups · Stocks · Sauces" />
      <AisleSign position={[ 0,  3.85, -11]} line1="Aisle 2" line2="Spreads · Condiments"      color="#1a7a4a" />
      <AisleSign position={[ 8,  3.85, -11]} line1="Aisle 3" line2="International Foods"       color="#8e4400" />
      {/* Row 4 (z=-21) */}
      <AisleSign position={[-8,  3.85, -20]} line1="Aisle 1" line2="Meat · Fish · Deli" />
      <AisleSign position={[ 0,  3.85, -20]} line1="Aisle 2" line2="Dairy · Eggs · Cheese"     color="#1a7a4a" />
      <AisleSign position={[ 8,  3.85, -20]} line1="Aisle 3" line2="Frozen Foods"              color="#2255aa" />
      {/* Row 5 (z=-30) */}
      <AisleSign position={[-8,  3.85, -29]} line1="Aisle 1" line2="Soft Drinks · Juices" />
      <AisleSign position={[ 0,  3.85, -29]} line1="Aisle 2" line2="Tea · Coffee · Hot Drinks"  color="#1a7a4a" />
      <AisleSign position={[ 8,  3.85, -29]} line1="Aisle 3" line2="Alcohol · Beer · Wine"     color="#8e4400" />
      {/* Row 6 (z=-39) */}
      <AisleSign position={[-8,  3.85, -38]} line1="Aisle 1" line2="Household · Cleaning" />
      <AisleSign position={[ 0,  3.85, -38]} line1="Aisle 2" line2="Laundry · Paper Goods"     color="#1a7a4a" />
      <AisleSign position={[ 8,  3.85, -38]} line1="Aisle 3" line2="Health &amp; Beauty"       color="#8e4400" />
      {/* Rows 7–9 deep zone */}
      <AisleSign position={[-8,  3.85, -47]} line1="Aisle 1" line2="Baby · Nappies · Formula" />
      <AisleSign position={[ 0,  3.85, -47]} line1="Aisle 2" line2="Pet Food &amp; Accessories" color="#1a7a4a" />
      <AisleSign position={[ 8,  3.85, -47]} line1="Aisle 3" line2="Pharmacy · Vitamins"       color="#8e4400" />
      <AisleSign position={[-8,  3.85, -56]} line1="Aisle 1" line2="Stationery · Gifts" />
      <AisleSign position={[ 8,  3.85, -56]} line1="Aisle 3" line2="Seasonal · Home Décor"     color="#8e4400" />
      <AisleSign position={[-8,  3.85, -65]} line1="Aisle 1" line2="Electronics · Tech" />
      <AisleSign position={[ 8,  3.85, -65]} line1="Aisle 3" line2="Clothing · Accessories"    color="#8e4400" />
      {/* Special zone signs */}
      <AisleSign position={[-18, 3.0,   4]}  line1="🥦 Fresh Produce"                           color="#1a6b3c" />
      <AisleSign position={[ 0,  3.5,  18]}  line1="🛒 Checkouts"                               color="#333355" />
      <AisleSign position={[ 0,  3.2, -73]}  line1="❄️ Refrigerated"                            color="#2255aa" />

      {/* ── Bakery counter (back of store near fridges) ──────────────── */}
      <mesh position={[0, 0.5, -76.5]} castShadow receiveShadow>
        <boxGeometry args={[6, 1, 0.7]} />
        <meshStandardMaterial color="#8b6914" roughness={0.7} metalness={0.05} />
      </mesh>
      <mesh position={[0, 1.04, -76.5]}>
        <boxGeometry args={[6, 0.05, 0.7]} />
        <meshStandardMaterial color="#c8a855" roughness={0.4} metalness={0.2} />
      </mesh>
      <mesh position={[0, 4.2, -76.9]}>
        <boxGeometry args={[7, 0.9, 0.1]} />
        <meshStandardMaterial color="#7c5cfc" emissive="#7c5cfc" emissiveIntensity={0.35} roughness={0.6} />
      </mesh>
      {[-2, -1, 0, 1, 2].map((x, i) => (
        <mesh key={i} position={[x, 1.22, -76.5]} castShadow>
          <sphereGeometry args={[0.18, 10, 6]} />
          <meshStandardMaterial color="#c8944a" roughness={0.8} />
        </mesh>
      ))}

      {/* ── Info board near entrance ─────────────────────────────────── */}
      <mesh position={[-17, 1.4, 25]}>
        <boxGeometry args={[0.08, 1.6, 1.1]} />
        <meshStandardMaterial color="#333" roughness={0.7} />
      </mesh>
      <mesh position={[-17, 1.4, 25.05]}>
        <boxGeometry args={[0.04, 1.4, 0.9]} />
        <meshStandardMaterial color="#2a4a2a" emissive="#1a3a1a" emissiveIntensity={0.2} roughness={0.8} />
      </mesh>
    </group>
  )
}
