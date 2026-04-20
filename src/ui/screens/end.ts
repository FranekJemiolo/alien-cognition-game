import { AppState } from '../../core/state.js'
import { getInterpretationProfile } from '../../game/scoring.js'

export function renderEndScreen(state: AppState): string {
  const profile = getInterpretationProfile(state.beliefs, state.streak)
  
  return `
    <div class="screen end-screen">
      <div class="end-content">
        <h1>COGNITION COMPLETE</h1>
        
        <div class="score-display">
          <div class="score-label">COGNITIVE COHERENCE INDEX</div>
          <div class="score-value">${state.score}</div>
        </div>

        <div class="streak-summary">
          <h3>STREAK SUMMARY</h3>
          <div class="streak-row">
            <span>Correct:</span>
            <span>${state.streak.correct}</span>
          </div>
          <div class="streak-row">
            <span>Stability:</span>
            <span>${state.streak.stability}/10</span>
          </div>
          <div class="streak-row">
            <span>Perception:</span>
            <span>${state.streak.perception}/10</span>
          </div>
        </div>

        <div class="profile-display">
          <h3>INTERPRETATION PROFILE</h3>
          <div class="profile-value">${profile}</div>
        </div>

        <div class="end-actions">
          <button id="end-share" class="btn-primary">
            EXPORT COGNITION RUN
          </button>
          <button id="end-restart" class="btn-secondary">
            NEW SEQUENCE
          </button>
        </div>
      </div>
    </div>
  `
}

export function bindEndScreen(onShare: () => void, onRestart: () => void) {
  const shareBtn = document.getElementById('end-share') as HTMLButtonElement
  const restartBtn = document.getElementById('end-restart') as HTMLButtonElement

  if (shareBtn) {
    shareBtn.onclick = onShare
  }
  if (restartBtn) {
    restartBtn.onclick = onRestart
  }
}
