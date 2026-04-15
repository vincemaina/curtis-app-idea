import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getScenario, getNPC } from '@/lib/scenarios'
import type { AnalyzeRequest, AnalysisResult } from '@/lib/types'

const client = new Anthropic()

function gradeFromScore(score: number): string {
  if (score >= 9) return 'S'
  if (score >= 7.5) return 'A'
  if (score >= 6) return 'B'
  if (score >= 4.5) return 'C'
  return 'D'
}

export async function POST(req: NextRequest) {
  try {
    const body: AnalyzeRequest = await req.json()
    const { scenarioId, conversations, completedObjectiveIds } = body

    const scenario = getScenario(scenarioId)
    if (!scenario) return NextResponse.json({ error: 'Scenario not found' }, { status: 404 })

    // Build transcript for each NPC conversation
    const transcripts = Object.entries(conversations)
      .filter(([, msgs]) => msgs.length > 0)
      .map(([npcId, msgs]) => {
        const npc = getNPC(scenario, npcId)
        const lines = msgs.map(m =>
          m.role === 'user' ? `Player: ${m.content}` : `${npc?.name ?? 'NPC'}: ${m.content}`
        ).join('\n')
        return {
          npcId,
          npcName: npc?.name ?? npcId,
          npcPersonality: npc?.personality ?? '',
          npcMood: npc?.mood ?? 'neutral',
          transcript: lines,
        }
      })

    const completedObjectiveDescriptions = scenario.objectives
      .filter(o => completedObjectiveIds.includes(o.id))
      .map(o => `- ${o.description} (${o.type})`)

    const missedObjectiveDescriptions = scenario.objectives
      .filter(o => !completedObjectiveIds.includes(o.id))
      .map(o => `- ${o.description} (${o.type})`)

    const npcsWithHiddenNeeds = scenario.npcs
      .filter(n => n.needsHelp)
      .map(n => `- ${n.name}: "${n.needsHelp}" — visible signs: ${n.helpSignals?.join(', ')}`)

    const systemPrompt = `You are an expert communication coach analysing a social skills training session.
The trainee has just completed a simulated scenario in a conversational skills game.
Your job is to provide genuinely helpful, constructive, and specific coaching feedback.

SCENARIO: ${scenario.name}
SETTING: ${scenario.setting}

Be direct, warm, and specific. Focus on actionable improvements. Don't be vague.
Reference specific lines from the transcript when possible.
Acknowledge what they did well before critiquing.

OUTPUT FIELDS:
- overallScore: number 0–10 (one decimal place)
- conversationScores: per-NPC breakdown with npcId, npcName, score, positives, improvements, tips, and optional exampleImprovement
- completedObjectives: list of completed objective descriptions
- missedObjectives: list of missed objective descriptions
- missedOpportunities: specific missed social opportunities with explanation
- keyLessons: the 3–4 most important takeaways
- overallFeedback: 2–3 sentence overall assessment, warm but honest`

    const userPrompt = `Please analyse the following conversation session.

COMPLETED OBJECTIVES:
${completedObjectiveDescriptions.length ? completedObjectiveDescriptions.join('\n') : '(none)'}

MISSED OBJECTIVES:
${missedObjectiveDescriptions.length ? missedObjectiveDescriptions.join('\n') : '(none)'}

CHARACTERS WHO NEEDED HELP (the player may or may not have noticed):
${npcsWithHiddenNeeds.length ? npcsWithHiddenNeeds.join('\n') : '(none)'}

CONVERSATION TRANSCRIPTS:
${transcripts.map(t => `
=== Conversation with ${t.npcName} (mood: ${t.npcMood}) ===
Character info: ${t.npcPersonality.slice(0, 200)}

${t.transcript}
`).join('\n')}

Analyse each conversation individually, then provide overall feedback.
Be specific — quote actual lines from the transcript when giving feedback.
Focus especially on:
- Opening lines (did they use "Excuse me" / "Sorry to bother you"?)
- Politeness and social awareness
- Whether they read the person's mood and adapted accordingly
- How they ended conversations (did they thank people?)
- Any missed opportunities to help others`

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: userPrompt }],
      output_config: {
        format: {
          type: 'json_schema',
          schema: {
            type: 'object',
            properties: {
              overallScore: { type: 'number' },
              conversationScores: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    npcId: { type: 'string' },
                    npcName: { type: 'string' },
                    score: { type: 'number' },
                    positives: { type: 'array', items: { type: 'string' } },
                    improvements: { type: 'array', items: { type: 'string' } },
                    tips: { type: 'array', items: { type: 'string' } },
                    exampleImprovement: { type: 'string' },
                  },
                  required: ['npcId', 'npcName', 'score', 'positives', 'improvements', 'tips'],
                  additionalProperties: false,
                },
              },
              completedObjectives: { type: 'array', items: { type: 'string' } },
              missedObjectives: { type: 'array', items: { type: 'string' } },
              missedOpportunities: { type: 'array', items: { type: 'string' } },
              keyLessons: { type: 'array', items: { type: 'string' } },
              overallFeedback: { type: 'string' },
            },
            required: ['overallScore', 'conversationScores', 'completedObjectives', 'missedObjectives', 'missedOpportunities', 'keyLessons', 'overallFeedback'],
            additionalProperties: false,
          },
        },
      },
    })

    const text = response.content.find(b => b.type === 'text')?.text ?? '{}'
    const parsed = JSON.parse(text)
    const analysis: AnalysisResult = {
      ...parsed,
      grade: gradeFromScore(parsed.overallScore),
    }

    return NextResponse.json(analysis)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Analyze API error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
