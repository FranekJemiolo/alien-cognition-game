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
let showDebug = false

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

  // Setup debug toggle
  window.addEventListener('keydown', (e) => {
    if (e.key === 'd' || e.key === 'D') {
      showDebug = !showDebug
      console.log('Debug panel:', showDebug ? 'ON' : 'OFF')
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

  // Remove existing panels
  document.querySelectorAll('.debug-panel, .guide-panel').forEach(el => el.remove())

  // Add debug UI if enabled
  if (showDebug) {
    const debugPanel = document.createElement('div')
    debugPanel.className = 'debug-panel'
    debugPanel.innerHTML = renderDebugUI()
    document.body.appendChild(debugPanel)
  }

  // Always show guide panel
  const guidePanel = document.createElement('div')
  guidePanel.className = 'guide-panel'
  guidePanel.innerHTML = renderGuideUI()
  document.body.appendChild(guidePanel)

  // Add toggle button for debug only
  const toggleButtons = document.createElement('div')
  toggleButtons.className = 'toggle-buttons'
  toggleButtons.innerHTML = `
    <button id="toggle-debug" class="toggle-btn ${showDebug ? 'active' : ''}" title="Toggle Debug (D)">D</button>
  `
  document.body.appendChild(toggleButtons)

  // Bind toggle button
  document.getElementById('toggle-debug')?.addEventListener('click', () => {
    showDebug = !showDebug
    console.log('Debug panel:', showDebug ? 'ON' : 'OFF')
    render()
  })

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

// Render debug UI
function renderDebugUI(): string {
  const activeRules = currentPuzzle?.realRules || []
  const ruleParams = currentPuzzle?.params || {}
  
  return `
    <div class="debug-panel">
      <h3>DEBUG UI (Press D to toggle)</h3>
      
      <div class="debug-section">
        <h4>State</h4>
        <div>Seed: ${state.seed}</div>
        <div>Level: ${state.level}</div>
        <div>Puzzle Index: ${state.puzzleIndex}</div>
        <div>Score: ${state.score}</div>
        <div>Screen: ${state.screen}</div>
      </div>

      <div class="debug-section">
        <h4>Streak</h4>
        <div>Correct: ${state.streak.correct}</div>
        <div>Stability: ${state.streak.stability}/10</div>
        <div>Perception: ${state.streak.perception}/10</div>
        <div>Best Correct: ${state.streak.bestCorrect}</div>
      </div>

      <div class="debug-section">
        <h4>Cognition</h4>
        <div>Hallucination Level: ${state.hallucinationLevel.toFixed(2)}</div>
        <div>Audio Enabled: ${state.audioEnabled}</div>
        <div>Audio Intensity: ${state.audioIntensity}</div>
      </div>

      ${currentPuzzle ? `
        <div class="debug-section">
          <h4>Current Puzzle Rules</h4>
          ${activeRules.map((rule: any) => `
            <div class="debug-rule">
              <strong>${rule.type}</strong>
              ${Object.entries(ruleParams).map(([key, val]) => `
                <span class="debug-param">${key}: ${JSON.stringify(val)}</span>
              `).join('')}
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div class="debug-section">
        <h4>Beliefs (${state.beliefs.length})</h4>
        ${state.beliefs.length > 0 ? state.beliefs.map((b: any) => `
          <div class="debug-belief">
            <span>${b.ruleType}</span>
            <span>confidence: ${b.confidence.toFixed(2)}</span>
          </div>
        `).join('') : '<div>No beliefs yet</div>'}
      </div>

      <div class="debug-section">
        <h4>URL State</h4>
        <code>${encodeState(state)}</code>
      </div>

      <div class="debug-section">
        <h4>Replay Frames</h4>
        <div>${replayFrames.length} frames recorded</div>
      </div>
    </div>
  `
}

// Render guide UI
function renderGuideUI(): string {
  return `
    <div class="guide-panel">
      <h3>GUIDE</h3>
      
      <div class="guide-section">
        <h4>How to Play</h4>
        <p>Decode the alien language by identifying the pattern rules. Each puzzle shows a sequence of symbols—determine what comes next.</p>
        <p>Select your answer from the 4 choices. Correct answers reinforce your beliefs about the rules.</p>
      </div>

      <div class="guide-section">
        <h4>Symbols</h4>
        <div class="symbol-legend">
          <div><span class="glyph TRI">▲</span> Triangle</div>
          <div><span class="glyph CIRC">●</span> Circle</div>
          <div><span class="glyph SQR">■</span> Square</div>
          <div><span class="glyph DIAM">◆</span> Diamond</div>
          <div><span class="glyph STAR">★</span> Star</div>
          <div><span class="glyph AR_L">←</span> Left Arrow</div>
          <div><span class="glyph AR_R">→</span> Right Arrow</div>
        </div>
      </div>

      <div class="guide-section">
        <h4>Pattern Rules</h4>
        <p>Rules transform sequences in various ways:</p>
        <ul>
          <li><strong>REPEAT_N</strong>: Symbols repeat N times</li>
          <li><strong>IGNORE_SYMBOL</strong>: A specific symbol is skipped</li>
          <li><strong>DIRECTION_FLIP</strong>: Sequence reverses direction</li>
          <li><strong>ALTERNATION</strong>: Alternates between two patterns</li>
          <li><strong>SHIFT</strong>: Each symbol shifts to the next in sequence</li>
          <li><strong>REVERSE</strong>: Entire sequence is reversed</li>
          <li><strong>DUPLICATE</strong>: Sequence is duplicated</li>
        </ul>
      </div>

      <div class="guide-section">
        <h4>Cognition</h4>
        <p><strong>Beliefs</strong>: Your hypotheses about which rules are active. High confidence = clearer understanding.</p>
        <p><strong>Hallucinations</strong>: When your stability is low, you may see distortions in the UI and audio.</p>
        <p><strong>Streak</strong>: Correct answers build streak. Higher streak = better score multiplier.</p>
      </div>

      <div class="guide-section">
        <h4>Scoring</h4>
        <p>Cognitive Coherence Index = (Solution + Stability + Efficiency + Hallucination Survival) × Streak Multiplier</p>
      </div>

      <div class="guide-section">
        <h4>Share Your Run</h4>
        <p>Your entire game state is encoded in the URL. Share it with others to let them experience your exact cognition run.</p>
      </div>

      <div class="guide-section">
        <h4>Keyboard Shortcuts</h4>
        <p><strong>D</strong> - Toggle debug panel</p>
      </div>
    </div>
  `
}

// Start app
init()
