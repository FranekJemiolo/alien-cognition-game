import { Belief, Hallucination } from '../core/state.js'

export type ReplayFrame = {
  step: number
  sequence: string[]
  beliefs: Belief[]
  hallucinations: Hallucination[]
  audioEvent: {
    type: 'STEP' | 'BELIEF' | 'HALLUCINATION'
    intensity: number
  }
  timestamp: number
}

export type Replay = {
  seed: number
  frames: ReplayFrame[]
  outcome: 'SUCCESS' | 'FAIL'
  finalScore: number
}

// Record a single frame
export function recordFrame(
  step: number,
  sequence: string[],
  beliefs: Belief[],
  hallucinations: Hallucination[],
  audioEvent: ReplayFrame['audioEvent']
): ReplayFrame {
  return {
    step,
    sequence: [...sequence],
    beliefs: beliefs.map(b => ({ ...b })),
    hallucinations: hallucinations.map(h => ({ ...h })),
    audioEvent,
    timestamp: Date.now()
  }
}
