import { AudioEngine } from './engine.js'

// Play hallucination distortion sound
export function playHallucination(engine: AudioEngine, intensity: number) {
  const osc = engine.ctx.createOscillator()
  const gain = engine.ctx.createGain()
  const filter = engine.ctx.createBiquadFilter()

  // Varied waveforms
  const waveforms = ['sawtooth', 'square', 'triangle']
  osc.type = waveforms[Math.floor(Math.random() * waveforms.length)] as OscillatorType
  
  // More varied frequency sweeps
  const startFreq = 60 + Math.random() * 200
  osc.frequency.setValueAtTime(startFreq, engine.ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(startFreq * (0.5 + Math.random()), engine.ctx.currentTime + 0.2)

  // Detune creates cognitive instability
  osc.detune.value = (Math.random() - 0.5) * intensity * 200

  // Band-pass filter for alien texture
  filter.type = 'bandpass'
  filter.frequency.value = 300 + Math.random() * 400
  filter.Q.value = 5 + Math.random() * 5

  gain.gain.setValueAtTime(intensity * 0.04, engine.ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, engine.ctx.currentTime + 0.3)

  osc.connect(filter)
  filter.connect(gain)
  gain.connect(engine.hallucinationBus)

  osc.start()
  setTimeout(() => {
    try {
      osc.stop()
    } catch (e) {
      // Ignore if already stopped
    }
  }, 300)
}
