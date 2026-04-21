import { AudioEngine } from './engine.js'
import { Belief } from '../core/state.js'

// Play belief state as sustained tone
export function playBeliefState(engine: AudioEngine, beliefs: Belief[]) {
  // Stop existing belief oscillator and LFO
  if (engine.beliefOsc) {
    try {
      engine.beliefOsc.stop()
    } catch (e) {
      // Ignore if already stopped
    }
  }
  if ((engine as any).beliefLfo) {
    try {
      (engine as any).beliefLfo.stop()
    } catch (e) {
      // Ignore if already stopped
    }
  }

  if (beliefs.length === 0) return

  const avg = beliefs.reduce((a, b) => a + b.confidence, 0) / beliefs.length

  const osc = engine.ctx.createOscillator()
  const gain = engine.ctx.createGain()
  const filter = engine.ctx.createBiquadFilter()

  // Varied waveforms based on confidence
  osc.type = avg > 0.5 ? 'sine' : 'triangle'
  
  // More varied frequency based on belief count and confidence
  const baseFreq = 80 + (beliefs.length * 20) + avg * 150
  osc.frequency.value = baseFreq
  
  // Add slight modulation for alien feel
  const lfo = engine.ctx.createOscillator()
  const lfoGain = engine.ctx.createGain()
  lfo.frequency.value = 2 + avg * 3
  lfoGain.gain.value = baseFreq * 0.05
  lfo.connect(lfoGain)
  lfoGain.connect(osc.frequency)
  lfo.start()

  // Low-pass filter
  filter.type = 'lowpass'
  filter.frequency.value = 400 + avg * 300
  filter.Q.value = 1

  gain.gain.value = 0.03 + avg * 0.04

  osc.connect(filter)
  filter.connect(gain)
  gain.connect(engine.beliefBus)

  osc.start()
  engine.beliefOsc = osc
  ;(engine as any).beliefLfo = lfo
}
