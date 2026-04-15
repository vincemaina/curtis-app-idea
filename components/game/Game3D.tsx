'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { Scenario, GameState, Message, ChatResponse, NPCIntent } from '@/lib/types'
import { SUPERMARKET_ITEMS } from '@/lib/supermarket-items'
import { AISLE_WALKWAY_X, AISLE_SEARCH_Z } from '@/lib/store-layout'
import ChatOverlay from './ChatOverlay'
import GameHUD from './GameHUD'

// World contains Canvas + Three.js — must be client-only (no SSR)
const World = dynamic(() => import('./World'), { ssr: false })

interface Props {
  scenario: Scenario
}

export default function Game3D({ scenario }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [gameState, setGameState] = useState<GameState>({
    scenarioId: scenario.id,
    conversations: {},
    completedObjectiveIds: [],
    activeNpcId: null,
    startedAt: Date.now(),
    triggeredChanceEventIds: [],
    totalMessageCount: 0,
    misdirectedCount: 0,
  })
  const [isLoading,        setIsLoading]        = useState(false)
  const [isLocked,         setIsLocked]         = useState(false)
  const [newlyCompleted,   setNewlyCompleted]   = useState<string[]>([])
  const [collectedItemIds, setCollectedItemIds] = useState<string[]>([])
  const [npcTargets,       setNpcTargets]       = useState<Record<string, [number, number, number] | null>>({})
  const [shakeSignal,      setShakeSignal]      = useState(0)

  // NPC intent: tracks which NPC is searching which item in which aisle
  const [npcIntents, setNpcIntents] = useState<Record<string, NPCIntent>>({})
  // Ref so handleTargetReached can read current intents without stale closure
  const npcIntentsRef = useRef(npcIntents)
  npcIntentsRef.current = npcIntents

  // Only show items for the supermarket scenario
  const sceneItems = scenario.id === 'supermarket' ? SUPERMARKET_ITEMS : []

  // ── Chance events ──────────────────────────────────────────────
  useEffect(() => {
    const untriggered = scenario.chanceEvents.filter(
      e =>
        !gameState.triggeredChanceEventIds.includes(e.id) &&
        gameState.totalMessageCount >= e.triggerAfterMessages,
    )
    if (untriggered.length === 0) return

    const event = untriggered[0]
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.totalMessageCount])

  // ── Handlers ───────────────────────────────────────────────────
  const handleTalkToNPC = useCallback((npcId: string) => {
    setGameState(prev => ({ ...prev, activeNpcId: npcId }))
    setTimeout(() => inputRef.current?.focus(), 150)
  }, [])

  const handleCloseChat = useCallback(() => {
    setGameState(prev => ({ ...prev, activeNpcId: null }))
  }, [])

  const handleSend = useCallback(
    async (text: string) => {
      const npcId = gameState.activeNpcId
      if (!text.trim() || !npcId || isLoading) return

      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: text.trim(),
        timestamp: Date.now(),
      }
      const history = gameState.conversations[npcId] ?? []

      setGameState(prev => ({
        ...prev,
        totalMessageCount: prev.totalMessageCount + 1,
        conversations: {
          ...prev.conversations,
          [npcId]: [...history, userMsg],
        },
      }))
      setIsLoading(true)

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scenarioId: scenario.id,
            npcId,
            userMessage: text.trim(),
            conversationHistory: history,
            completedObjectiveIds: gameState.completedObjectiveIds,
            npcIntent: npcIntentsRef.current[npcId] ?? null,
          }),
        })
        if (!res.ok) throw new Error('Request failed')
        const data: ChatResponse = await res.json()

        const npcMsg: Message = {
          id: `n-${Date.now()}`,
          role: 'npc',
          content: data.dialogue,
          npcId,
          npcName: scenario.npcs.find(n => n.id === npcId)?.name,
          timestamp: Date.now(),
        }
        const freshCompleted = data.objectivesCompleted.filter(
          oid => !gameState.completedObjectiveIds.includes(oid),
        )

        setGameState(prev => ({
          ...prev,
          conversations: {
            ...prev.conversations,
            [npcId]: [...(prev.conversations[npcId] ?? []), npcMsg],
          },
          completedObjectiveIds: [...prev.completedObjectiveIds, ...freshCompleted],
        }))

        if (freshCompleted.length > 0) {
          setNewlyCompleted(freshCompleted)
          setTimeout(() => setNewlyCompleted([]), 3000)
          setShakeSignal(s => s + 1)
        }

        // NPC knows exact item location — walk them straight there
        if (data.moveTo && scenario.id === 'supermarket') {
          const item = sceneItems.find(i => i.id === data.moveTo)
          if (item) {
            setNpcTargets(prev => ({ ...prev, [npcId]: item.position }))
          }
        }

        // NPC is heading to an aisle to SEARCH based on player's directions
        if (data.searchAisle && data.seekingItem && scenario.id === 'supermarket') {
          const aisleX = AISLE_WALKWAY_X[data.searchAisle]
          if (aisleX !== undefined) {
            setNpcIntents(prev => ({
              ...prev,
              [npcId]: {
                seekingItem: data.seekingItem!,
                targetAisle: data.searchAisle!,
                status: 'en-route',
              },
            }))
            setNpcTargets(prev => ({
              ...prev,
              [npcId]: [aisleX, 0, AISLE_SEARCH_Z],
            }))
          }
        }
      } catch {
        const errMsg: Message = {
          id: `err-${Date.now()}`,
          role: 'npc',
          content: '(Something went wrong — check your API key)',
          npcId,
          timestamp: Date.now(),
        }
        setGameState(prev => ({
          ...prev,
          conversations: {
            ...prev.conversations,
            [npcId]: [...(prev.conversations[npcId] ?? []), errMsg],
          },
        }))
      } finally {
        setIsLoading(false)
        setTimeout(() => inputRef.current?.focus(), 50)
      }
    },
    [gameState, isLoading, scenario, sceneItems],
  )

  // ── Target reached — two-phase NPC movement ────────────────────
  // Phase 1 (en-route): NPC reached the aisle → check if item is actually there
  //   Correct aisle → Phase 2: walk NPC to the real item position
  //   Wrong aisle   → score penalty, NPC stops confused
  // Phase 2 (found): NPC reached the item → collect it, clear intent
  const handleTargetReached = useCallback((npcId: string) => {
    const intent = npcIntentsRef.current[npcId]

    if (intent?.status === 'en-route') {
      const item = sceneItems.find(i => i.id === intent.seekingItem)
      if (item && item.aisleNumber === intent.targetAisle) {
        // Player gave correct directions — phase 2: walk to the actual item
        setNpcIntents(prev => ({ ...prev, [npcId]: { ...intent, status: 'found' } }))
        setNpcTargets(prev => ({ ...prev, [npcId]: item.position }))
      } else {
        // Player gave wrong aisle — penalise and leave NPC confused
        setNpcIntents(prev => ({ ...prev, [npcId]: { ...intent, status: 'wrong-aisle' } }))
        setNpcTargets(prev => ({ ...prev, [npcId]: null }))
        setGameState(prev => ({
          ...prev,
          misdirectedCount: prev.misdirectedCount + 1,
        }))
      }
      return
    }

    if (intent?.status === 'found') {
      // NPC has reached the item — collect it on their behalf
      const item = sceneItems.find(i => i.id === intent.seekingItem)
      if (item) {
        setCollectedItemIds(prev =>
          prev.includes(item.id) ? prev : [...prev, item.id],
        )
        setShakeSignal(s => s + 1)
        setGameState(prev => {
          if (prev.completedObjectiveIds.includes(item.objectiveId)) return prev
          setNewlyCompleted([item.objectiveId])
          setTimeout(() => setNewlyCompleted([]), 3000)
          return {
            ...prev,
            completedObjectiveIds: [...prev.completedObjectiveIds, item.objectiveId],
          }
        })
      }
      setNpcIntents(prev => {
        const next = { ...prev }
        delete next[npcId]
        return next
      })
      setNpcTargets(prev => ({ ...prev, [npcId]: null }))
      return
    }

    // Default: moveTo target reached, just clear it
    setNpcTargets(prev => ({ ...prev, [npcId]: null }))
  }, [sceneItems])

  const handleCollectItem = useCallback((itemId: string) => {
    const item = sceneItems.find(i => i.id === itemId)
    if (!item || collectedItemIds.includes(itemId)) return

    setCollectedItemIds(prev => [...prev, itemId])
    setShakeSignal(s => s + 1)

    // Mark the linked objective complete if not already done
    if (!gameState.completedObjectiveIds.includes(item.objectiveId)) {
      setGameState(prev => ({
        ...prev,
        completedObjectiveIds: [...prev.completedObjectiveIds, item.objectiveId],
      }))
      setNewlyCompleted([item.objectiveId])
      setTimeout(() => setNewlyCompleted([]), 3000)
    }
  }, [sceneItems, collectedItemIds, gameState.completedObjectiveIds])

  // Stale-closure-safe ref for gameState (used in proximity callback)
  const gameStateRef = useRef(gameState)
  gameStateRef.current = gameState

  // ── NPC proximity trigger ──────────────────────────────────────
  // Fires once when the player first walks within APPROACH_DIST of an NPC.
  // Used to trigger Jim's greeting when the player physically finds him.
  const handleNPCProximity = useCallback((npcId: string) => {
    const gs = gameStateRef.current
    // Only Jim has a proximity greeting in this scenario
    const event = scenario.chanceEvents.find(e => e.npcId === npcId)
    if (!event) return
    // Already triggered, or another chat is open — skip
    if (gs.triggeredChanceEventIds.includes(event.id)) return
    if (gs.activeNpcId) return

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
    setTimeout(() => inputRef.current?.focus(), 150)
  }, [scenario])

  const handleFinish = useCallback(() => {
    sessionStorage.setItem(
      'gameResult',
      JSON.stringify({
        scenarioId: scenario.id,
        conversations: gameState.conversations,
        completedObjectiveIds: gameState.completedObjectiveIds,
        misdirectedCount: gameState.misdirectedCount,
      }),
    )
    router.push('/results')
  }, [gameState, scenario.id, router])

  const activeNpc = scenario.npcs.find(n => n.id === gameState.activeNpcId)
  const chatOpen  = !!gameState.activeNpcId

  return (
    <div className="h-screen w-screen overflow-hidden bg-black relative select-none">
      {/* 3-D world */}
      <World
        scenario={scenario}
        conversations={gameState.conversations}
        items={sceneItems}
        collectedItemIds={collectedItemIds}
        chatOpen={chatOpen}
        shakeSignal={shakeSignal}
        npcTargets={npcTargets}
        onTalkToNPC={handleTalkToNPC}
        onCollectItem={handleCollectItem}
        onLockedChange={setIsLocked}
        onTargetReached={handleTargetReached}
        onNPCProximity={handleNPCProximity}
      />

      {/* HUD overlays */}
      <GameHUD
        scenario={scenario}
        completedObjectiveIds={gameState.completedObjectiveIds}
        conversations={gameState.conversations}
        newlyCompleted={newlyCompleted}
        isLocked={isLocked}
        chatOpen={chatOpen}
        onFinish={handleFinish}
      />

      {/* Chat window */}
      {chatOpen && activeNpc && (
        <ChatOverlay
          npc={activeNpc}
          messages={gameState.conversations[gameState.activeNpcId!] ?? []}
          isLoading={isLoading}
          onSend={handleSend}
          onClose={handleCloseChat}
          inputRef={inputRef}
        />
      )}
    </div>
  )
}
