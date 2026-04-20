import { base36, parseBase36 } from '../utils/base36.js'
import { AppState, Streak } from './state.js'

// Encode streaks to base36 tuple
export function encodeStreaks(streak: Streak): string {
  return [
    base36(streak.correct),
    base36(streak.stability),
    base36(streak.perception),
    base36(streak.bestCorrect)
  ].join(".")
}

// Decode streaks from base36 tuple
export function decodeStreaks(str: string): Streak {
  const [c, s, p, b] = str.split(".")
  return {
    correct: parseBase36(c),
    stability: parseBase36(s),
    perception: parseBase36(p),
    bestCorrect: parseBase36(b)
  }
}

// Encode full state to URL hash
export function encodeState(state: AppState): string {
  const beliefsBits = encodeBeliefs(state.beliefs)
  return `#${base36(state.seed)}.${beliefsBits}.${base36(state.level)}.${base36(state.puzzleIndex)}.${base36(state.score)}.${encodeStreaks(state.streak)}${state.isReplay ? '.replay' : ''}`
}

// Simple belief encoding (bitmask for MVP)
function encodeBeliefs(beliefs: any[]): string {
  let bits = 0
  beliefs.forEach((b, i) => {
    if (b.confidence > 0.75) {
      bits |= (1 << i)
    }
  })
  return base36(bits)
}

// Decode state from URL hash
export function decodeState(hash: string): Partial<AppState> {
  const clean = hash.replace("#", "")
  const parts = clean.split(".")
  
  if (parts.length < 6) return {}
  
  const seed = parseBase36(parts[0])
  const beliefsBits = parseBase36(parts[1])
  const level = parseBase36(parts[2])
  const puzzleIndex = parseBase36(parts[3])
  const score = parseBase36(parts[4])
  const streak = decodeStreaks(parts[5])
  const isReplay = parts.includes("replay")
  
  return {
    seed,
    level,
    puzzleIndex,
    score,
    streak,
    isReplay,
    beliefs: decodeBeliefs(beliefsBits)
  }
}

// Decode beliefs from bitmask
function decodeBeliefs(bits: number): any[] {
  const beliefs = []
  for (let i = 0; i < 32; i++) {
    if (bits & (1 << i)) {
      beliefs.push({ ruleType: `rule_${i}`, confidence: 1.0 })
    }
  }
  return beliefs
}
