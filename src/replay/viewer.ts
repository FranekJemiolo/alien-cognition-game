import { ReplayPlayerState } from './player.js'

// Render replay viewer UI
export function renderReplayViewer(
  player: ReplayPlayerState,
  _onScrub: (index: number) => void,
  _onPlay: () => void,
  _onPause: () => void
): string {
  const frame = player.replay.frames[player.index]
  
  return `
    <div class="panel replay-panel">
      <h2>COGNITION REPLAY</h2>
      
      <div class="replay-info">
        <div>Step: ${frame.step}</div>
        <div>Event: ${frame.audioEvent.type}</div>
      </div>

      <div class="sequence replay-sequence">
        ${frame.sequence.map(s => `<span class="glyph ${s}"></span>`).join(' ')}
      </div>

      <div class="beliefs-display">
        <h3>Beliefs</h3>
        ${frame.beliefs.map(b => `
          <div class="belief-item">
            <span class="belief-rule">${b.ruleType}</span>
            <span class="belief-confidence">${b.confidence.toFixed(2)}</span>
          </div>
        `).join('')}
      </div>

      <div class="replay-controls">
        <input 
          id="replay-scrub" 
          type="range" 
          min="0" 
          max="${player.replay.frames.length - 1}" 
          value="${player.index}"
          class="scrubber"
        />
        
        <div class="control-buttons">
          <button id="replay-play" class="btn-primary">
            ${player.isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <button id="replay-close" class="btn-secondary">Close</button>
        </div>
      </div>
    </div>
  `
}

// Bind replay viewer controls
export function bindReplayControls(
  player: ReplayPlayerState,
  onScrub: (index: number) => void,
  onPlay: () => void,
  onPause: () => void,
  onClose: () => void
) {
  const scrub = document.getElementById('replay-scrub') as HTMLInputElement
  const playBtn = document.getElementById('replay-play') as HTMLButtonElement
  const closeBtn = document.getElementById('replay-close') as HTMLButtonElement

  if (scrub) {
    scrub.oninput = (e) => {
      const index = parseInt((e.target as HTMLInputElement).value)
      onScrub(index)
    }
  }

  if (playBtn) {
    playBtn.onclick = () => {
      if (player.isPlaying) {
        onPause()
      } else {
        onPlay()
      }
    }
  }

  if (closeBtn) {
    closeBtn.onclick = onClose
  }
}
