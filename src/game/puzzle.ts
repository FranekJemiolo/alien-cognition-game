import { SymbolId, Rule, RuleParams, SYMBOLS } from '../rules/registry.js'
import { indexedRng } from '../core/rng.js'
import { pickRules, generateRuleParams } from '../rules/registry.js'
import { applyRules as interpretRules, computeNext } from '../rules/interpreter.js'

export type Puzzle = {
  sequence: SymbolId[]
  answer: SymbolId[]
  choices: SymbolId[]
  realRules: Rule[]
  params: RuleParams
  level: number
}

// Generate a puzzle
export function generatePuzzle(seed: number, level: number, puzzleIndex: number): Puzzle {
  try {
    const phaseRng = indexedRng(seed, puzzleIndex)

    // Determine phase
    const phase = level < 3 ? 1 : level < 7 ? 2 : level < 12 ? 3 : 4

    // Pick rules
    const realRules = pickRules(phaseRng, phase, [])
    const params = generateRuleParams(realRules, phaseRng)

    // Generate base pattern
    const baseLength = 2 + Math.floor(phaseRng() * 2)
    const base: SymbolId[] = []
    for (let i = 0; i < baseLength; i++) {
      base.push(SYMBOLS[Math.floor(phaseRng() * SYMBOLS.length)])
    }

    // Apply rules to get sequence
    const sequence = interpretRules(base, realRules, params)

    // Compute answer
    const answer = computeNext(sequence, realRules, params)

    // Generate choices (include correct answer + distractors)
    const choices = generateChoices(answer[0], phaseRng)

    return {
      sequence,
      answer,
      choices,
      realRules,
      params,
      level
    }
  } catch (error) {
    console.error('Error generating puzzle:', error)
    // Return a simple fallback puzzle
    return {
      sequence: [SYMBOLS[0], SYMBOLS[1], SYMBOLS[2]],
      answer: [SYMBOLS[0]],
      choices: SYMBOLS.slice(0, 4),
      realRules: [],
      params: {},
      level
    }
  }
}

// Generate answer choices
function generateChoices(correct: SymbolId, rng: () => number): SymbolId[] {
  const choices = [correct]
  
  while (choices.length < 4) {
    const random = SYMBOLS[Math.floor(rng() * SYMBOLS.length)]
    if (!choices.includes(random)) {
      choices.push(random)
    }
  }

  // Shuffle
  return choices.sort(() => rng() - 0.5)
}

// Validate answer
export function validateAnswer(puzzle: Puzzle, playerAnswer: SymbolId[]): boolean {
  if (playerAnswer.length !== puzzle.answer.length) return false
  return playerAnswer.every((a, i) => a === puzzle.answer[i])
}
