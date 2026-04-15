'use client'

import type { Scenario, Message } from '@/lib/types'

interface Props {
  scenario: Scenario
  completedObjectiveIds: string[]
  conversations: Record<string, Message[]>
  newlyCompleted: string[]
  isLocked: boolean
  chatOpen: boolean
  onFinish: () => void
}

export default function GameHUD({
  scenario,
  completedObjectiveIds,
  newlyCompleted,
  isLocked,
  chatOpen,
  onFinish,
}: Props) {
  const primary = scenario.objectives.filter(o => o.type === 'primary')
  const bonus   = scenario.objectives.filter(o => o.type === 'bonus')
  const allPrimaryDone = primary.every(o => completedObjectiveIds.includes(o.id))

  return (
    <>
      {/* ── Top bar ── */}
      <div
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-2"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl leading-none">{scenario.emoji}</span>
          <span className="text-sm font-semibold text-white">{scenario.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {allPrimaryDone && (
            <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded font-medium">
              Main objectives complete!
            </span>
          )}
          <button
            onClick={onFinish}
            className="text-xs bg-game-accent hover:bg-game-accent-dim text-white px-3 py-1.5 rounded-lg font-semibold transition-colors"
          >
            Finish &amp; Analyse
          </button>
        </div>
      </div>

      {/* ── Objective completed flash ── */}
      {newlyCompleted.length > 0 && (
        <div
          className="absolute top-14 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-xl animate-slide-up"
          style={{ background: 'rgba(0,214,143,0.15)', border: '1px solid rgba(0,214,143,0.35)', backdropFilter: 'blur(6px)' }}
        >
          {newlyCompleted.map(oid => {
            const obj = scenario.objectives.find(o => o.id === oid)
            return (
              <div key={oid} className="flex items-center gap-2 text-sm text-green-400">
                <span>✓</span>
                <span>Objective complete: <strong>{obj?.description}</strong></span>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Objectives panel — bottom-left ── */}
      <div className="absolute bottom-5 left-4 z-20 max-w-xs">
        <div
          className="rounded-xl p-3 space-y-1.5"
          style={{ background: 'rgba(0,0,0,0.68)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(6px)' }}
        >
          <div className="text-xs font-semibold text-white/45 uppercase tracking-widest mb-2">Objectives</div>

          {primary.map(obj => (
            <div key={obj.id} className="flex items-start gap-2">
              <span className={`mt-0.5 flex-shrink-0 ${completedObjectiveIds.includes(obj.id) ? 'text-green-400' : 'text-white/35'}`}>
                {completedObjectiveIds.includes(obj.id) ? '✓' : '○'}
              </span>
              <span className={`text-sm leading-snug ${completedObjectiveIds.includes(obj.id) ? 'text-green-400 line-through opacity-70' : 'text-white/80'}`}>
                {obj.description}
              </span>
            </div>
          ))}

          {bonus.length > 0 && (
            <div className="pt-1 mt-1 border-t border-white/10">
              <div className="text-xs text-yellow-400/70 font-medium mb-1">Bonus</div>
              {bonus.map(obj => (
                <div key={obj.id} className="flex items-start gap-2">
                  <span className={`mt-0.5 flex-shrink-0 ${completedObjectiveIds.includes(obj.id) ? 'text-yellow-400' : 'text-white/25'}`}>
                    {completedObjectiveIds.includes(obj.id) ? '★' : '☆'}
                  </span>
                  <span className={`text-sm leading-snug ${completedObjectiveIds.includes(obj.id) ? 'text-yellow-400 line-through opacity-70' : 'text-white/45'}`}>
                    {obj.description}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Controls hint — bottom-right (only when playing, not chatting) ── */}
      {!chatOpen && isLocked && (
        <div className="absolute bottom-5 right-4 z-20">
          <div
            className="rounded-xl px-3 py-2 text-xs space-y-1"
            style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div><span className="text-white/80 font-medium">W A S D</span> <span className="text-white/40">Move</span></div>
            <div><span className="text-white/80 font-medium">Mouse</span> <span className="text-white/40">Look</span></div>
            <div><span className="text-white/80 font-medium">E</span> <span className="text-white/40">Talk to NPC</span></div>
            <div><span className="text-white/80 font-medium">Esc</span> <span className="text-white/40">Release cursor</span></div>
          </div>
        </div>
      )}

      {/* ── Crosshair ── */}
      {!chatOpen && isLocked && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
          <div className="relative w-5 h-5 flex items-center justify-center">
            <div className="absolute w-4 h-px bg-white/70" />
            <div className="absolute w-px h-4 bg-white/70" />
          </div>
        </div>
      )}

      {/* ── "Click to play" overlay ── */}
      {!chatOpen && !isLocked && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}
        >
          <div
            className="text-center px-8 py-7 rounded-2xl max-w-sm"
            style={{ background: 'rgba(15,15,26,0.9)', border: '1px solid rgba(124,92,252,0.4)' }}
          >
            <div className="text-4xl mb-3">{scenario.emoji}</div>
            <h2 className="text-white font-bold text-xl mb-1">{scenario.name}</h2>
            <p className="text-white/50 text-sm mb-5 leading-relaxed">{scenario.setting.slice(0, 100)}…</p>
            <div
              className="text-white font-semibold py-2.5 px-6 rounded-xl inline-block cursor-pointer"
              style={{ background: '#7c5cfc' }}
            >
              Click to play
            </div>
            <div className="mt-4 text-xs text-white/35 space-y-1">
              <div>WASD to move · Mouse to look · E to talk</div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
