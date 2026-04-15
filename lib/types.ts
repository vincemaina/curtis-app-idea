export type Difficulty = 'beginner' | 'intermediate' | 'advanced'
export type NPCMood = 'friendly' | 'neutral' | 'busy' | 'stressed' | 'sad' | 'confused'
export type ObjectiveType = 'primary' | 'bonus'

export interface NPC {
  id: string
  name: string
  age: number
  role: string
  avatarEmoji: string
  personality: string
  currentSituation: string
  knowledge: string[]
  mood: NPCMood
  needsHelp?: string // what they need help with (for bonus objectives)
  helpSignals?: string[] // observable signs they need help
}

export interface Objective {
  id: string
  description: string
  type: ObjectiveType
  completionHint: string // what the player needs to do/say
}

export interface ChanceEvent {
  id: string
  triggerAfterMessages: number // trigger after N total messages sent
  description: string
  npcId: string
  npcMessage: string // what the NPC says to trigger the event
}

export interface Scenario {
  id: string
  name: string
  emoji: string
  description: string
  setting: string // detailed environment description
  difficulty: Difficulty
  npcs: NPC[]
  objectives: Objective[]
  chanceEvents: ChanceEvent[]
  tips: string[]
  bgGradient: string
}

// --- Game state types ---

export interface Message {
  id: string
  role: 'user' | 'npc'
  content: string
  npcId?: string
  npcName?: string
  timestamp: number
}

export interface ConversationThread {
  npcId: string
  messages: Message[]
}

export interface CompletedObjective {
  objectiveId: string
  completedAt: number
  conversationSummary: string
}

export interface GameState {
  scenarioId: string
  conversations: Record<string, Message[]> // keyed by npcId
  completedObjectiveIds: string[]
  activeNpcId: string | null
  startedAt: number
  triggeredChanceEventIds: string[]
  totalMessageCount: number
  /** How many times the player gave an NPC wrong aisle directions */
  misdirectedCount: number
}

// ── NPC Intent ────────────────────────────────────────────────────────────────
// Tracks an NPC actively searching for an item based on player directions.
export interface NPCIntent {
  seekingItem: string                           // item ID the NPC wants to find
  targetAisle: number                           // aisle the player directed them to (1-3)
  status: 'en-route' | 'found' | 'wrong-aisle' // lifecycle stage
}

// --- API types ---

export interface ChatRequest {
  scenarioId: string
  npcId: string
  userMessage: string
  conversationHistory: Message[]
  completedObjectiveIds: string[]
  /** NPC's current searching state — passed as context so they can describe what they're doing */
  npcIntent?: NPCIntent | null
}

export interface ChatResponse {
  dialogue: string
  emotion: NPCMood
  objectivesCompleted: string[]
  conversationEnded: boolean
  /** Item ID the NPC intends to physically walk to and retrieve (knows exact location) */
  moveTo?: string
  /** Aisle number (1-3) the NPC will walk to in order to search for an item */
  searchAisle?: number
  /** Item ID the NPC is heading to search for — required when searchAisle is set */
  seekingItem?: string
}

export interface AnalyzeRequest {
  scenarioId: string
  conversations: Record<string, Message[]>
  completedObjectiveIds: string[]
}

export interface ConversationScore {
  npcId: string
  npcName: string
  score: number // 0-10
  positives: string[]
  improvements: string[]
  tips: string[]
  exampleImprovement?: string // example of how a line could have been said better
}

export interface AnalysisResult {
  overallScore: number
  grade: string // S, A, B, C, D
  conversationScores: ConversationScore[]
  completedObjectives: string[]
  missedObjectives: string[]
  missedOpportunities: string[]
  keyLessons: string[]
  overallFeedback: string
}
