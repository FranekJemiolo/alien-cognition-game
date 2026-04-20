import { AppState } from '../../core/state.js'

export function renderMapScreen(state: AppState): string {
  return `
    <div class="screen map-screen">
      <div class="map-content">
        <h2>COGNITION MAP</h2>
        <div class="level-display">
          <div class="level-label">Current Level</div>
          <div class="level-value">${state.level}</div>
        </div>
        <div class="streak-display">
          <div class="streak-item">
            <span class="streak-label">Stability</span>
            <span class="streak-value">${state.streak.stability}/10</span>
          </div>
          <div class="streak-item">
            <span class="streak-label">Perception</span>
            <span class="streak-value">${state.streak.perception}/10</span>
          </div>
        </div>
        <button id="map-start" class="btn-primary">
          ENTER PUZZLE
        </button>
      </div>
    </div>
  `
}

export function bindMapScreen(onStart: () => void) {
  const btn = document.getElementById('map-start') as HTMLButtonElement
  if (btn) {
    btn.onclick = onStart
  }
}
