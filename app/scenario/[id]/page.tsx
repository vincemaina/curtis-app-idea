'use client'

import { use, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { getScenario } from '@/lib/scenarios'

// Game3D imports Three.js — keep out of the server bundle
const Game3D = dynamic(() => import('@/components/game/Game3D'), { ssr: false })

export default function ScenarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const scenario = getScenario(id)
  const [ready, setReady] = useState(false)

  // Brief intro so the user can read the scene description
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 2500)
    return () => clearTimeout(t)
  }, [])

  if (!scenario) {
    return (
      <div className="min-h-screen bg-game-bg flex items-center justify-center">
        <div className="text-game-text-dim">Scenario not found.</div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-game-bg flex items-center justify-center animate-fade-in">
        <div className="text-center max-w-lg px-8">
          <div className="text-6xl mb-4">{scenario.emoji}</div>
          <h2 className="text-2xl font-bold text-game-text mb-3">{scenario.name}</h2>
          <p className="text-game-text-dim leading-relaxed">{scenario.setting}</p>
          <div className="mt-6 flex gap-1 justify-center">
            {[0, 150, 300].map(delay => (
              <div
                key={delay}
                className="w-2 h-2 rounded-full bg-game-accent animate-bounce"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return <Game3D scenario={scenario} />
}
