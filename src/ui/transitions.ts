import { Screen, AppState } from '../core/state.js'

// Start transition
export function startTransition(state: AppState, to: Screen): void {
  state.transition = {
    active: true,
    from: state.screen,
    to,
    progress: 0
  }
}

// Update transition
export function updateTransition(state: AppState): void {
  if (!state.transition) return

  state.transition.progress += 0.05

  if (state.transition.progress >= 1) {
    state.screen = state.transition.to
    state.transition = null
  }
}

// Get transition style for screen
export function getTransitionStyle(screen: Screen, progress: number): string {
  switch (screen) {
    case 'BOOT':
      return `
        opacity: ${1 - progress};
        filter: blur(${progress * 6}px) contrast(${1 + progress});
        transform: scale(${1 - progress * 0.1});
      `
    case 'MAP':
      return `
        opacity: ${progress};
        transform: scale(${0.95 + progress * 0.05});
      `
    case 'PUZZLE':
      return `
        opacity: ${progress};
        transform: translateY(${(1 - progress) * 20}px);
      `
    case 'END':
      return `
        opacity: ${progress};
        transform: scale(${0.9 + progress * 0.1});
      `
    default:
      return ''
  }
}

// Render transition layer
export function renderTransition(state: AppState, currentRender: string): string {
  if (!state.transition) return currentRender

  const fromStyle = getTransitionStyle(state.transition.from, state.transition.progress)
  const toStyle = getTransitionStyle(state.transition.to, state.transition.progress)

  return `
    <div class="transition-container">
      <div class="transition-layer" style="${fromStyle}">
        ${renderScreenByType(state.transition.from, state)}
      </div>
      <div class="transition-layer" style="${toStyle}">
        ${renderScreenByType(state.transition.to, state)}
      </div>
    </div>
  `
}

// Helper to render screen by type (simplified)
function renderScreenByType(_screen: Screen, _state: AppState): string {
  // This would call the appropriate render function
  // For now, return placeholder
  return `<div class="screen-placeholder">transition</div>`
}
