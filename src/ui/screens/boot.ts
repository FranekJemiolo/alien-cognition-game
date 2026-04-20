import { AppState } from '../../core/state.js'

export function renderBootScreen(_state: AppState): string {
  return `
    <div class="screen boot-screen">
      <div class="boot-content">
        <h1 class="title">GLYPHS OF FORGETTING</h1>
        <p class="subtitle">Decode the alien language</p>
        <div class="boot-message">
          The signal is unstable. Your memory is encoded in the link.
        </div>
        <button id="boot-start" class="btn-primary btn-large">
          BEGIN DECODING
        </button>
      </div>
    </div>
  `
}

export function bindBootScreen(onStart: () => void) {
  const btn = document.getElementById('boot-start') as HTMLButtonElement
  if (btn) {
    btn.onclick = onStart
  }
}
