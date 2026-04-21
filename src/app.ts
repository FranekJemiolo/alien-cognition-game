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
let audioEngine: AudioEngine | null = null
let currentPuzzle: any = null
let selectedAnswer: SymbolId | null = null
let showFeedback = false
let isCorrect = false
let replayFrames: any[] = []
let showDebug = false
let guideExpanded = false
let isUpdatingURL = false

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
  try {
    audioEngine = new AudioEngine()
    initAudioAutoResume(audioEngine)
  } catch (error) {
    console.error('Audio initialization failed:', error)
    state.audioEnabled = false
  }

  // Render initial screen
  render()

  // Setup URL sync
  window.addEventListener('hashchange', () => {
    if (isUpdatingURL) return
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
    if (e.key === 'h' || e.key === 'H') {
      guideExpanded = !guideExpanded
      console.log('Guide panel:', guideExpanded ? 'ON' : 'OFF')
      render()
    }
    if (e.key === 'm' || e.key === 'M') {
      state.audioEnabled = !state.audioEnabled
      console.log('Audio:', state.audioEnabled ? 'ON' : 'OFF')
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

  // Show guide panel only when expanded
  if (guideExpanded) {
    const guidePanel = document.createElement('div')
    guidePanel.className = 'guide-panel expanded'
    guidePanel.innerHTML = renderGuideUI()
    document.body.appendChild(guidePanel)

    // Bind guide close button
    guidePanel.querySelector('.guide-toggle')?.addEventListener('click', () => {
      guideExpanded = false
      render()
    })
  }

  // Add toggle buttons
  const toggleButtons = document.createElement('div')
  toggleButtons.className = 'toggle-buttons'
  toggleButtons.innerHTML = `
    <button id="toggle-debug" class="toggle-btn ${showDebug ? 'active' : ''}" title="Toggle Debug (D)">D</button>
    <button id="toggle-guide" class="toggle-btn ${guideExpanded ? 'active' : ''}" title="Toggle Guide (H)">H</button>
    <button id="toggle-audio" class="toggle-btn ${state.audioEnabled ? 'active' : ''}" title="Toggle Audio (M)">M</button>
  `
  document.body.appendChild(toggleButtons)

  // Bind toggle buttons
  document.getElementById('toggle-debug')?.addEventListener('click', () => {
    showDebug = !showDebug
    console.log('Debug panel:', showDebug ? 'ON' : 'OFF')
    render()
  })
  document.getElementById('toggle-guide')?.addEventListener('click', () => {
    guideExpanded = !guideExpanded
    console.log('Guide panel:', guideExpanded ? 'ON' : 'OFF')
    render()
  })
  document.getElementById('toggle-audio')?.addEventListener('click', () => {
    state.audioEnabled = !state.audioEnabled
    console.log('Audio:', state.audioEnabled ? 'ON' : 'OFF')
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
  console.log('Generating puzzle: level:', state.level, 'puzzleIndex:', state.puzzleIndex)
  currentPuzzle = generatePuzzle(state.seed, state.level, state.puzzleIndex)
  console.log('Puzzle generated:', currentPuzzle)
  selectedAnswer = null
  showFeedback = false
  isCorrect = false
  updateURL()
}

// Submit answer
function submitAnswer() {
  try {
    console.log('Submit answer called, selectedAnswer:', selectedAnswer)
    
    // Validate selectedAnswer before processing
    if (!selectedAnswer) {
      console.error('No answer selected')
      return
    }
    
    const correct = validateAnswer(currentPuzzle, [selectedAnswer])
    console.log('Answer correct:', correct)
    isCorrect = correct
    showFeedback = true

    // Update beliefs (use current puzzleIndex before increment)
    state.beliefs = updateBeliefs(
      state.beliefs,
      correct,
      currentPuzzle.realRules,
      seededRng(state.seed + state.puzzleIndex)
    )

    // Increment puzzleIndex after using it
    state.puzzleIndex++
    console.log('puzzleIndex incremented to:', state.puzzleIndex)

    // Update hallucination level
    state.hallucinationLevel = 1 - (state.streak.stability / 10)

    // Generate hallucinations (use puzzleIndex - 1 since we just incremented)
    state.hallucinations = generateHallucinations(
      state.seed,
      state.puzzleIndex - 1,
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
    if (state.audioEnabled && audioEngine) {
      try {
        if (correct) {
          playStepPulse(audioEngine, state.puzzleIndex, 1)
        } else {
          playHallucination(audioEngine, state.hallucinationLevel)
        }
        playBeliefState(audioEngine, state.beliefs)
        updateMix(audioEngine, state.beliefs, state.hallucinationLevel)
      } catch (error) {
        console.error('Audio error:', error)
        // Disable audio if it fails
        state.audioEnabled = false
      }
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
      try {
        console.log('Auto-advance timeout, correct:', correct, 'puzzleIndex:', state.puzzleIndex)
        if (correct) {
          // Check if level complete (5 puzzles per level)
          // puzzleIndex was already incremented, so check if it's >= 5
          if (state.puzzleIndex >= 5) {
            console.log('Level complete, advancing to level', state.level + 1)
            state.level++
            state.puzzleIndex = 0
            updateURL()
            if (state.level >= 5) {
              console.log('Game complete, transitioning to END')
              startTransition(state, 'END')
              animateTransition()
            } else {
              console.log('Generating new puzzle for next level')
              generateNewPuzzle()
              render()
            }
          } else {
            console.log('Generating next puzzle in current level')
            generateNewPuzzle()
            render()
          }
        } else {
          // Reset streak on wrong answer
          state.streak.correct = 0
          updateURL()
          console.log('Wrong answer, resetting streak and generating new puzzle')
          generateNewPuzzle()
          render()
        }
      } catch (error) {
        console.error('Error in auto-advance:', error)
        // Try to generate a new puzzle anyway
        generateNewPuzzle()
        render()
      }
    }, 1500)
  } catch (error) {
    console.error('Error in submitAnswer:', error)
    // Reset and try to continue
    generateNewPuzzle()
    render()
  }
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
  isUpdatingURL = true
  window.location.hash = encodeState(state)
  setTimeout(() => {
    isUpdatingURL = false
  }, 0)
  render()
}

// Update URL hash with current state
function updateURL() {
  isUpdatingURL = true
  window.location.hash = encodeState(state)
  setTimeout(() => {
    isUpdatingURL = false
  }, 0)
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
    <button class="guide-toggle">✕</button>
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
      <p><strong>H</strong> - Toggle this guide</p>
      <p><strong>M</strong> - Toggle audio mute</p>
    </div>
  `
}

// Start app
init()
