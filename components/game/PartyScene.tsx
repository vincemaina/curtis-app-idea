'use client'


export default function PartyScene() {
  // Party string lights: 20 spheres from [-11, 3.0, 9] to [1, 3.0, -3]
  const partyLights = Array.from({ length: 20 }, (_, i) => {
    const t = i / 19
    return [
      -11 + t * 12,
      3.0,
      9 + t * -12,
    ] as [number, number, number]
  })

  // Garden fairy lights: 12 spheres along fence at z=-13.8, y=1.1, x from -10 to 10
  const gardenLights = Array.from({ length: 12 }, (_, i) => {
    const t = i / 11
    return [
      -10 + t * 20,
      1.1,
      -13.8,
    ] as [number, number, number]
  })

  // Coffee table legs at 4 corners: offset ±0.95 in x, ±0.5 in z from [-7, 0, 4]
  const coffeeTableLegs: [number, number, number][] = [
    [-7 + 0.95, 0.275, 4 + 0.5],
    [-7 - 0.95, 0.275, 4 + 0.5],
    [-7 + 0.95, 0.275, 4 - 0.5],
    [-7 - 0.95, 0.275, 4 - 0.5],
  ]

  // Books on bookshelf: 3 rows, 5 books each
  const bookColors = ['#cc4422', '#2244aa', '#22aa44', '#aaaa22', '#882288']
  const bookRows = [
    { y: 0.45, zStart: -11.8 },
    { y: 1.25, zStart: -11.8 },
    { y: 2.05, zStart: -11.8 },
  ]

  // Bottles on drinks table: 4 bottles spread in x
  const bottlePositions: [number, number, number][] = [
    [-1.6, 0.875, 8.5],
    [-1.1, 0.875, 8.5],
    [-0.6, 0.875, 8.5],
    [-0.1, 0.875, 8.5],
  ]

  // Bar stools around island (in front, i.e. +z side)
  const barStoolPositions: [number, number, number][] = [
    [4.0, 0.325, 5.5],
    [5.5, 0.325, 5.5],
    [7.0, 0.325, 5.5],
  ]

  // Garden chairs around patio table
  const gardenChairPositions: [number, number, number][] = [
    [-1.3, 0.4, -10],
    [1.3, 0.4, -10],
    [0, 0.4, -11.3],
    [0, 0.4, -8.7],
  ]

  // Garden bushes along fence
  const bushPositions: [number, number, number][] = [
    [-9, 0.6, -13.5],
    [-3, 0.6, -13.5],
    [3, 0.6, -13.5],
    [9, 0.6, -13.5],
  ]

  // Food platters on kitchen back counter: small colourful boxes
  const platterColors = ['#e8c4a0', '#f0a0a0', '#c8e0a0', '#a0c0e8']
  const platterPositions: [number, number, number][] = [
    [4, 0.93, -3.7],
    [6, 0.93, -3.7],
    [8, 0.93, -3.7],
    [10, 0.93, -3.7],
  ]

  // Ceiling light positions
  const ceilingLightPositions: [number, number, number][] = [
    [-6, 3.1, 6],
    [-6, 3.1, 0],
    [-2, 3.1, 6],
    [-2, 3.1, 0],
    [7, 3.1, 7],
    [7, 3.1, 2],
  ]

  return (
    <group>
      {/* ── Floors ─────────────────────────────────────────────────────── */}
      {/* Living room — warm oak */}
      <mesh position={[-5, -0.06, 3]} receiveShadow>
        <boxGeometry args={[14, 0.12, 14]} />
        <meshStandardMaterial color="#c8834a" roughness={0.7} metalness={0.05} />
      </mesh>
      {/* Kitchen — light tile */}
      <mesh position={[7, -0.06, 3]} receiveShadow>
        <boxGeometry args={[10, 0.12, 14]} />
        <meshStandardMaterial color="#e8e4d8" roughness={0.55} metalness={0.02} />
      </mesh>
      {/* Garden — grass */}
      <mesh position={[0, -0.06, -9]} receiveShadow>
        <boxGeometry args={[24, 0.12, 10]} />
        <meshStandardMaterial color="#4a8a38" roughness={0.9} metalness={0.0} />
      </mesh>

      {/* ── Walls ──────────────────────────────────────────────────────── */}
      {/* Left wall (living room outer, x=-12) */}
      <mesh position={[-12.1, 1.6, 3]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 3.2, 14]} />
        <meshStandardMaterial color="#f0ebe0" roughness={0.85} />
      </mesh>
      {/* Right wall (kitchen outer, x=12) */}
      <mesh position={[12.1, 1.6, 3]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 3.2, 14]} />
        <meshStandardMaterial color="#f0ebe0" roughness={0.85} />
      </mesh>
      {/* Front wall behind player (z=10) — two segments with 4m entrance gap */}
      <mesh position={[-8, 1.6, 10.1]} castShadow receiveShadow>
        <boxGeometry args={[8, 3.2, 0.2]} />
        <meshStandardMaterial color="#f0ebe0" roughness={0.85} />
      </mesh>
      <mesh position={[8, 1.6, 10.1]} castShadow receiveShadow>
        <boxGeometry args={[8, 3.2, 0.2]} />
        <meshStandardMaterial color="#f0ebe0" roughness={0.85} />
      </mesh>
      {/* Back wall at z=-4 (house/garden boundary) — two segments with 6m sliding door gap at x[-3,3] */}
      <mesh position={[-7.5, 1.6, -4.1]} castShadow receiveShadow>
        <boxGeometry args={[9, 3.2, 0.2]} />
        <meshStandardMaterial color="#f0ebe0" roughness={0.85} />
      </mesh>
      <mesh position={[7.5, 1.6, -4.1]} castShadow receiveShadow>
        <boxGeometry args={[9, 3.2, 0.2]} />
        <meshStandardMaterial color="#f0ebe0" roughness={0.85} />
      </mesh>
      {/* Internal wall between living room and kitchen (x=2) — two segments with 4m doorway gap at z[0,4] */}
      {/* Lower segment: z=-4 to 0 */}
      <mesh position={[2.1, 1.6, -2]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 3.2, 4]} />
        <meshStandardMaterial color="#f0ebe0" roughness={0.85} />
      </mesh>
      {/* Upper segment: z=4 to 10 */}
      <mesh position={[2.1, 1.6, 7]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 3.2, 6]} />
        <meshStandardMaterial color="#f0ebe0" roughness={0.85} />
      </mesh>
      {/* Garden fence (back, z=-14) */}
      <mesh position={[0, 0.6, -14.1]} castShadow receiveShadow>
        <boxGeometry args={[24, 1.2, 0.2]} />
        <meshStandardMaterial color="#7a5c3a" roughness={0.9} />
      </mesh>
      {/* Garden side fences */}
      <mesh position={[-12.1, 0.6, -9]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 1.2, 10]} />
        <meshStandardMaterial color="#7a5c3a" roughness={0.9} />
      </mesh>
      <mesh position={[12.1, 0.6, -9]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 1.2, 10]} />
        <meshStandardMaterial color="#7a5c3a" roughness={0.9} />
      </mesh>

      {/* ── Ceiling ────────────────────────────────────────────────────── */}
      {/* Living room ceiling */}
      <mesh position={[-5, 3.275, 3]}>
        <boxGeometry args={[14, 0.15, 14]} />
        <meshStandardMaterial color="#f5f0e8" roughness={0.9} />
      </mesh>
      {/* Kitchen ceiling */}
      <mesh position={[7, 3.275, 3]}>
        <boxGeometry args={[10, 0.15, 14]} />
        <meshStandardMaterial color="#f5f0e8" roughness={0.9} />
      </mesh>
      {/* Recessed ceiling lights */}
      {ceilingLightPositions.map((pos, i) => (
        <mesh key={`ceiling-light-${i}`} position={pos}>
          <sphereGeometry args={[0.15, 6, 6]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={1.5}
            roughness={0.1}
          />
        </mesh>
      ))}

      {/* ── Living Room Furniture ───────────────────────────────────────── */}
      {/* Sofa main seat */}
      <mesh position={[-9, 0.225, 6.5]} castShadow>
        <boxGeometry args={[5, 0.45, 1.2]} />
        <meshStandardMaterial color="#2a5a6a" roughness={0.8} />
      </mesh>
      {/* Sofa cushion backs */}
      <mesh position={[-9, 0.7, 7.05]} castShadow>
        <boxGeometry args={[5, 0.5, 0.2]} />
        <meshStandardMaterial color="#2a5a6a" roughness={0.8} />
      </mesh>
      {/* Sofa side arm */}
      <mesh position={[-11, 0.225, 5.75]} castShadow>
        <boxGeometry args={[1.2, 0.45, 2.5]} />
        <meshStandardMaterial color="#2a5a6a" roughness={0.8} />
      </mesh>
      {/* Sofa side arm back */}
      <mesh position={[-11.5, 0.7, 5.75]} castShadow>
        <boxGeometry args={[0.2, 0.5, 2.5]} />
        <meshStandardMaterial color="#2a5a6a" roughness={0.8} />
      </mesh>

      {/* Coffee table top */}
      <mesh position={[-7, 0.55, 4]} castShadow>
        <boxGeometry args={[2.2, 0.06, 1.2]} />
        <meshStandardMaterial color="#8b5e3c" roughness={0.65} metalness={0.05} />
      </mesh>
      {/* Coffee table legs */}
      {coffeeTableLegs.map((pos, i) => (
        <mesh key={`coffee-leg-${i}`} position={pos} castShadow>
          <boxGeometry args={[0.08, 0.55, 0.08]} />
          <meshStandardMaterial color="#6b4423" roughness={0.7} />
        </mesh>
      ))}

      {/* Bookshelf body */}
      <mesh position={[-11.8, 1.3, 2]} castShadow>
        <boxGeometry args={[0.35, 2.6, 1.8]} />
        <meshStandardMaterial color="#3a2010" roughness={0.85} />
      </mesh>
      {/* Book spines — 3 rows, 5 books each */}
      {bookRows.map((row, rowIdx) =>
        bookColors.map((color, bookIdx) => (
          <mesh
            key={`book-${rowIdx}-${bookIdx}`}
            position={[-11.62, row.y, 1.1 + bookIdx * -0.32]}
            castShadow
          >
            <boxGeometry args={[0.3, 0.2, 0.25]} />
            <meshStandardMaterial color={color} roughness={0.85} />
          </mesh>
        ))
      )}

      {/* Drinks/food table */}
      <mesh position={[-1, 0.425, 8.5]} castShadow>
        <boxGeometry args={[2.0, 0.85, 0.8]} />
        <meshStandardMaterial color="#f5f5f0" roughness={0.6} />
      </mesh>
      {/* Bottles on table */}
      {bottlePositions.map((pos, i) => (
        <mesh key={`bottle-${i}`} position={pos} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.35, 8]} />
          <meshStandardMaterial color="#2a5a2a" roughness={0.5} metalness={0.1} />
        </mesh>
      ))}

      {/* TV stand */}
      <mesh position={[-6, 0.25, -3]} castShadow>
        <boxGeometry args={[1.0, 0.5, 0.35]} />
        <meshStandardMaterial color="#222222" roughness={0.7} />
      </mesh>
      {/* TV screen */}
      <mesh position={[-6, 0.8, -3.15]} castShadow>
        <boxGeometry args={[1.4, 0.85, 0.05]} />
        <meshStandardMaterial color="#111111" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* TV screen glow — faint emissive */}
      <mesh position={[-6, 0.8, -3.12]}>
        <boxGeometry args={[1.3, 0.75, 0.01]} />
        <meshStandardMaterial color="#334466" emissive="#223355" emissiveIntensity={0.6} />
      </mesh>

      {/* Party string lights */}
      {partyLights.map((pos, i) => (
        <mesh key={`party-light-${i}`} position={pos}>
          <sphereGeometry args={[0.06, 4, 4]} />
          <meshStandardMaterial
            color="#ffcc44"
            emissive="#ffcc44"
            emissiveIntensity={2}
            roughness={0.3}
          />
        </mesh>
      ))}

      {/* ── Kitchen Furniture ────────────────────────────────────────────── */}
      {/* Right counter body */}
      <mesh position={[11.7, 0.45, 3]} castShadow receiveShadow>
        <boxGeometry args={[0.65, 0.9, 10]} />
        <meshStandardMaterial color="#f0f0ea" roughness={0.6} />
      </mesh>
      {/* Right counter worktop */}
      <mesh position={[11.7, 0.92, 3]}>
        <boxGeometry args={[0.65, 0.04, 10]} />
        <meshStandardMaterial color="#d8d4c8" roughness={0.5} metalness={0.05} />
      </mesh>
      {/* Back counter body */}
      <mesh position={[7, 0.45, -3.7]} castShadow receiveShadow>
        <boxGeometry args={[8, 0.9, 0.65]} />
        <meshStandardMaterial color="#f0f0ea" roughness={0.6} />
      </mesh>
      {/* Back counter worktop */}
      <mesh position={[7, 0.92, -3.7]}>
        <boxGeometry args={[8, 0.04, 0.65]} />
        <meshStandardMaterial color="#d8d4c8" roughness={0.5} metalness={0.05} />
      </mesh>
      {/* Food platters on back counter */}
      {platterPositions.map((pos, i) => (
        <mesh key={`platter-${i}`} position={pos} castShadow>
          <boxGeometry args={[1.0, 0.08, 0.5]} />
          <meshStandardMaterial color={platterColors[i]} roughness={0.6} />
        </mesh>
      ))}

      {/* Kitchen island */}
      <mesh position={[5.5, 0.45, 4]} castShadow receiveShadow>
        <boxGeometry args={[4, 0.9, 1.8]} />
        <meshStandardMaterial color="#e8e4dc" roughness={0.6} />
      </mesh>
      {/* Island worktop */}
      <mesh position={[5.5, 0.92, 4]}>
        <boxGeometry args={[4, 0.04, 1.8]} />
        <meshStandardMaterial color="#ccc8bc" roughness={0.5} metalness={0.05} />
      </mesh>
      {/* Bar stools */}
      {barStoolPositions.map((pos, i) => (
        <mesh key={`stool-${i}`} position={pos} castShadow>
          <boxGeometry args={[0.35, 0.65, 0.35]} />
          <meshStandardMaterial color="#444444" roughness={0.7} />
        </mesh>
      ))}

      {/* ── Garden ──────────────────────────────────────────────────────── */}
      {/* Patio table top */}
      <mesh position={[0, 0.75, -10]} castShadow>
        <cylinderGeometry args={[1.0, 1.0, 0.06, 12]} />
        <meshStandardMaterial color="#8b5e3c" roughness={0.7} />
      </mesh>
      {/* Patio table leg */}
      <mesh position={[0, 0.375, -10]} castShadow>
        <cylinderGeometry args={[0.05, 0.07, 0.75, 8]} />
        <meshStandardMaterial color="#6b4423" roughness={0.8} />
      </mesh>
      {/* Garden chairs */}
      {gardenChairPositions.map((pos, i) => (
        <mesh key={`garden-chair-${i}`} position={pos} castShadow>
          <boxGeometry args={[0.5, 0.8, 0.5]} />
          <meshStandardMaterial color="#2a5a2a" roughness={0.8} />
        </mesh>
      ))}

      {/* Garden bushes along fence */}
      {bushPositions.map((pos, i) => (
        <mesh key={`bush-${i}`} position={pos} castShadow>
          <sphereGeometry args={[0.6, 8, 8]} />
          <meshStandardMaterial color="#3a7a2a" roughness={0.9} />
        </mesh>
      ))}

      {/* Garden fairy lights on fence */}
      {gardenLights.map((pos, i) => (
        <mesh key={`garden-light-${i}`} position={pos}>
          <sphereGeometry args={[0.055, 4, 4]} />
          <meshStandardMaterial
            color="#ffee88"
            emissive="#ffee88"
            emissiveIntensity={2}
            roughness={0.3}
          />
        </mesh>
      ))}

      {/* ── Lighting ────────────────────────────────────────────────────── */}
      <ambientLight intensity={0.55} color="#ffe4b8" />
      {/* Living room point light */}
      <pointLight
        position={[-5, 2.8, 3]}
        color="#ffcc88"
        intensity={1.8}
        distance={12}
        castShadow
      />
      {/* Kitchen point light */}
      <pointLight
        position={[7, 2.8, 3]}
        color="#fff0d8"
        intensity={1.5}
        distance={10}
        castShadow
      />
      {/* Garden point light — cooler outdoor */}
      <pointLight
        position={[0, 3.0, -9]}
        color="#c8d8f0"
        intensity={0.9}
        distance={15}
      />
    </group>
  )
}
