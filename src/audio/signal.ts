import { AudioEngine } from './engine.js'

// Play step pulse on signal bus
export function playStepPulse(engine: AudioEngine, stepIndex: number, intensity: number = 1) {
  const osc = engine.ctx.createOscillator()
  const gain = engine.ctx.createGain()

  osc.type = 'sine'
  osc.frequency.value = 200 + stepIndex * 20

  gain.gain.setValueAtTime(0.2 * intensity, engine.ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, engine.ctx.currentTime + 0.15)

  osc.connect(gain)
  gain.connect(engine.signalBus)

  osc.start()
  osc.stop(engine.ctx.currentTime + 0.15)
}
