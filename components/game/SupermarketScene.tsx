'use client'

import * as THREE from 'three'

// A single shelf unit: frame + 3 shelf levels + coloured product boxes
function ShelfUnit({
  position,
  width = 2.5,
  seed = 0,
}: {
  position: [number, number, number]
  width?: number
  seed?: number
}) {
  const PRODUCT_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#c0392b']
  const cols = Math.floor(width / 0.28)

  return (
    <group position={position}>
      {/* Back panel */}
      <mesh position={[0, 1, -0.25]}>
        <boxGeometry args={[width, 2, 0.06]} />
        <meshStandardMaterial color="#5a4a2a" />
      </mesh>
      {/* Shelf boards at 3 heights */}
      {[0.3, 0.95, 1.6].map((y, si) => (
        <group key={si}>
          <mesh position={[0, y, 0]}>
            <boxGeometry args={[width, 0.06, 0.5]} />
            <meshStandardMaterial color="#8b6914" />
          </mesh>
          {/* Products sitting on each shelf */}
          {Array.from({ length: cols }, (_, ci) => {
            const colIdx = (seed * 17 + si * 7 + ci) % PRODUCT_COLORS.length
            return (
              <mesh
                key={ci}
                position={[
                  (ci - (cols - 1) / 2) * 0.28,
                  y + 0.16,
                  0,
                ]}
              >
                <boxGeometry args={[0.22, 0.28, 0.22]} />
                <meshStandardMaterial color={PRODUCT_COLORS[colIdx]} />
              </mesh>
            )
          })}
        </group>
      ))}
    </group>
  )
}

// Produce bin (open top bin with sphere "produce" inside)
function ProduceBin({
  position,
  color,
}: {
  position: [number, number, number]
  color: string
}) {
  return (
    <group position={position}>
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[1.4, 0.6, 1]} />
        <meshStandardMaterial color="#5a3e1b" />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => (
        <mesh
          key={i}
          position={[
            ((i % 4) - 1.5) * 0.32,
            0.72,
            Math.floor(i / 4) * 0.4 - 0.2,
          ]}
        >
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
    </group>
  )
}

// Checkout counter
function CheckoutCounter({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[2, 1, 0.85]} />
        <meshStandardMaterial color="#555570" />
      </mesh>
      {/* Conveyor */}
      <mesh position={[0, 1.02, 0]}>
        <boxGeometry args={[2, 0.05, 0.75]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      {/* Screen */}
      <mesh position={[0.7, 1.4, -0.2]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.5, 0.4, 0.04]} />
        <meshStandardMaterial color="#111" emissive="#1a3a2a" emissiveIntensity={0.6} />
      </mesh>
    </group>
  )
}

export default function SupermarketScene() {
  // Shelf rows: 4 units per row, wide aisles between them
  const SHELF_X = [-12, -4, 4, 12]
  const SHELF_ROWS_Z = [0, -10, -18]

  return (
    <group>
      {/* ── Lighting ── */}
      <ambientLight intensity={1.4} />
      <directionalLight position={[5, 12, 5]} intensity={0.5} />
      {/* Ceiling fluorescent strips */}
      {[-10, -3, 4, 11].map(x =>
        [-8, 0, -14].map(z => (
          <pointLight
            key={`light-${x}-${z}`}
            position={[x, 4.6, z]}
            intensity={0.9}
            distance={14}
            color="#fff8e8"
          />
        ))
      )}

      {/* ── Floor ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 46]} />
        <meshStandardMaterial color="#d8d4cc" />
      </mesh>
      {/* Tile grid lines */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <planeGeometry args={[40, 46, 20, 23]} />
        <meshStandardMaterial color="#b8b4ac" wireframe opacity={0.35} transparent />
      </mesh>

      {/* ── Ceiling ── */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5, 0]}>
        <planeGeometry args={[40, 46]} />
        <meshStandardMaterial color="#f4f4f0" />
      </mesh>

      {/* ── Walls ── */}
      {/* Back */}
      <mesh position={[0, 2.5, -23]}>
        <boxGeometry args={[40, 5, 0.3]} />
        <meshStandardMaterial color="#e8e4de" />
      </mesh>
      {/* Left */}
      <mesh position={[-20, 2.5, 0]}>
        <boxGeometry args={[0.3, 5, 46]} />
        <meshStandardMaterial color="#e8e4de" />
      </mesh>
      {/* Right */}
      <mesh position={[20, 2.5, 0]}>
        <boxGeometry args={[0.3, 5, 46]} />
        <meshStandardMaterial color="#e8e4de" />
      </mesh>
      {/* Front left of entrance */}
      <mesh position={[-11, 2.5, 23]}>
        <boxGeometry args={[18, 5, 0.3]} />
        <meshStandardMaterial color="#e8e4de" />
      </mesh>
      {/* Front right of entrance */}
      <mesh position={[11, 2.5, 23]}>
        <boxGeometry args={[18, 5, 0.3]} />
        <meshStandardMaterial color="#e8e4de" />
      </mesh>

      {/* ── Entry mat ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 21]}>
        <planeGeometry args={[8, 3]} />
        <meshStandardMaterial color="#2d2d4d" />
      </mesh>

      {/* ── Checkout counters ── */}
      {[-7, -3, 3, 7].map(x => (
        <CheckoutCounter key={x} position={[x, 0, 16]} />
      ))}

      {/* ── Shelf aisles ── */}
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

      {/* ── Produce section (left wall, near Priya) ── */}
      <ProduceBin position={[-14, 0, -3]} color="#2ecc71" />
      <ProduceBin position={[-14, 0,  0]} color="#e74c3c" />
      <ProduceBin position={[-14, 0,  3]} color="#f39c12" />

      {/* ── Bakery sign at the back ── */}
      <mesh position={[0, 4.2, -22.6]}>
        <boxGeometry args={[7, 0.9, 0.1]} />
        <meshStandardMaterial color="#7c5cfc" emissive="#7c5cfc" emissiveIntensity={0.3} />
      </mesh>
      {/* Bakery stripe below sign */}
      <mesh position={[0, 3.6, -22.6]}>
        <boxGeometry args={[7, 0.12, 0.1]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* ── Ceiling light fixtures (visual) ── */}
      {[-10, -3, 4, 11].map(x =>
        [-8, 0, -14].map(z => (
          <mesh key={`fixture-${x}-${z}`} position={[x, 4.9, z]}>
            <boxGeometry args={[2.5, 0.08, 0.4]} />
            <meshStandardMaterial color="#eeeeee" emissive="#fffbe0" emissiveIntensity={0.6} />
          </mesh>
        ))
      )}
    </group>
  )
}
