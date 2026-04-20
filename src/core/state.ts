// Core application state
export type Screen = "BOOT" | "MAP" | "PUZZLE" | "END" | "REPLAY"

export type Belief = {
  ruleType: string
  confidence: number
}

export type Hallucination = {
  type: string
  strength: number
  target: string
}

export type Streak = {
  correct: number
  stability: number
  perception: number
  bestCorrect: number
}

export type TransitionState = {
  active: boolean
  from: Screen
  to: Screen
  progress: number
}

export type AppState = {
  screen: Screen
  seed: number
  beliefs: Belief[]
  hallucinations: Hallucination[]
  hallucinationLevel: number
  streak: Streak
  level: number
  score: number
  transition: TransitionState | null
  audioEnabled: boolean
  audioIntensity: number
  isReplay: boolean
  replayIndex?: number
}

export function createInitialState(seed: number): AppState {
  return {
    screen: "BOOT",
    seed,
    beliefs: [],
    hallucinations: [],
    hallucinationLevel: 0,
    streak: {
      correct: 0,
      stability: 0,
      perception: 0,
      bestCorrect: 0
    },
    level: 0,
    score: 0,
    transition: null,
    audioEnabled: true,
    audioIntensity: 1,
    isReplay: false
  }
}
