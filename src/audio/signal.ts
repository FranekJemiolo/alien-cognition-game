import { AudioEngine } from './engine.js'

// Play step pulse on signal bus
export function playStepPulse(engine: AudioEngine, stepIndex: number, intensity: number = 1) {
  const osc = engine.ctx.createOscillator()
  const gain = engine.ctx.createGain()
  const filter = engine.ctx.createBiquadFilter()

  // Use varied waveforms for alien feel
  const waveforms = ['sine', 'triangle', 'sawtooth']
  osc.type = waveforms[stepIndex % waveforms.length] as OscillatorType
  
  // More varied, alien-like frequencies using pentatonic-like intervals
  const baseFreq = 110 + (stepIndex % 8) * 55
  osc.frequency.setValueAtTime(baseFreq, engine.ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, engine.ctx.currentTime + 0.1)
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, engine.ctx.currentTime + 0.2)

  // Low-pass filter for softer sound
  filter.type = 'lowpass'
  filter.frequency.value = 800
  filter.Q.value = 2

  gain.gain.setValueAtTime(0.15 * intensity, engine.ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, engine.ctx.currentTime + 0.3)

  osc.connect(filter)
  filter.connect(gain)
  gain.connect(engine.signalBus)

  osc.start()
  osc.stop(engine.ctx.currentTime + 0.3)
}
