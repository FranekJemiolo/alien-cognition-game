import { Puzzle } from '../../game/puzzle.js'
import { SymbolId } from '../../rules/registry.js'

export function renderPuzzleScreen(
  puzzle: Puzzle,
  selectedAnswer: SymbolId | null,
  showFeedback: boolean,
  isCorrect: boolean
): string {
  return `
    <div class="screen puzzle-screen">
      <div class="puzzle-content">
        <div class="puzzle-header">
          <div class="level-indicator">Level ${puzzle.level}</div>
        </div>
        
        <div class="sequence-display">
          ${puzzle.sequence.map((sym) => `
            <span class="glyph ${sym}">${sym}</span>
          `).join('')}
          <span class="glyph placeholder">?</span>
        </div>

        <div class="choices-grid">
          ${puzzle.choices.map(choice => `
            <button 
              class="choice-btn ${selectedAnswer === choice ? 'selected' : ''}"
              data-choice="${choice}"
            >
              <span class="glyph ${choice}">${choice}</span>
            </button>
          `).join('')}
        </div>

        ${showFeedback ? `
          <div class="feedback ${isCorrect ? 'correct' : 'incorrect'}">
            ${isCorrect ? 'Pattern recognized' : 'The pattern is unclear...'}
          </div>
        ` : ''}

        <div class="puzzle-actions">
          <button id="puzzle-submit" class="btn-primary" ${!selectedAnswer ? 'disabled' : ''}>
            SUBMIT
          </button>
        </div>
      </div>
    </div>
  `
}

export function bindPuzzleScreen(
  onSelect: (choice: SymbolId) => void,
  onSubmit: () => void
) {
  document.querySelectorAll('.choice-btn').forEach(btn => {
    (btn as HTMLButtonElement).onclick = () => {
      const choice = btn.getAttribute('data-choice') as SymbolId
      onSelect(choice)
    }
  })

  const submitBtn = document.getElementById('puzzle-submit') as HTMLButtonElement
  if (submitBtn) {
    submitBtn.onclick = onSubmit
  }
}
