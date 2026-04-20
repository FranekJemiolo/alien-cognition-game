import { AudioEngine } from './engine.js'
import { Belief } from '../core/state.js'

// Dynamic mix based on cognition state
export function updateMix(engine: AudioEngine, beliefs: Belief[], hallucinationLevel: number) {
  const avgBelief = beliefs.length > 0
    ? beliefs.reduce((a, b) => a + b.confidence, 0) / beliefs.length
    : 0

  // SIGNAL always stable anchor
  engine.signalBus.gain.value = 0.5

  // BELIEF = clarity perception
  engine.beliefBus.gain.value = 0.1 + avgBelief * 0.7

  // HALLUCINATION = inverse coherence
  engine.hallucinationBus.gain.value = hallucinationLevel * (1 - avgBelief) * 0.5
}
