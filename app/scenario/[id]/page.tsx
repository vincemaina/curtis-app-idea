'use client'

import { use, useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getScenario } from '@/lib/scenarios'
import type { Message, GameState, NPC, ChatResponse } from '@/lib/types'

// ---- small sub-components ----

function ObjectivesPanel({
  scenario,
  completedIds,
}: {
  scenario: ReturnType<typeof getScenario>
  completedIds: string[]
}) {
  if (!scenario) return null
  const primary = scenario.objectives.filter(o => o.type === 'primary')
  const bonus = scenario.objectives.filter(o => o.type === 'bonus')

  return (
    <div className="bg-game-card border border-game-border rounded-xl p-4 space-y-3">
      <h3 className="text-xs font-semibold text-game-text-dim uppercase tracking-widest">Objectives</h3>
      <div className="space-y-1.5">
        {primary.map(obj => (
          <div key={obj.id} className="flex items-start gap-2">
            <span className={`mt-0.5 text-base leading-none flex-shrink-0 ${completedIds.includes(obj.id) ? 'text-game-green' : 'text-game-muted'}`}>
              {completedIds.includes(obj.id) ? '✓' : '○'}
            </span>
            <span className={`text-sm ${completedIds.includes(obj.id) ? 'text-game-green line-through opacity-70' : 'text-game-text'}`}>
              {obj.description}
            </span>
          </div>
        ))}
      </div>
      {bonus.length > 0 && (
        <>
          <div className="border-t border-game-border pt-2">
            <div className="text-xs text-game-yellow font-medium mb-1.5">Bonus</div>
            <div className="space-y-1.5">
              {bonus.map(obj => (
                <div key={obj.id} className="flex items-start gap-2">
                  <span className={`mt-0.5 text-base leading-none flex-shrink-0 ${completedIds.includes(obj.id) ? 'text-game-yellow' : 'text-game-muted'}`}>
                    {completedIds.includes(obj.id) ? '★' : '☆'}
                  </span>
                  <span className={`text-sm ${completedIds.includes(obj.id) ? 'text-game-yellow line-through opacity-70' : 'text-game-text-dim'}`}>
                    {obj.description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function NPCCard({
  npc,
  isActive,
  hasConversation,
  onClick,
}: {
  npc: NPC
  isActive: boolean
  hasConversation: boolean
  onClick: () => void
}) {
  const moodColors: Record<string, string> = {
    friendly: 'bg-game-green/20 text-game-green border-game-green/30',
    neutral: 'bg-game-muted/20 text-game-text-dim border-game-muted/30',
    busy: 'bg-game-yellow/20 text-game-yellow border-game-yellow/30',
    stressed: 'bg-game-red/20 text-game-red border-game-red/30',
    sad: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    confused: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  }

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-all duration-150 ${
        isActive
          ? 'bg-game-accent/15 border-game-accent/60 accent-glow'
          : 'bg-game-card border-game-border hover:border-game-accent/30 hover:bg-game-card/80'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <span className="text-2xl leading-none">{npc.avatarEmoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-game-text truncate">{npc.name}</span>
            {hasConversation && (
              <span className="text-xs bg-game-accent/20 text-game-accent px-1.5 py-0.5 rounded">talked</span>
            )}
          </div>
          <div className="text-xs text-game-text-dim truncate">{npc.role}</div>
          <div className={`mt-1 text-xs px-1.5 py-0.5 rounded border w-fit ${moodColors[npc.mood] || moodColors.neutral}`}>
            {npc.mood}
          </div>
        </div>
      </div>
    </button>
  )
}

function TypingIndicator({ npcName }: { npcName: string }) {
  return (
    <div className="bubble-animate flex items-end gap-2">
      <span className="text-lg leading-none">{' '}</span>
      <div className="bg-game-card border border-game-border rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-1">
        <span className="text-xs text-game-text-dim mr-1">{npcName}</span>
        <div className="typing-dot w-1.5 h-1.5 rounded-full bg-game-text-dim" />
        <div className="typing-dot w-1.5 h-1.5 rounded-full bg-game-text-dim" />
        <div className="typing-dot w-1.5 h-1.5 rounded-full bg-game-text-dim" />
      </div>
    </div>
  )
}

// ---- Main page ----

export default function ScenarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const scenario = getScenario(id)

  const [gameState, setGameState] = useState<GameState>({
    scenarioId: id,
    conversations: {},
    completedObjectiveIds: [],
    activeNpcId: null,
    startedAt: Date.now(),
    triggeredChanceEventIds: [],
    totalMessageCount: 0,
  })

  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [newlyCompleted, setNewlyCompleted] = useState<string[]>([])
  const [showCompletionBanner, setShowCompletionBanner] = useState(false)
  const [settingScene, setSettingScene] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [gameState.conversations, isLoading])

  // Hide setting scene intro after 2s
  useEffect(() => {
    const t = setTimeout(() => setSettingScene(false), 2500)
    return () => clearTimeout(t)
  }, [])

  // Check for chance events
  useEffect(() => {
    if (!scenario) return
    const unTriggered = scenario.chanceEvents.filter(
      e => !gameState.triggeredChanceEventIds.includes(e.id) &&
        gameState.totalMessageCount >= e.triggerAfterMessages
    )
    if (unTriggered.length > 0) {
      const event = unTriggered[0]
      // Auto-inject NPC message
      const npcMsg: Message = {
        id: `event-${event.id}`,
        role: 'npc',
        content: event.npcMessage,
        npcId: event.npcId,
        npcName: scenario.npcs.find(n => n.id === event.npcId)?.name ?? '',
        timestamp: Date.now(),
      }
      setGameState(prev => ({
        ...prev,
        triggeredChanceEventIds: [...prev.triggeredChanceEventIds, event.id],
        activeNpcId: event.npcId,
        conversations: {
          ...prev.conversations,
          [event.npcId]: [...(prev.conversations[event.npcId] ?? []), npcMsg],
        },
      }))
    }
  }, [gameState.totalMessageCount, scenario])

  const activeNpc = scenario?.npcs.find(n => n.id === gameState.activeNpcId)
  const activeConversation = gameState.activeNpcId
    ? (gameState.conversations[gameState.activeNpcId] ?? [])
    : []

  const primaryObjectives = scenario?.objectives.filter(o => o.type === 'primary') ?? []
  const allPrimaryDone = primaryObjectives.every(o => gameState.completedObjectiveIds.includes(o.id))

  const handleSelectNPC = useCallback((npcId: string) => {
    setGameState(prev => ({ ...prev, activeNpcId: npcId }))
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || !gameState.activeNpcId || isLoading || !scenario) return

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: inputText.trim(),
      timestamp: Date.now(),
    }

    const currentHistory = gameState.conversations[gameState.activeNpcId] ?? []

    setGameState(prev => ({
      ...prev,
      totalMessageCount: prev.totalMessageCount + 1,
      conversations: {
        ...prev.conversations,
        [prev.activeNpcId!]: [...currentHistory, userMsg],
      },
    }))
    setInputText('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: id,
          npcId: gameState.activeNpcId,
          userMessage: userMsg.content,
          conversationHistory: currentHistory,
          completedObjectiveIds: gameState.completedObjectiveIds,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Request failed')
      }

      const data: ChatResponse = await res.json()

      const npcMsg: Message = {
        id: `n-${Date.now()}`,
        role: 'npc',
        content: data.dialogue,
        npcId: gameState.activeNpcId,
        npcName: activeNpc?.name,
        timestamp: Date.now(),
      }

      const newCompleted = data.objectivesCompleted.filter(
        oid => !gameState.completedObjectiveIds.includes(oid)
      )

      setGameState(prev => ({
        ...prev,
        conversations: {
          ...prev.conversations,
          [prev.activeNpcId!]: [...(prev.conversations[prev.activeNpcId!] ?? []), npcMsg],
        },
        completedObjectiveIds: [...prev.completedObjectiveIds, ...newCompleted],
      }))

      if (newCompleted.length > 0) {
        setNewlyCompleted(newCompleted)
        setTimeout(() => setNewlyCompleted([]), 3000)
      }
    } catch (err) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'npc',
        content: '(Something went wrong — check your API key is set)',
        npcId: gameState.activeNpcId,
        npcName: activeNpc?.name,
        timestamp: Date.now(),
      }
      setGameState(prev => ({
        ...prev,
        conversations: {
          ...prev.conversations,
          [prev.activeNpcId!]: [...(prev.conversations[prev.activeNpcId!] ?? []), errorMsg],
        },
      }))
    } finally {
      setIsLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [inputText, gameState, isLoading, scenario, id, activeNpc])

  const handleFinish = useCallback(() => {
    const stateToPass = {
      scenarioId: id,
      conversations: gameState.conversations,
      completedObjectiveIds: gameState.completedObjectiveIds,
    }
    sessionStorage.setItem('gameResult', JSON.stringify(stateToPass))
    router.push('/results')
  }, [gameState, id, router])

  if (!scenario) {
    return (
      <div className="min-h-screen bg-game-bg flex items-center justify-center">
        <div className="text-game-text-dim">Scenario not found.</div>
      </div>
    )
  }

  // Scene intro overlay
  if (settingScene) {
    return (
      <div className="min-h-screen bg-game-bg flex items-center justify-center animate-fade-in">
        <div className="text-center max-w-lg px-8">
          <div className="text-6xl mb-4">{scenario.emoji}</div>
          <h2 className="text-2xl font-bold text-game-text mb-3">{scenario.name}</h2>
          <p className="text-game-text-dim leading-relaxed">{scenario.setting}</p>
          <div className="mt-6 flex gap-1 justify-center">
            <div className="w-2 h-2 rounded-full bg-game-accent animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-game-accent animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-game-accent animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen overflow-hidden bg-game-bg flex flex-col">
      {/* Top bar */}
      <div className="border-b border-game-border bg-game-card/50 px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl">{scenario.emoji}</span>
          <span className="text-sm font-semibold text-game-text">{scenario.name}</span>
          <span className="text-xs text-game-text-dim hidden sm:block">— {scenario.setting.slice(0, 60)}...</span>
        </div>
        <div className="flex items-center gap-2">
          {allPrimaryDone && (
            <span className="text-xs bg-game-green/20 text-game-green border border-game-green/30 px-2 py-0.5 rounded font-medium">
              Main objectives complete!
            </span>
          )}
          <button
            onClick={handleFinish}
            className="text-xs bg-game-accent hover:bg-game-accent-dim text-white px-3 py-1.5 rounded-lg font-semibold transition-colors"
          >
            Finish &amp; Analyse
          </button>
        </div>
      </div>

      {/* Newly completed banner */}
      {newlyCompleted.length > 0 && (
        <div className="flex-shrink-0 bg-game-green/10 border-b border-game-green/30 px-4 py-2 animate-fade-in">
          {newlyCompleted.map(oid => {
            const obj = scenario.objectives.find(o => o.id === oid)
            return (
              <div key={oid} className="flex items-center gap-2 text-sm text-game-green">
                <span>✓</span>
                <span>Objective complete: <strong>{obj?.description}</strong></span>
              </div>
            )
          })}
        </div>
      )}

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div className="w-64 flex-shrink-0 border-r border-game-border flex flex-col overflow-y-auto p-3 gap-3">
          <ObjectivesPanel scenario={scenario} completedIds={gameState.completedObjectiveIds} />

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-game-text-dim uppercase tracking-widest px-1">
              People Nearby
            </h3>
            {scenario.npcs.map(npc => (
              <NPCCard
                key={npc.id}
                npc={npc}
                isActive={gameState.activeNpcId === npc.id}
                hasConversation={!!gameState.conversations[npc.id]?.length}
                onClick={() => handleSelectNPC(npc.id)}
              />
            ))}
          </div>

          {/* Tips */}
          <div className="bg-game-card border border-game-border rounded-xl p-3 mt-1">
            <h3 className="text-xs font-semibold text-game-text-dim uppercase tracking-widest mb-2">Tips</h3>
            <ul className="space-y-1.5">
              {scenario.tips.map((tip, i) => (
                <li key={i} className="text-xs text-game-text-dim leading-relaxed flex gap-1.5">
                  <span className="text-game-accent flex-shrink-0">›</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Conversation area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!gameState.activeNpcId ? (
            // No NPC selected
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-4">
              <div className="text-5xl opacity-40">👥</div>
              <div className="max-w-sm">
                <h3 className="text-lg font-semibold text-game-text mb-2">Approach someone</h3>
                <p className="text-game-text-dim text-sm leading-relaxed">
                  Select a person from the list on the left to start a conversation with them.
                  Read their situation and mood before approaching.
                </p>
              </div>
              <div className="bg-game-card border border-game-border rounded-xl p-4 max-w-sm w-full text-left">
                <div className="text-xs text-game-text-dim font-medium mb-2 uppercase tracking-wider">The Scene</div>
                <p className="text-sm text-game-text leading-relaxed">{scenario.setting}</p>
              </div>
            </div>
          ) : (
            <>
              {/* NPC header */}
              <div className="border-b border-game-border px-4 py-3 bg-game-card/30 flex items-center gap-3 flex-shrink-0">
                <span className="text-2xl">{activeNpc?.avatarEmoji}</span>
                <div>
                  <div className="text-sm font-semibold text-game-text">{activeNpc?.name}</div>
                  <div className="text-xs text-game-text-dim">{activeNpc?.currentSituation}</div>
                </div>
                <button
                  onClick={() => setGameState(prev => ({ ...prev, activeNpcId: null }))}
                  className="ml-auto text-xs text-game-text-dim hover:text-game-text transition-colors"
                >
                  ← Walk away
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {activeConversation.length === 0 && (
                  <div className="text-center text-sm text-game-text-dim italic py-8">
                    You approach {activeNpc?.name}. What do you say?
                  </div>
                )}
                {activeConversation.map(msg => (
                  <div
                    key={msg.id}
                    className={`bubble-animate flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}
                  >
                    {msg.role === 'npc' && (
                      <span className="text-xl leading-none flex-shrink-0 mb-0.5">{activeNpc?.avatarEmoji}</span>
                    )}
                    <div
                      className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-game-accent text-white rounded-br-sm'
                          : 'bg-game-card border border-game-border text-game-text rounded-bl-sm'
                      }`}
                    >
                      {msg.role === 'npc' && (
                        <div className="text-xs text-game-text-dim mb-1 font-medium">{msg.npcName}</div>
                      )}
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && activeNpc && (
                  <TypingIndicator npcName={activeNpc.name} />
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-game-border p-3 flex-shrink-0 bg-game-card/30">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder={`Say something to ${activeNpc?.name}...`}
                    disabled={isLoading}
                    className="flex-1 bg-game-card border border-game-border rounded-lg px-4 py-2.5 text-sm text-game-text placeholder:text-game-muted focus:outline-none focus:border-game-accent/60 transition-colors disabled:opacity-50"
                  />
                  <button
                    onClick={handleSend}
                    disabled={isLoading || !inputText.trim()}
                    className="bg-game-accent hover:bg-game-accent-dim disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors flex-shrink-0"
                  >
                    Send
                  </button>
                </div>
                <p className="text-xs text-game-text-dim mt-1.5 px-1">
                  Press Enter to send. Click another character to switch conversations.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
