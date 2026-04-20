import { SymbolId, Rule, RuleParams } from './registry.js'

// Apply rules to generate sequence
export function applyRules(
  base: SymbolId[],
  rules: Rule[],
  params: RuleParams
): SymbolId[] {
  let sequence = [...base]
  
  rules.forEach(rule => {
    sequence = applySingleRule(sequence, rule, params)
  })
  
  return sequence
}

// Apply a single rule
function applySingleRule(sequence: SymbolId[], rule: Rule, params: RuleParams): SymbolId[] {
  switch (rule) {
    case "REPEAT_N":
      return applyRepeat(sequence, params.repeatN || 2)
    case "IGNORE_SYMBOL":
      return applyIgnore(sequence, params.ignoreSymbol)
    case "DIRECTION_FLIP":
      return applyDirection(sequence, params.directionMode)
    case "ALTERNATION":
      return applyAlternation(sequence)
    case "SHIFT":
      return applyShift(sequence, params.shiftAmount || 1)
    case "REVERSE":
      return [...sequence].reverse()
    case "DUPLICATE":
      return [...sequence, ...sequence]
    default:
      return sequence
  }
}

// REPEAT_N: repeat pattern every N
function applyRepeat(sequence: SymbolId[], n: number): SymbolId[] {
  const result: SymbolId[] = []
  const pattern = sequence.slice(0, n)
  for (let i = 0; i < sequence.length; i++) {
    result.push(pattern[i % n])
  }
  return result
}

// IGNORE_SYMBOL: filter out specific symbol
function applyIgnore(sequence: SymbolId[], ignore?: SymbolId): SymbolId[] {
  if (!ignore) return sequence
  return sequence.filter(s => s !== ignore)
}

// DIRECTION_FLIP: reverse pairs or invert based on arrows
function applyDirection(sequence: SymbolId[], mode?: string): SymbolId[] {
  if (mode === "reverse-pair") {
    const result: SymbolId[] = []
    for (let i = 0; i < sequence.length; i += 2) {
      if (i + 1 < sequence.length) {
        result.push(sequence[i + 1], sequence[i])
      } else {
        result.push(sequence[i])
      }
    }
    return result
  }
  return sequence
}

// ALTERNATION: ABAB pattern
function applyAlternation(sequence: SymbolId[]): SymbolId[] {
  if (sequence.length < 2) return sequence
  const a = sequence[0]
  const b = sequence[1]
  const result: SymbolId[] = []
  for (let i = 0; i < sequence.length; i++) {
    result.push(i % 2 === 0 ? a : b)
  }
  return result
}

// SHIFT: cyclic shift
function applyShift(sequence: SymbolId[], amount: number): SymbolId[] {
  const n = sequence.length
  if (n === 0) return sequence
  const offset = amount % n
  return [...sequence.slice(offset), ...sequence.slice(0, offset)]
}

// Compute expected next symbol
export function computeNext(sequence: SymbolId[], rules: Rule[], params: RuleParams): SymbolId[] {
  // Simple prediction: apply rules to current sequence and get next position
  const extended = applyRules([...sequence, ...sequence.slice(0, 3)], rules, params)
  return [extended[sequence.length]]
}
