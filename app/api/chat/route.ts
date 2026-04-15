import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getScenario, getNPC } from '@/lib/scenarios'
import type { ChatRequest, ChatResponse } from '@/lib/types'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json()
    const { scenarioId, npcId, userMessage, conversationHistory, completedObjectiveIds, npcIntent } = body

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

${npcIntent
  ? `CURRENT SEARCHING STATE: ${
      npcIntent.status === 'en-route'
        ? `You are currently walking to Aisle ${npcIntent.targetAisle} to look for ${npcIntent.seekingItem}, based on directions the player just gave you. If they speak to you, tell them you're on your way there now.`
        : npcIntent.status === 'wrong-aisle'
        ? `You went to Aisle ${npcIntent.targetAisle} to look for ${npcIntent.seekingItem} but it wasn't there. You're confused and a little frustrated — the player sent you to the wrong place.`
        : ''
    }`
  : ''}

OUTPUT FIELDS:
- dialogue: what ${npc.name} says out loud (1-4 sentences, in character)
- emotion: the character's current emotion — one of: friendly|neutral|busy|stressed|sad|confused
- objectivesCompleted: list of objective IDs genuinely completed by this exchange (usually empty)
- conversationEnded: true only if the user said a proper goodbye and the conversation has naturally ended
- moveTo: Set this when you know the exact item location and will physically walk there to retrieve it (e.g. "I'll go grab that for you"). Valid item IDs: "chickpeas", "tomatoes", "coconut", "potatoes". Omit if just giving directions.
- searchAisle: Set this (1, 2, or 3) when the player tells you which aisle an item is in and you decide to go check. Aisle 1 = Tinned Goods / Soups / Household (left side, x≈−8). Aisle 2 = Cereals / Dairy / Drinks (centre, x≈0). Aisle 3 = World Foods / Health / International (right side, x≈8). Requires seekingItem.
- seekingItem: Required when searchAisle is set. The item ID you're heading to search for: "chickpeas", "tomatoes", "coconut", or "potatoes".

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
      tools: [
        {
          name: 'respond_as_npc',
          description: 'Submit the NPC response as structured JSON.',
          input_schema: {
            type: 'object',
            properties: {
              dialogue: { type: 'string' },
              emotion: {
                type: 'string',
                enum: ['friendly', 'neutral', 'busy', 'stressed', 'sad', 'confused'],
              },
              objectivesCompleted: { type: 'array', items: { type: 'string' } },
              conversationEnded: { type: 'boolean' },
              moveTo: {
                type: 'string',
                enum: ['chickpeas', 'tomatoes', 'coconut', 'potatoes'],
                description: 'Item the NPC will physically walk to (knows exact location) — omit if not applicable',
              },
              searchAisle: {
                type: 'integer',
                enum: [1, 2, 3],
                description: 'Aisle number the NPC will walk to based on player directions — requires seekingItem',
              },
              seekingItem: {
                type: 'string',
                enum: ['chickpeas', 'tomatoes', 'coconut', 'potatoes'],
                description: 'Item the NPC is heading to search for — required when searchAisle is set',
              },
            },
            required: ['dialogue', 'emotion', 'objectivesCompleted', 'conversationEnded'],
          },
        },
      ],
      tool_choice: { type: 'tool', name: 'respond_as_npc' },
    })

    const toolUse = response.content.find(b => b.type === 'tool_use')
    if (!toolUse || toolUse.type !== 'tool_use') throw new Error('No tool use in response')
    const parsed = toolUse.input as ChatResponse

    return NextResponse.json(parsed)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Chat API error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
