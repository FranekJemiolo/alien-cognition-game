import { Replay, ReplayFrame } from './recorder.js'
import { AudioEngine } from '../audio/engine.js'
import { playStepPulse } from '../audio/signal.js'
import { playBeliefState } from '../audio/belief.js'
import { playHallucination } from '../audio/hallucination.js'
import { updateMix } from '../audio/mix.js'

export type ReplayPlayerState = {
  replay: Replay
  index: number
  isPlaying: boolean
  audioEngine: AudioEngine
}

// Sync audio to specific frame
export function syncAudioToFrame(engine: AudioEngine, frame: ReplayFrame) {
  updateMix(engine, frame.beliefs, frame.audioEvent.intensity)

  switch (frame.audioEvent.type) {
    case 'STEP':
      playStepPulse(engine, frame.step, 0.5)
      break
    case 'BELIEF':
      playBeliefState(engine, frame.beliefs)
      break
    case 'HALLUCINATION':
      playHallucination(engine, frame.audioEvent.intensity)
      break
  }
}

// Play replay automatically
export function playReplay(player: ReplayPlayerState, onFrame?: (index: number) => void) {
  player.isPlaying = true

  const loop = () => {
    if (!player.isPlaying) return
    if (player.index >= player.replay.frames.length - 1) {
      player.isPlaying = false
      return
    }

    player.index++
    if (onFrame) onFrame(player.index)

    setTimeout(loop, 120)
  }

  loop()
}

// Pause replay
export function pauseReplay(player: ReplayPlayerState) {
  player.isPlaying = false
}

// Set specific frame
export function setFrame(player: ReplayPlayerState, index: number) {
  player.index = Math.max(0, Math.min(index, player.replay.frames.length - 1))
}
