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

OUTPUT: Respond with ONLY valid JSON, no other text, matching this exact schema:
{
  "overallScore": <number 0-10, one decimal>,
  "conversationScores": [
    {
      "npcId": "<npcId>",
      "npcName": "<name>",
      "score": <0-10>,
      "positives": ["<specific thing they did well>", ...],
      "improvements": ["<specific thing to improve>", ...],
      "tips": ["<actionable advice for next time>", ...],
      "exampleImprovement": "<optional: rewrite one of their lines to show how it could be better>"
    }
  ],
  "completedObjectives": [<list of completed objective descriptions>],
  "missedObjectives": [<list of missed objective descriptions>],
  "missedOpportunities": ["<specific missed social opportunity with explanation>", ...],
  "keyLessons": ["<the 3-4 most important things to take away>", ...],
  "overallFeedback": "<2-3 sentence overall assessment, warm but honest>"
}`

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
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: userPrompt }],
    })

    const rawText = response.content.find(b => b.type === 'text')?.text ?? ''

    let analysis: AnalysisResult
    try {
      const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
      const parsed = JSON.parse(cleaned)
      analysis = {
        ...parsed,
        grade: gradeFromScore(parsed.overallScore),
      }
    } catch {
      // Fallback if parsing fails
      analysis = {
        overallScore: 5,
        grade: 'C',
        conversationScores: transcripts.map(t => ({
          npcId: t.npcId,
          npcName: t.npcName,
          score: 5,
          positives: ['You started a conversation — that takes courage.'],
          improvements: ['Try to be more specific in your questions.'],
          tips: ['Start with "Excuse me" to signal you want to interact politely.'],
        })),
        completedObjectives: completedObjectiveDescriptions,
        missedObjectives: missedObjectiveDescriptions,
        missedOpportunities: [],
        keyLessons: ['Practice makes perfect — try the scenario again!'],
        overallFeedback: rawText.slice(0, 500),
      }
    }

    return NextResponse.json(analysis)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Analyze API error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
