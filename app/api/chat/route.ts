import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getScenario, getNPC } from '@/lib/scenarios'
import type { ChatRequest, ChatResponse } from '@/lib/types'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json()
    const { scenarioId, npcId, userMessage, conversationHistory, completedObjectiveIds } = body

    const scenario = getScenario(scenarioId)
    if (!scenario) return NextResponse.json({ error: 'Scenario not found' }, { status: 404 })

    const npc = getNPC(scenario, npcId)
    if (!npc) return NextResponse.json({ error: 'NPC not found' }, { status: 404 })

    // Build the objectives context
    const pendingObjectives = scenario.objectives.filter(
      o => !completedObjectiveIds.includes(o.id)
    )
    const objectivesContext = pendingObjectives.map(o =>
      `- [${o.id}] ${o.description} (hint: ${o.completionHint})`
    ).join('\n')

    // System prompt — cached since it's stable per NPC
    const systemPrompt = `You are playing the role of ${npc.name} in a conversational skills training simulation.

CHARACTER PROFILE:
- Name: ${npc.name}, Age: ${npc.age}
- Role: ${npc.role}
- Personality: ${npc.personality}
- Current situation: ${npc.currentSituation}
- Current mood: ${npc.mood}
- Knowledge: ${npc.knowledge.join('; ')}
${npc.needsHelp ? `- You secretly need help with: ${npc.needsHelp}\n- Signs you're showing: ${npc.helpSignals?.join(', ')}` : ''}

SCENARIO: ${scenario.name}
SETTING: ${scenario.setting}

YOUR BEHAVIOUR RULES:
1. Stay fully in character at all times. Respond as ${npc.name} would genuinely respond.
2. React authentically to how the user speaks to you. If they are rude or abrupt, react accordingly. If they are polite and warm, be more forthcoming.
3. Keep responses conversational and natural — typically 1-4 sentences. Not too long.
4. If your mood is "busy", you are somewhat brief and slightly distracted, but not rude.
5. If your mood is "friendly", you are warm, open, and happy to chat.
6. If your mood is "stressed", you are short and slightly tense, but not unfriendly if addressed kindly.
7. Never break character or acknowledge this is a simulation.
8. If the user says a proper goodbye, wrap up the conversation naturally.

PENDING OBJECTIVES (you help complete these through natural conversation):
${objectivesContext}

OUTPUT FORMAT — respond with ONLY valid JSON, no other text:
{
  "dialogue": "What ${npc.name} says out loud",
  "emotion": "one of: friendly|neutral|busy|stressed|sad|confused",
  "objectivesCompleted": ["list of objective IDs that were just completed by this exchange — only if genuinely earned"],
  "conversationEnded": false
}

OBJECTIVE COMPLETION RULES:
- Only mark an objective as completed if the user has genuinely achieved it through the conversation.
- For location/item objectives: the user must have asked clearly enough that you gave them useful directions.
- For "help someone" objectives: the user must have proactively noticed and offered help to you (if you need it) — it does NOT complete just because you chatted briefly.
- Be realistic — a vague question that got a vague answer does NOT complete an objective.`

    // Build the messages for the API
    const messages: Anthropic.MessageParam[] = []

    // Add conversation history
    for (const msg of conversationHistory) {
      if (msg.role === 'user') {
        messages.push({ role: 'user', content: msg.content })
      } else {
        // Reconstruct NPC responses as assistant turns with just the dialogue
        messages.push({ role: 'assistant', content: msg.content })
      }
    }

    // Add the new user message
    messages.push({ role: 'user', content: userMessage })

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages,
    })

    const rawText = response.content.find(b => b.type === 'text')?.text ?? ''

    let parsed: ChatResponse
    try {
      // Strip potential markdown code fences
      const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
      parsed = JSON.parse(cleaned)
    } catch {
      // If JSON parsing fails, use the raw text as dialogue
      parsed = {
        dialogue: rawText || "(I'm not sure what to say)",
        emotion: 'neutral',
        objectivesCompleted: [],
        conversationEnded: false,
      }
    }

    return NextResponse.json(parsed)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Chat API error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
