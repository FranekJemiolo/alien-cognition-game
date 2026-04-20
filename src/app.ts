import { AppState, createInitialState } from './core/state.js'
import { decodeState, encodeState } from './core/urlState.js'
import { seededRng } from './core/rng.js'
import { AudioEngine, initAudioAutoResume } from './audio/engine.js'
import { playStepPulse } from './audio/signal.js'
import { playBeliefState } from './audio/belief.js'
import { playHallucination } from './audio/hallucination.js'
import { updateMix } from './audio/mix.js'
import { generatePuzzle, validateAnswer } from './game/puzzle.js'
import { updateBeliefs } from './cognition/beliefs.js'
import { generateHallucinations, clampHallucinationsForMobile } from './cognition/hallucinations.js'
import { updateStreak } from './cognition/streaks.js'
import { calculateScore } from './game/scoring.js'
import { recordFrame } from './replay/recorder.js'
import { renderBootScreen, bindBootScreen } from './ui/screens/boot.js'
import { renderMapScreen, bindMapScreen } from './ui/screens/map.js'
import { renderPuzzleScreen, bindPuzzleScreen } from './ui/screens/puzzle.js'
import { renderEndScreen, bindEndScreen } from './ui/screens/end.js'
import { startTransition, updateTransition } from './ui/transitions.js'
import { SymbolId } from './rules/registry.js'

// Main app state
let state: AppState
let audioEngine: AudioEngine
let currentPuzzle: any = null
let selectedAnswer: SymbolId | null = null
let showFeedback = false
let isCorrect = false
let replayFrames: any[] = []

// Initialize app
export function init() {
  // Parse URL state or create new
  const urlState = decodeState(window.location.hash)
  
  if (urlState.seed) {
    state = createInitialState(urlState.seed)
    Object.assign(state, urlState)
  } else {
    const seed = Math.floor(Math.random() * 1000000)
    state = createInitialState(seed)
  }

  // Initialize audio
  audioEngine = new AudioEngine()
  initAudioAutoResume(audioEngine)

  // Render initial screen
  render()

  // Setup URL sync
  window.addEventListener('hashchange', () => {
    const urlState = decodeState(window.location.hash)
    if (urlState.seed) {
      Object.assign(state, urlState)
      render()
    }
  })
}

// Render current screen
function render() {
  const app = document.getElementById('app')
  if (!app) return

  let html = ''

  switch (state.screen) {
    case 'BOOT':
      html = renderBootScreen(state)
      break
    case 'MAP':
      html = renderMapScreen(state)
      break
    case 'PUZZLE':
      html = renderPuzzleScreen(currentPuzzle, selectedAnswer, showFeedback, isCorrect)
      break
    case 'END':
      html = renderEndScreen(state)
      break
    default:
      html = '<div>Unknown screen</div>'
  }

  app.innerHTML = html

  // Bind event handlers
  bindHandlers()
}

// Bind event handlers based on current screen
function bindHandlers() {
  switch (state.screen) {
    case 'BOOT':
      bindBootScreen(() => {
        startTransition(state, 'MAP')
        animateTransition()
      })
      break
    case 'MAP':
      bindMapScreen(() => {
        startTransition(state, 'PUZZLE')
        generateNewPuzzle()
        animateTransition()
      })
      break
    case 'PUZZLE':
      bindPuzzleScreen(
        (choice) => {
          selectedAnswer = choice
          showFeedback = false
          render()
        },
        () => {
          if (!selectedAnswer) return
          submitAnswer()
        }
      )
      break
    case 'END':
      bindEndScreen(
        () => shareRun(),
        () => restart()
      )
      break
  }
}

// Animate transition
function animateTransition() {
  const interval = setInterval(() => {
    updateTransition(state)
    
    if (!state.transition) {
      clearInterval(interval)
      render()
    }
  }, 30)
}

// Generate new puzzle
function generateNewPuzzle() {
  currentPuzzle = generatePuzzle(state.seed, state.level, state.puzzleIndex)
  selectedAnswer = null
  showFeedback = false
  isCorrect = false
  state.puzzleIndex++
  updateURL()
}

// Submit answer
function submitAnswer() {
  const correct = validateAnswer(currentPuzzle, [selectedAnswer!])
  isCorrect = correct
  showFeedback = true

  // Update beliefs
  state.beliefs = updateBeliefs(
    state.beliefs,
    correct,
    currentPuzzle.realRules,
    seededRng(state.seed + state.puzzleIndex)
  )

  // Update hallucination level
  state.hallucinationLevel = 1 - (state.streak.stability / 10)

  // Generate hallucinations
  state.hallucinations = generateHallucinations(
    state.seed,
    state.puzzleIndex,
    state.streak,
    state.hallucinationLevel
  )
  state.hallucinations = clampHallucinationsForMobile(state.hallucinations)

  // Update streak
  state.streak = updateStreak(state.streak, correct, state.hallucinationLevel)

  // Calculate score
  const scoreBreakdown = calculateScore(
    correct,
    state.beliefs,
    1,
    state.hallucinationLevel,
    state.streak
  )
  state.score += scoreBreakdown.total

  // Play audio
  if (state.audioEnabled) {
    if (correct) {
      playStepPulse(audioEngine, state.puzzleIndex, 1)
    } else {
      playHallucination(audioEngine, state.hallucinationLevel)
    }
    playBeliefState(audioEngine, state.beliefs)
    updateMix(audioEngine, state.beliefs, state.hallucinationLevel)
  }

  // Record frame
  replayFrames.push(recordFrame(
    state.puzzleIndex,
    currentPuzzle.sequence,
    state.beliefs,
    state.hallucinations,
    {
      type: correct ? 'STEP' : 'HALLUCINATION',
      intensity: state.hallucinationLevel
    }
  ))
  
  updateURL()

  render()

  // Auto-advance after delay
  setTimeout(() => {
    if (correct) {
      // Check if level complete (5 puzzles per level)
      // puzzleIndex was already incremented, so check if it's >= 5
      if (state.puzzleIndex >= 5) {
        state.level++
        state.puzzleIndex = 0
        updateURL()
        if (state.level >= 5) {
          startTransition(state, 'END')
          animateTransition()
        } else {
          generateNewPuzzle()
          render()
        }
      } else {
        generateNewPuzzle()
        render()
      }
    } else {
      // Reset streak on wrong answer
      state.streak.correct = 0
      updateURL()
      generateNewPuzzle()
      render()
    }
  }, 1500)
}

// Share run
function shareRun() {
  const url = window.location.origin + window.location.pathname + encodeState(state)
  navigator.clipboard.writeText(url).then(() => {
    alert('Cognition run copied to clipboard!')
  })
}

// Restart
function restart() {
  const newSeed = Math.floor(Math.random() * 1000000)
  state = createInitialState(newSeed)
  replayFrames = []
  window.location.hash = encodeState(state)
  render()
}

// Update URL hash with current state
function updateURL() {
  window.location.hash = encodeState(state)
}

// Start app
init()
