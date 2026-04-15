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
}

// --- API types ---

export interface ChatRequest {
  scenarioId: string
  npcId: string
  userMessage: string
  conversationHistory: Message[]
  completedObjectiveIds: string[]
}

export interface ChatResponse {
  dialogue: string
  emotion: NPCMood
  objectivesCompleted: string[]
  conversationEnded: boolean
  /** Item ID the NPC intends to physically walk to and retrieve (supermarket only) */
  moveTo?: string
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
