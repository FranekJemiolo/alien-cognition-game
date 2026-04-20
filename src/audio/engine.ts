// Audio engine with multi-bus architecture
export class AudioEngine {
  ctx: AudioContext
  master: GainNode
  signalBus: GainNode
  beliefBus: GainNode
  hallucinationBus: GainNode

  signalOsc?: OscillatorNode
  beliefOsc?: OscillatorNode

  constructor() {
    this.ctx = new AudioContext()

    this.master = this.ctx.createGain()
    this.signalBus = this.ctx.createGain()
    this.beliefBus = this.ctx.createGain()
    this.hallucinationBus = this.ctx.createGain()

    // Routing
    this.signalBus.connect(this.master)
    this.beliefBus.connect(this.master)
    this.hallucinationBus.connect(this.master)
    this.master.connect(this.ctx.destination)

    this.master.gain.value = 0.6
  }

  // Initialize audio context (must be user-triggered)
  async init() {
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume()
    }
  }
}

// Auto-resume on interaction
export function initAudioAutoResume(engine: AudioEngine) {
  const resume = () => {
    engine.ctx.resume()
    document.removeEventListener('touchstart', resume)
    document.removeEventListener('click', resume)
  }

  document.addEventListener('touchstart', resume)
  document.addEventListener('click', resume)
}
