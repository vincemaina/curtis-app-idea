'use client'

import Link from 'next/link'
import { SCENARIOS } from '@/lib/scenarios'
import type { Difficulty } from '@/lib/types'

const difficultyConfig: Record<Difficulty, { label: string; color: string; bg: string }> = {
  beginner: { label: 'Beginner', color: 'text-game-green', bg: 'bg-game-green/10 border-game-green/30' },
  intermediate: { label: 'Intermediate', color: 'text-game-yellow', bg: 'bg-game-yellow/10 border-game-yellow/30' },
  advanced: { label: 'Advanced', color: 'text-game-red', bg: 'bg-game-red/10 border-game-red/30' },
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-game-bg">
      {/* Header */}
      <div className="border-b border-game-border">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-start gap-4">
            <div className="text-5xl">💬</div>
            <div>
              <h1 className="text-3xl font-bold gradient-text tracking-tight">ConvoCoach</h1>
              <p className="text-game-text-dim mt-1 text-sm max-w-xl">
                Practice real conversations in realistic situations. AI-powered characters react naturally —
                get scored, coached, and improve without the social risk.
              </p>
            </div>
          </div>

          {/* How it works */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { icon: '🎭', title: 'Choose a scenario', desc: 'Pick from realistic social situations' },
              { icon: '🗣️', title: 'Talk to NPCs', desc: 'Real AI personalities that react to you' },
              { icon: '📊', title: 'Get coached', desc: 'Detailed feedback on every interaction' },
            ].map(step => (
              <div key={step.title} className="bg-game-card border border-game-border rounded-lg p-3 flex gap-3 items-start">
                <span className="text-xl">{step.icon}</span>
                <div>
                  <div className="text-xs font-semibold text-game-text">{step.title}</div>
                  <div className="text-xs text-game-text-dim mt-0.5">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scenarios */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <h2 className="text-xs font-semibold text-game-text-dim uppercase tracking-widest mb-4">
          Select a Scenario
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SCENARIOS.map(scenario => {
            const diff = difficultyConfig[scenario.difficulty]
            const primaryCount = scenario.objectives.filter(o => o.type === 'primary').length
            const bonusCount = scenario.objectives.filter(o => o.type === 'bonus').length

            return (
              <Link
                key={scenario.id}
                href={`/scenario/${scenario.id}`}
                className="group block bg-game-card border border-game-border rounded-xl overflow-hidden hover:border-game-accent/50 transition-all duration-200 hover:shadow-lg hover:shadow-game-accent/10"
              >
                {/* Card header with gradient */}
                <div className={`bg-gradient-to-br ${scenario.bgGradient} px-5 pt-6 pb-8 relative`}>
                  <div className="text-4xl mb-3">{scenario.emoji}</div>
                  <h3 className="text-lg font-bold text-white">{scenario.name}</h3>
                  <p className="text-sm text-white/60 mt-1 leading-relaxed">{scenario.description}</p>
                  {/* Decorative element */}
                  <div className="absolute bottom-0 right-0 text-6xl opacity-10 leading-none translate-x-2 translate-y-2">
                    {scenario.emoji}
                  </div>
                </div>

                {/* Card body */}
                <div className="px-5 py-4 space-y-3">
                  {/* Difficulty badge */}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${diff.bg} ${diff.color}`}>
                      {diff.label}
                    </span>
                    <span className="text-xs text-game-text-dim">{scenario.npcs.length} characters</span>
                  </div>

                  {/* Objectives */}
                  <div className="space-y-1">
                    <div className="text-xs text-game-text-dim">
                      <span className="text-game-text font-medium">{primaryCount}</span> main objectives
                      {bonusCount > 0 && (
                        <span> + <span className="text-game-yellow font-medium">{bonusCount}</span> bonus</span>
                      )}
                    </div>
                  </div>

                  {/* Play button */}
                  <button className="w-full mt-1 bg-game-accent/10 hover:bg-game-accent/20 border border-game-accent/30 group-hover:border-game-accent/60 text-game-accent text-sm font-semibold py-2 rounded-lg transition-all duration-200">
                    Play →
                  </button>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Coming soon */}
        <div className="mt-4 bg-game-card/50 border border-dashed border-game-border rounded-xl p-6 text-center">
          <div className="text-2xl mb-2">🔒</div>
          <div className="text-sm text-game-text-dim">More scenarios coming — office, coffee shop, networking event...</div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-game-text-dim mt-8">
          All conversations are analysed by AI. An Anthropic API key is required.
        </p>
      </div>
    </main>
  )
}
