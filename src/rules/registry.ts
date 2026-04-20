// Symbol types
export type SymbolId = "TRI" | "CIRC" | "SQR" | "DIAM" | "STAR" | "AR_L" | "AR_R"

export const SYMBOLS: SymbolId[] = ["TRI", "CIRC", "SQR", "DIAM", "STAR", "AR_L", "AR_R"]

// Rule types
export type Rule = 
  | "REPEAT_N"
  | "IGNORE_SYMBOL"
  | "DIRECTION_FLIP"
  | "ALTERNATION"
  | "SHIFT"
  | "REVERSE"
  | "DUPLICATE"

export type RuleParams = {
  repeatN?: 2 | 3 | 4
  ignoreSymbol?: SymbolId
  directionMode?: "reverse-pair" | "invert-next"
  altPattern?: SymbolId[]
  shiftAmount?: number
}

// Rule definitions with phases
export const RULE_REGISTRY: Record<Rule, { phase: number; weight: number }> = {
  REPEAT_N: { phase: 1, weight: 10 },
  ALTERNATION: { phase: 1, weight: 8 },
  SHIFT: { phase: 2, weight: 7 },
  REVERSE: { phase: 2, weight: 6 },
  DUPLICATE: { phase: 2, weight: 5 },
  IGNORE_SYMBOL: { phase: 3, weight: 8 },
  DIRECTION_FLIP: { phase: 3, weight: 7 }
}

// Get rules available for a given phase
export function getRulesForPhase(phase: number): Rule[] {
  return Object.entries(RULE_REGISTRY)
    .filter(([_, def]) => def.phase <= phase)
    .map(([rule]) => rule as Rule)
}

// Weighted rule selection based on beliefs
export function pickRules(rng: () => number, phase: number, beliefs: any[]): Rule[] {
  const available = getRulesForPhase(phase)
  
  // Bias based on beliefs
  const weighted = available.map(rule => {
    let weight = RULE_REGISTRY[rule].weight
    beliefs.forEach(b => {
      if (b.ruleType === `BELIEVE_${rule}`) {
        weight *= 2 // Bias toward believed rules
      }
    })
    return { rule, weight }
  })
  
  // Pick 1-2 rules
  const count = rng() < 0.3 ? 2 : 1
  const selected: Rule[] = []
  
  for (let i = 0; i < count; i++) {
    const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0)
    let random = rng() * totalWeight
    
    for (const { rule, weight } of weighted) {
      random -= weight
      if (random <= 0) {
        selected.push(rule)
        break
      }
    }
  }
  
  return selected
}

// Generate rule parameters
export function generateRuleParams(rules: Rule[], rng: () => number): RuleParams {
  const params: RuleParams = {}
  
  rules.forEach(rule => {
    switch (rule) {
      case "REPEAT_N":
        params.repeatN = rng() < 0.5 ? 2 : (rng() < 0.5 ? 3 : 4)
        break
      case "IGNORE_SYMBOL":
        params.ignoreSymbol = SYMBOLS[Math.floor(rng() * SYMBOLS.length)]
        break
      case "DIRECTION_FLIP":
        params.directionMode = rng() < 0.5 ? "reverse-pair" : "invert-next"
        break
      case "SHIFT":
        params.shiftAmount = Math.floor(rng() * 3) + 1
        break
    }
  })
  
  return params
}
