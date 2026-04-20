import { Streak, Belief } from '../core/state.js'
import { getStreakMultiplier } from '../cognition/streaks.js'

export type ScoreBreakdown = {
  solutionScore: number
  stabilityBonus: number
  efficiencyBonus: number
  hallucinationBonus: number
  streakMultiplier: number
  total: number
}

// Calculate cognitive coherence index (score)
export function calculateScore(
  correct: boolean,
  beliefs: Belief[],
  stepsUsed: number,
  hallucinationIntensity: number,
  streak: Streak
): ScoreBreakdown {
  const breakdown: ScoreBreakdown = {
    solutionScore: correct ? 100 : 0,
    stabilityBonus: 0,
    efficiencyBonus: 0,
    hallucinationBonus: 0,
    streakMultiplier: getStreakMultiplier(streak),
    total: 0
  }

  if (correct) {
    // Stability bonus: average belief confidence
    const avgConfidence = beliefs.length > 0
      ? beliefs.reduce((a, b) => a + b.confidence, 0) / beliefs.length
      : 0
    breakdown.stabilityBonus = avgConfidence * 50

    // Efficiency bonus: fewer steps = higher score
    breakdown.efficiencyBonus = Math.max(0, 50 - stepsUsed * 5)

    // Hallucination survival bonus
    breakdown.hallucinationBonus = hallucinationIntensity * 80
  }

  // Apply streak multiplier
  const baseTotal = breakdown.solutionScore + breakdown.stabilityBonus + 
                    breakdown.efficiencyBonus + breakdown.hallucinationBonus
  breakdown.total = Math.floor(baseTotal * breakdown.streakMultiplier)

  return breakdown
}

// Get interpretation profile string
export function getInterpretationProfile(beliefs: any[], streak: Streak): string {
  const avgConf = beliefs.length > 0
    ? beliefs.reduce((a, b) => a + b.confidence, 0) / beliefs.length
    : 0

  if (avgConf > 0.8 && streak.stability > 7) return "stable interpreter"
  if (avgConf > 0.6 && streak.perception > 5) return "adaptive reasoner"
  if (streak.correct > 5) return "pattern recognizer"
  if (avgConf < 0.4) return "uncertain explorer"
  return "emerging analyst"
}
