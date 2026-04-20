import { AudioEngine } from './engine.js'
import { Belief } from '../core/state.js'

// Play belief state as sustained tone
export function playBeliefState(engine: AudioEngine, beliefs: Belief[]) {
  // Stop existing belief oscillator
  if (engine.beliefOsc) {
    try {
      engine.beliefOsc.stop()
    } catch (e) {
      // Ignore if already stopped
    }
  }

  if (beliefs.length === 0) return

  const avg = beliefs.reduce((a, b) => a + b.confidence, 0) / beliefs.length

  const osc = engine.ctx.createOscillator()
  const gain = engine.ctx.createGain()

  osc.type = 'triangle'
  osc.frequency.value = 100 + avg * 300

  gain.gain.value = 0.1 + avg * 0.1

  osc.connect(gain)
  gain.connect(engine.beliefBus)

  osc.start()
  engine.beliefOsc = osc
}
