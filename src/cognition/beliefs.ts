import { Belief } from '../core/state.js'
import { Rule } from '../rules/registry.js'

// Belief types
export type BeliefType = 
  | "BELIEVE_REPEAT"
  | "BELIEVE_IGNORE_SQR"
  | "BELIEVE_DIRECTION"
  | "BELIEVE_ALL_MATTER"
  | "BELIEVE_ALT_PATTERN"

// Update beliefs based on puzzle result
export function updateBeliefs(
  prevBeliefs: Belief[],
  correct: boolean,
  activeRules: Rule[],
  rng: () => number
): Belief[] {
  const beliefs = [...prevBeliefs]
  
  if (correct) {
    // Reinforce true rules
    activeRules.forEach(rule => {
      const beliefType = `BELIEVE_${rule}` as BeliefType
      const existing = beliefs.find(b => b.ruleType === beliefType)
      
      if (existing) {
        existing.confidence = Math.min(1, existing.confidence + 0.15)
      } else {
        beliefs.push({ ruleType: beliefType, confidence: 0.5 })
      }
    })
  } else {
    // Introduce doubt / alternative beliefs
    if (rng() < 0.3) {
      const altBelief = beliefs.find(b => b.ruleType === "BELIEVE_ALT_PATTERN")
      if (altBelief) {
        altBelief.confidence = Math.min(1, altBelief.confidence + 0.1)
      } else {
        beliefs.push({ ruleType: "BELIEVE_ALT_PATTERN", confidence: 0.3 })
      }
    }
    
    // Slightly reduce confidence in all beliefs
    beliefs.forEach(b => {
      b.confidence = Math.max(0.1, b.confidence - 0.05)
    })
  }
  
  return beliefs
}

// Get average belief confidence
export function getAvgBeliefConfidence(beliefs: Belief[]): number {
  if (beliefs.length === 0) return 0
  return beliefs.reduce((sum, b) => sum + b.confidence, 0) / beliefs.length
}
