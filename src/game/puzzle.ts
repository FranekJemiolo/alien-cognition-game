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

    // Validate sequence has no undefined symbols
    const validSequence = sequence.filter(s => s && SYMBOLS.includes(s))
    console.log('Original sequence:', sequence, 'Validated sequence:', validSequence)

    // Compute answer
    const answer = computeNext(validSequence, realRules, params)

    // Validate answer is a valid symbol
    const validAnswer = answer[0] && SYMBOLS.includes(answer[0]) ? answer[0] : validSequence[validSequence.length - 1]
    console.log('Computed answer:', answer[0], 'Validated answer:', validAnswer)

    // Generate choices (include correct answer + distractors)
    const choices = generateChoices(validAnswer, phaseRng)

    return {
      sequence: validSequence,
      answer: [validAnswer],
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
    if (random && !choices.includes(random)) {
      choices.push(random)
    }
  }

  // Filter out any undefined and ensure we have 4 choices
  const validChoices = choices.filter(c => c && SYMBOLS.includes(c))
  while (validChoices.length < 4) {
    const random = SYMBOLS[Math.floor(rng() * SYMBOLS.length)]
    if (random && !validChoices.includes(random)) {
      validChoices.push(random)
    }
  }

  // Shuffle
  return validChoices.sort(() => rng() - 0.5)
}

// Validate answer
export function validateAnswer(puzzle: Puzzle, playerAnswer: SymbolId[]): boolean {
  if (!playerAnswer || playerAnswer.length === 0) return false
  if (!puzzle.answer || puzzle.answer.length === 0) return false
  if (playerAnswer.length !== puzzle.answer.length) return false
  
  // Filter out undefined values
  const validPlayerAnswer = playerAnswer.filter(a => a && SYMBOLS.includes(a))
  const validPuzzleAnswer = puzzle.answer.filter(a => a && SYMBOLS.includes(a))
  
  if (validPlayerAnswer.length === 0 || validPuzzleAnswer.length === 0) return false
  
  return validPlayerAnswer.every((a, i) => a === validPuzzleAnswer[i])
}
