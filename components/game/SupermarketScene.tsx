'use client'

import { Html } from '@react-three/drei'
import * as THREE from 'three'

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

function ShelfUnit({ position, width = 2.5, seed = 0 }: {
  position: [number, number, number]
  width?: number
  seed?: number
}) {
  const cols = Math.floor(width / 0.29)

  return (
    <group position={position}>
      {/* Back panel */}
      <mesh position={[0, 1, -0.25]} receiveShadow>
        <boxGeometry args={[width, 2, 0.06]} />
        <meshStandardMaterial color="#6b5230" roughness={0.9} />
      </mesh>
      {/* Side panels */}
      {([-width / 2, width / 2] as const).map((x, i) => (
        <mesh key={i} position={[x, 1, 0]} receiveShadow>
          <boxGeometry args={[0.06, 2, 0.5]} />
          <meshStandardMaterial color="#7a5e32" roughness={0.85} />
        </mesh>
      ))}

      {/* Shelf levels with products */}
      {[0.3, 0.95, 1.6].map((y, si) => (
        <group key={si}>
          {/* Shelf board */}
          <mesh position={[0, y, 0]} receiveShadow castShadow>
            <boxGeometry args={[width, 0.07, 0.5]} />
            <meshStandardMaterial color="#9b7a3c" roughness={0.8} metalness={0.05} />
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
        <meshStandardMaterial color="#9b7a3c" roughness={0.8} />
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
      {/* Cool interior glow */}
      <pointLight position={[0, 1.5, 0]} intensity={0.6} color="#b0d8ff" distance={3.5} />
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
  const SHELF_X     = [-12, -4, 4, 12]
  const SHELF_ROWS_Z = [2, -8, -17]

  return (
    <group>
      {/* ── Lighting ─────────────────────────────────────────────────── */}
      {/* Soft ambient — warm indoor feel */}
      <ambientLight intensity={0.55} color="#ffe8cc" />

      {/* Main directional fill from above the entrance */}
      <directionalLight
        position={[4, 14, 18]}
        intensity={0.7}
        color="#fff4e0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={80}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-bias={-0.001}
      />

      {/* Ceiling SpotLights — warm white, pointing straight down */}
      {([-10, -2, 6, 14] as const).map(x =>
        ([-6, 4, -16] as const).map(z => (
          <spotLight
            key={`spot-${x}-${z}`}
            position={[x, 4.7, z]}
            target-position={[x, 0, z]}
            angle={0.45}
            penumbra={0.5}
            intensity={18}
            distance={12}
            color="#fff8ee"
            castShadow={false}
          />
        ))
      )}

      {/* Cool-blue accent light from the fridge section */}
      <pointLight position={[0, 2.5, -21]} intensity={3} color="#88bbff" distance={14} />
      <pointLight position={[0, 1.5, -21]} intensity={1.5} color="#aad0ff" distance={8} />

      {/* Warm accent near bakery back wall */}
      <pointLight position={[0, 3, -22.5]} intensity={4} color="#ffd090" distance={10} />

      {/* Produce section — slightly cooler, fresher */}
      <pointLight position={[-14, 2.5, 1]} intensity={5} color="#d8f0d8" distance={10} />

      {/* Entrance warm wash */}
      <pointLight position={[0, 3, 20]} intensity={6} color="#ffe4b0" distance={18} />

      {/* ── Floor ──────────────────────────────────────────────────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 50]} />
        <meshStandardMaterial color="#dedad4" roughness={0.12} metalness={0.04} />
      </mesh>
      {/* Tile grout lines */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
        <planeGeometry args={[40, 50, 20, 25]} />
        <meshStandardMaterial color="#c0bbb5" wireframe opacity={0.25} transparent />
      </mesh>

      {/* ── Ceiling ────────────────────────────────────────────────── */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5, 0]}>
        <planeGeometry args={[40, 50]} />
        <meshStandardMaterial color="#f0eeea" roughness={1} />
      </mesh>
      {/* Ceiling grid structure */}
      {[-15, -5, 5, 15].map(x =>
        [-20, -10, 0, 10, 20].map(z => (
          <mesh key={`cgrid-${x}-${z}`} position={[x, 4.96, z]}>
            <boxGeometry args={[0.1, 0.08, 20]} />
            <meshStandardMaterial color="#d8d4ce" roughness={0.9} />
          </mesh>
        ))
      )}

      {/* ── Ceiling light fixtures ──────────────────────────────────── */}
      {[-10, -2, 6, 14].map(x =>
        [-6, 4, -16].map(z => (
          <CeilingLight key={`clf-${x}-${z}`} position={[x, 4.9, z]} />
        ))
      )}

      {/* ── Walls ──────────────────────────────────────────────────── */}
      {/* Back wall — slightly warm */}
      <mesh position={[0, 2.5, -25]} receiveShadow>
        <boxGeometry args={[40, 5, 0.3]} />
        <meshStandardMaterial color="#ece6de" roughness={0.9} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-20, 2.5, 0]} receiveShadow>
        <boxGeometry args={[0.3, 5, 50]} />
        <meshStandardMaterial color="#ece6de" roughness={0.9} />
      </mesh>
      {/* Right wall */}
      <mesh position={[20, 2.5, 0]} receiveShadow>
        <boxGeometry args={[0.3, 5, 50]} />
        <meshStandardMaterial color="#ece6de" roughness={0.9} />
      </mesh>
      {/* Front — left of entrance */}
      <mesh position={[-11, 2.5, 25]}>
        <boxGeometry args={[18, 5, 0.3]} />
        <meshStandardMaterial color="#ece6de" roughness={0.9} />
      </mesh>
      {/* Front — right of entrance */}
      <mesh position={[11, 2.5, 25]}>
        <boxGeometry args={[18, 5, 0.3]} />
        <meshStandardMaterial color="#ece6de" roughness={0.9} />
      </mesh>

      {/* Skirting boards */}
      {[
        { pos: [0, 0.12, -24.85] as [number,number,number], rot: [0,0,0] as [number,number,number], w: 40 },
        { pos: [-19.85, 0.12, 0] as [number,number,number], rot: [0, Math.PI/2, 0] as [number,number,number], w: 50 },
        { pos: [19.85, 0.12, 0] as [number,number,number], rot: [0, Math.PI/2, 0] as [number,number,number], w: 50 },
      ].map((s, i) => (
        <mesh key={i} position={s.pos} rotation={s.rot}>
          <boxGeometry args={[s.w, 0.24, 0.06]} />
          <meshStandardMaterial color="#d0cac0" roughness={0.8} />
        </mesh>
      ))}

      {/* ── Entry mat ──────────────────────────────────────────────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 22]} receiveShadow>
        <planeGeometry args={[8, 3.5]} />
        <meshStandardMaterial color="#2a2a42" roughness={0.95} />
      </mesh>
      {/* Welcome strip */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 22]}>
        <planeGeometry args={[7.6, 0.25]} />
        <meshStandardMaterial color="#7c5cfc" emissive="#7c5cfc" emissiveIntensity={0.3} roughness={0.8} />
      </mesh>

      {/* ── Checkout counters ───────────────────────────────────────── */}
      {[-7, -3, 3, 7].map(x => (
        <CheckoutCounter key={x} position={[x, 0, 17]} />
      ))}
      {/* Checkout dividers */}
      {[-5, -1, 1, 5].map(x => (
        <mesh key={x} position={[x, 0.7, 17]}>
          <boxGeometry args={[0.06, 1.4, 1.2]} />
          <meshStandardMaterial color="#555570" roughness={0.5} metalness={0.3} />
        </mesh>
      ))}

      {/* ── Shelf aisles ────────────────────────────────────────────── */}
      {SHELF_ROWS_Z.map((z, ri) =>
        SHELF_X.map((x, ci) => (
          <ShelfUnit
            key={`shelf-${ri}-${ci}`}
            position={[x, 0, z]}
            width={2.5}
            seed={ri * 4 + ci}
          />
        ))
      )}

      {/* ── End-cap displays (end of each aisle row) ────────────────── */}
      <EndCap position={[-16.5, 0,  2.5]} rotation={Math.PI / 2}  seed={1} />
      <EndCap position={[-16.5, 0, -7.5]} rotation={Math.PI / 2}  seed={5} />
      <EndCap position={[ 15.5, 0,  2.5]} rotation={-Math.PI / 2} seed={3} />
      <EndCap position={[ 15.5, 0, -7.5]} rotation={-Math.PI / 2} seed={7} />

      {/* ── Produce section ─────────────────────────────────────────── */}
      <ProduceBin position={[-15.5, 0, -1]} color="#2ecc71" />
      <ProduceBin position={[-15.5, 0,  2]} color="#e74c3c" />
      <ProduceBin position={[-15.5, 0,  5]} color="#f39c12" />
      <ProduceBin position={[-15.5, 0, -4]} color="#9b59b6" />
      {/* Produce wall backing */}
      <mesh position={[-18.8, 1.2, 1.5]}>
        <boxGeometry args={[2.2, 2.4, 10]} />
        <meshStandardMaterial color="#3a5c3a" roughness={0.9} />
      </mesh>

      {/* ── Refrigerator section (back wall) ────────────────────────── */}
      {[-14, -10, -6, -2, 2, 6, 10, 14].map((x, i) => (
        <FridgeUnit key={i} position={[x, 0, -23.5]} />
      ))}
      {/* Fridge section floor strip */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, -23]}>
        <planeGeometry args={[32, 1.5]} />
        <meshStandardMaterial color="#b8c8d8" roughness={0.3} metalness={0.1} />
      </mesh>

      {/* ── Shopping trolleys ───────────────────────────────────────── */}
      <Trolley position={[ 5, 0, 20]} rotation={0.3}  />
      <Trolley position={[ 7, 0, 19]} rotation={0.1}  />
      <Trolley position={[-5, 0, 20]} rotation={-0.2} />
      <Trolley position={[-8, 0, 21]} rotation={0.5}  />

      {/* ── Aisle hanging signs ─────────────────────────────────────── */}
      <AisleSign position={[-8,  3.85,  4]} line1="Aisle 1" line2="Tinned Goods · Canned Veg" />
      <AisleSign position={[ 0,  3.85,  4]} line1="Aisle 2" line2="Cereals &amp; Breakfast"   color="#1a7a4a" />
      <AisleSign position={[ 8,  3.85,  4]} line1="Aisle 3" line2="World Foods &amp; Baking"  color="#8e4400" />
      <AisleSign position={[-18, 3.0,   2]} line1="🥦 Fresh Produce"                           color="#1a6b3c" />
      <AisleSign position={[ 0,  3.5,  15]} line1="🛒 Checkouts"                               color="#333355" />
      <AisleSign position={[-8,  3.85, -6]} line1="Aisle 1" line2="Pasta · Rice · Sauces" />
      <AisleSign position={[ 8,  3.85, -6]} line1="Aisle 3" line2="Coconut · Spices · Oils"   color="#8e4400" />
      <AisleSign position={[ 0,  3.85,-15]} line1="Aisle 2" line2="Biscuits · Snacks"          color="#1a7a4a" />
      <AisleSign position={[ 0,  3.2, -22]} line1="❄️ Refrigerated"                            color="#2255aa" />

      {/* ── Bakery counter at back ───────────────────────────────────── */}
      <mesh position={[0, 0.5, -24.2]} castShadow receiveShadow>
        <boxGeometry args={[6, 1, 0.7]} />
        <meshStandardMaterial color="#8b6914" roughness={0.7} metalness={0.05} />
      </mesh>
      <mesh position={[0, 1.04, -24.2]}>
        <boxGeometry args={[6, 0.05, 0.7]} />
        <meshStandardMaterial color="#c8a855" roughness={0.4} metalness={0.2} />
      </mesh>
      {/* Bakery sign */}
      <mesh position={[0, 4.2, -24.6]}>
        <boxGeometry args={[7, 0.9, 0.1]} />
        <meshStandardMaterial color="#7c5cfc" emissive="#7c5cfc" emissiveIntensity={0.35} roughness={0.6} />
      </mesh>
      {/* Bakery items on display */}
      {[-2, -1, 0, 1, 2].map((x, i) => (
        <mesh key={i} position={[x * 1.0, 1.22, -24.2]} castShadow>
          <sphereGeometry args={[0.18, 10, 6]} />
          <meshStandardMaterial color="#c8944a" roughness={0.8} />
        </mesh>
      ))}

      {/* ── Info board near entrance ─────────────────────────────────── */}
      <mesh position={[-17, 1.4, 22]}>
        <boxGeometry args={[0.08, 1.6, 1.1]} />
        <meshStandardMaterial color="#333" roughness={0.7} />
      </mesh>
      <mesh position={[-17, 1.4, 22.05]}>
        <boxGeometry args={[0.04, 1.4, 0.9]} />
        <meshStandardMaterial color="#2a4a2a" emissive="#1a3a1a" emissiveIntensity={0.2} roughness={0.8} />
      </mesh>
    </group>
  )
}
