'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getScenario } from '@/lib/scenarios'
import type { AnalysisResult } from '@/lib/types'

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const radius = (size - 10) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 10) * circumference
  const color = score >= 7.5 ? '#00d68f' : score >= 5 ? '#f7c948' : '#ff4d6a'

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1e1e35" strokeWidth={8} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={8}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
      />
    </svg>
  )
}

function GradeDisplay({ grade, score }: { grade: string; score: number }) {
  const config = {
    S: { color: 'text-purple-400', glow: 'shadow-purple-500/30', label: 'Outstanding' },
    A: { color: 'text-game-green', glow: 'shadow-game-green/30', label: 'Excellent' },
    B: { color: 'text-blue-400', glow: 'shadow-blue-500/30', label: 'Good' },
    C: { color: 'text-game-yellow', glow: 'shadow-game-yellow/30', label: 'Average' },
    D: { color: 'text-game-red', glow: 'shadow-game-red/30', label: 'Needs Work' },
  }[grade] ?? { color: 'text-game-text', glow: '', label: 'Scored' }

  return (
    <div className="flex items-center gap-6">
      <div className="relative">
        <ScoreRing score={score} size={100} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-black ${config.color}`}>{grade}</span>
        </div>
      </div>
      <div>
        <div className={`text-4xl font-black ${config.color}`}>{score.toFixed(1)}<span className="text-xl text-game-text-dim font-normal">/10</span></div>
        <div className={`text-sm font-semibold ${config.color} mt-0.5`}>{config.label}</div>
      </div>
    </div>
  )
}

function ConvoScoreCard({ cs, npc }: {
  cs: AnalysisResult['conversationScores'][0]
  npc: { avatarEmoji: string } | undefined
}) {
  const [expanded, setExpanded] = useState(false)
  const scoreColor = cs.score >= 7.5 ? 'text-game-green' : cs.score >= 5 ? 'text-game-yellow' : 'text-game-red'

  return (
    <div className="bg-game-card border border-game-border rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-2xl">{npc?.avatarEmoji ?? '👤'}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-game-text text-sm">{cs.npcName}</span>
          </div>
          <div className="flex gap-3 mt-1">
            <span className={`text-lg font-black ${scoreColor}`}>{cs.score.toFixed(1)}</span>
            <div className="flex gap-0.5 items-center">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-3 rounded-sm ${i < Math.round(cs.score) ? (cs.score >= 7.5 ? 'bg-game-green' : cs.score >= 5 ? 'bg-game-yellow' : 'bg-game-red') : 'bg-game-border'}`}
                />
              ))}
            </div>
          </div>
        </div>
        <span className="text-game-text-dim text-sm">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-game-border space-y-4 animate-fade-in">
          {cs.positives.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-game-green uppercase tracking-wider mb-2">What you did well</div>
              <ul className="space-y-1">
                {cs.positives.map((p, i) => (
                  <li key={i} className="flex gap-2 text-sm text-game-text">
                    <span className="text-game-green flex-shrink-0">✓</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {cs.improvements.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-game-red uppercase tracking-wider mb-2">Areas to improve</div>
              <ul className="space-y-1">
                {cs.improvements.map((p, i) => (
                  <li key={i} className="flex gap-2 text-sm text-game-text">
                    <span className="text-game-yellow flex-shrink-0">△</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {cs.tips.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-game-accent uppercase tracking-wider mb-2">Tips for next time</div>
              <ul className="space-y-1">
                {cs.tips.map((p, i) => (
                  <li key={i} className="flex gap-2 text-sm text-game-text">
                    <span className="text-game-accent flex-shrink-0">›</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {cs.exampleImprovement && (
            <div className="bg-game-accent/5 border border-game-accent/20 rounded-lg p-3">
              <div className="text-xs font-semibold text-game-accent uppercase tracking-wider mb-2">Example rewrite</div>
              <p className="text-sm text-game-text italic">"{cs.exampleImprovement}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ResultsPage() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scenarioId, setScenarioId] = useState<string | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('gameResult')
    if (!raw) {
      setError('No game data found. Play a scenario first.')
      setIsLoading(false)
      return
    }

    const gameResult = JSON.parse(raw)
    setScenarioId(gameResult.scenarioId)

    fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: raw,
    })
      .then(res => {
        if (!res.ok) return res.json().then(e => { throw new Error(e.error ?? 'Analysis failed') })
        return res.json()
      })
      .then((data: AnalysisResult) => {
        setAnalysis(data)
        setIsLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setIsLoading(false)
      })
  }, [])

  const scenario = scenarioId ? getScenario(scenarioId) : null

  if (isLoading) {
    return (
      <div className="min-h-screen bg-game-bg flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm px-8">
          <div className="text-5xl animate-pulse-slow">🧠</div>
          <div className="text-lg font-semibold text-game-text">Analysing your conversations...</div>
          <p className="text-sm text-game-text-dim leading-relaxed">
            The AI coach is reviewing everything you said, how you said it, and what you could do better.
          </p>
          <div className="flex gap-1 justify-center mt-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-game-accent animate-bounce"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-game-bg flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm px-8">
          <div className="text-5xl">⚠️</div>
          <div className="text-lg font-semibold text-game-text">Analysis failed</div>
          <p className="text-sm text-game-red">{error}</p>
          <p className="text-xs text-game-text-dim">Make sure ANTHROPIC_API_KEY is set in your environment.</p>
          <Link href="/play" className="inline-block mt-2 bg-game-accent hover:bg-game-accent-dim text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Back to menu
          </Link>
        </div>
      </div>
    )
  }

  if (!analysis) return null

  const npcMap = Object.fromEntries(
    scenario?.npcs.map(n => [n.id, n]) ?? []
  )

  return (
    <div className="min-h-screen bg-game-bg">
      {/* Header */}
      <div className="border-b border-game-border bg-game-card/40">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="text-xs text-game-text-dim uppercase tracking-wider mb-1 flex items-center gap-2">
                <span>{scenario?.emoji}</span>
                <span>{scenario?.name ?? 'Scenario'} — Results</span>
              </div>
              <h1 className="text-2xl font-black gradient-text">Coaching Report</h1>
            </div>
            <GradeDisplay grade={analysis.grade} score={analysis.overallScore} />
          </div>

          {/* Overall feedback */}
          <div className="mt-4 bg-game-card border border-game-border rounded-xl p-4">
            <p className="text-sm text-game-text leading-relaxed">{analysis.overallFeedback}</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
        {/* Objectives summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-game-card border border-game-border rounded-xl p-4">
            <div className="text-xs font-semibold text-game-green uppercase tracking-wider mb-2">Completed</div>
            {analysis.completedObjectives.length === 0 ? (
              <p className="text-sm text-game-text-dim">None completed</p>
            ) : (
              <ul className="space-y-1">
                {analysis.completedObjectives.map((obj, i) => (
                  <li key={i} className="flex gap-2 text-sm text-game-text">
                    <span className="text-game-green flex-shrink-0">✓</span>
                    <span>{obj.replace(/^- /, '')}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="bg-game-card border border-game-border rounded-xl p-4">
            <div className="text-xs font-semibold text-game-red uppercase tracking-wider mb-2">Missed</div>
            {analysis.missedObjectives.length === 0 ? (
              <p className="text-sm text-game-green">All objectives completed! 🎉</p>
            ) : (
              <ul className="space-y-1">
                {analysis.missedObjectives.map((obj, i) => (
                  <li key={i} className="flex gap-2 text-sm text-game-text">
                    <span className="text-game-red flex-shrink-0">✗</span>
                    <span>{obj.replace(/^- /, '')}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Per-conversation scores */}
        {analysis.conversationScores.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-game-text-dim uppercase tracking-widest mb-3">
              Conversation Breakdown
            </h2>
            <div className="space-y-2">
              {analysis.conversationScores.map(cs => (
                <ConvoScoreCard key={cs.npcId} cs={cs} npc={npcMap[cs.npcId]} />
              ))}
            </div>
          </div>
        )}

        {/* Missed opportunities */}
        {analysis.missedOpportunities.length > 0 && (
          <div className="bg-game-card border border-game-yellow/20 rounded-xl p-4">
            <h2 className="text-xs font-semibold text-game-yellow uppercase tracking-widest mb-3">
              Missed Opportunities
            </h2>
            <ul className="space-y-2">
              {analysis.missedOpportunities.map((op, i) => (
                <li key={i} className="flex gap-2 text-sm text-game-text">
                  <span className="text-game-yellow flex-shrink-0 mt-0.5">!</span>
                  <span>{op}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Key lessons */}
        {analysis.keyLessons.length > 0 && (
          <div className="bg-game-card border border-game-accent/20 rounded-xl p-4">
            <h2 className="text-xs font-semibold text-game-accent uppercase tracking-widest mb-3">
              Key Lessons
            </h2>
            <ol className="space-y-2">
              {analysis.keyLessons.map((lesson, i) => (
                <li key={i} className="flex gap-3 text-sm text-game-text">
                  <span className="text-game-accent font-bold flex-shrink-0">{i + 1}.</span>
                  <span>{lesson}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 flex-wrap pt-2">
          {scenario && (
            <Link
              href={`/scenario/${scenario.id}`}
              className="flex-1 min-w-[160px] text-center bg-game-accent hover:bg-game-accent-dim text-white px-5 py-3 rounded-xl font-semibold text-sm transition-colors accent-glow"
            >
              Try Again ↺
            </Link>
          )}
          <Link
            href="/play"
            className="flex-1 min-w-[160px] text-center bg-game-card border border-game-border hover:border-game-accent/30 text-game-text px-5 py-3 rounded-xl font-semibold text-sm transition-all"
          >
            Choose Another Scenario →
          </Link>
        </div>
      </div>
    </div>
  )
}
