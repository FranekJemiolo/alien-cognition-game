import { AudioEngine } from './engine.js'

// Play hallucination distortion sound
export function playHallucination(engine: AudioEngine, intensity: number) {
  const osc = engine.ctx.createOscillator()
  const gain = engine.ctx.createGain()

  osc.type = 'sawtooth'
  osc.frequency.value = 50 + Math.random() * 800

  // Detune creates cognitive instability
  osc.detune.value = (Math.random() - 0.5) * intensity * 300

  gain.gain.value = intensity * 0.08

  osc.connect(gain)
  gain.connect(engine.hallucinationBus)

  osc.start()
  setTimeout(() => {
    try {
      osc.stop()
    } catch (e) {
      // Ignore if already stopped
    }
  }, 250)
}
