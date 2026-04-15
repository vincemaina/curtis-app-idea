'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { Scenario, GameState, Message, ChatResponse } from '@/lib/types'
import { SUPERMARKET_ITEMS } from '@/lib/supermarket-items'
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
  })
  const [isLoading,       setIsLoading]       = useState(false)
  const [isLocked,        setIsLocked]        = useState(false)
  const [newlyCompleted,  setNewlyCompleted]  = useState<string[]>([])
  const [collectedItemIds, setCollectedItemIds] = useState<string[]>([])
  const [npcTargets, setNpcTargets] = useState<Record<string, [number, number, number] | null>>({})

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
        }

        // NPC declared they'll physically go fetch an item — send them there
        if (data.moveTo && scenario.id === 'supermarket') {
          const item = sceneItems.find(i => i.id === data.moveTo)
          if (item) {
            setNpcTargets(prev => ({ ...prev, [npcId]: item.position }))
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
    [gameState, isLoading, scenario],
  )

  const handleTargetReached = useCallback((npcId: string) => {
    setNpcTargets(prev => ({ ...prev, [npcId]: null }))
  }, [])

  const handleCollectItem = useCallback((itemId: string) => {
    const item = sceneItems.find(i => i.id === itemId)
    if (!item || collectedItemIds.includes(itemId)) return

    setCollectedItemIds(prev => [...prev, itemId])

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

  const handleFinish = useCallback(() => {
    sessionStorage.setItem(
      'gameResult',
      JSON.stringify({
        scenarioId: scenario.id,
        conversations: gameState.conversations,
        completedObjectiveIds: gameState.completedObjectiveIds,
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
        npcTargets={npcTargets}
        onTalkToNPC={handleTalkToNPC}
        onCollectItem={handleCollectItem}
        onLockedChange={setIsLocked}
        onTargetReached={handleTargetReached}
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
