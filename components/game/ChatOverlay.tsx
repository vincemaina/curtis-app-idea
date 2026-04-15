'use client'

import { useState, useRef, useEffect, useCallback, type RefObject } from 'react'
import type { NPC, Message } from '@/lib/types'

const MOOD_BADGE: Record<string, string> = {
  friendly: 'text-green-400 bg-green-500/20 border-green-500/30',
  neutral:  'text-gray-400 bg-gray-500/20 border-gray-500/30',
  busy:     'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
  stressed: 'text-red-400 bg-red-500/20 border-red-500/30',
  sad:      'text-blue-400 bg-blue-500/20 border-blue-500/30',
  confused: 'text-orange-400 bg-orange-500/20 border-orange-500/30',
}

interface Props {
  npc: NPC
  messages: Message[]
  isLoading: boolean
  onSend: (text: string) => void
  onClose: () => void
  inputRef: RefObject<HTMLInputElement | null>
}

export default function ChatOverlay({
  npc,
  messages,
  isLoading,
  onSend,
  onClose,
  inputRef,
}: Props) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Escape key closes the chat
  const handleClose = useCallback(() => onClose(), [onClose])
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleClose])

  const handleSend = () => {
    if (!input.trim() || isLoading) return
    onSend(input.trim())
    setInput('')
  }

  return (
    // Capture click/pointer events so they don't bleed through to the canvas
    <div
      className="absolute inset-0 z-30 flex items-end justify-center pb-6"
      style={{ background: 'rgba(0,0,0,0.58)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.stopPropagation()}
      onPointerDown={e => e.stopPropagation()}
    >
      <div
        className="w-full max-w-2xl mx-4 flex flex-col rounded-2xl shadow-2xl"
        style={{
          background: '#0f0f1a',
          border: '1px solid rgba(124,92,252,0.35)',
          maxHeight: '72vh',
        }}
      >
        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 flex-shrink-0">
          <span className="text-2xl leading-none">{npc.avatarEmoji}</span>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white text-sm">{npc.name}</div>
            <div className="text-xs text-white/45 truncate">{npc.currentSituation}</div>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded border flex-shrink-0 ${MOOD_BADGE[npc.mood] ?? MOOD_BADGE.neutral}`}
          >
            {npc.mood}
          </span>
          <button
            onClick={onClose}
            className="ml-1 text-xs text-white/40 hover:text-white transition-colors flex-shrink-0"
          >
            ← Walk away
          </button>
        </div>

        {/* ── Messages ── */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
          {messages.length === 0 && (
            <p className="text-center text-white/35 text-sm italic py-6">
              You approach {npc.name}. What do you say?
            </p>
          )}

          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'npc' && (
                <span className="text-xl leading-none flex-shrink-0 mb-0.5">{npc.avatarEmoji}</span>
              )}
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-game-accent text-white rounded-br-sm'
                    : 'text-white rounded-bl-sm'
                }`}
                style={
                  msg.role === 'npc'
                    ? { background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)' }
                    : undefined
                }
              >
                {msg.role === 'npc' && (
                  <div className="text-xs text-white/45 mb-1 font-medium">{msg.npcName}</div>
                )}
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-end gap-2">
              <span className="text-xl leading-none">{npc.avatarEmoji}</span>
              <div
                className="px-4 py-2.5 rounded-2xl rounded-bl-sm flex items-center gap-1"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                {[0, 150, 300].map(delay => (
                  <div
                    key={delay}
                    className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Input ── */}
        <div className="px-3 pb-3 pt-2 border-t border-white/10 flex-shrink-0">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={`Say something to ${npc.name}…`}
              disabled={isLoading}
              className="flex-1 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none transition-colors disabled:opacity-50"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.18)',
              }}
              onFocus={e =>
                (e.currentTarget.style.border = '1px solid rgba(124,92,252,0.55)')
              }
              onBlur={e =>
                (e.currentTarget.style.border = '1px solid rgba(255,255,255,0.18)')
              }
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-game-accent hover:bg-game-accent-dim disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors flex-shrink-0"
            >
              Send
            </button>
          </div>
          <p className="text-xs text-white/25 mt-1.5 px-1">
            Enter to send · Walk away to continue exploring
          </p>
        </div>
      </div>
    </div>
  )
}
