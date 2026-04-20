import { Streak } from '../core/state.js'

// Update streak based on puzzle result
export function updateStreak(prevStreak: Streak, correct: boolean, perceptionDistortion: number): Streak {
  const streak = { ...prevStreak }
  
  if (correct) {
    streak.correct += 1
    streak.stability = Math.min(10, streak.stability + 1)
    streak.bestCorrect = Math.max(streak.bestCorrect, streak.correct)
  } else {
    streak.correct = 0
    streak.stability = Math.max(0, streak.stability - 2)
  }
  
  // Perception tracks how much hallucination distortion was survived
  const perceptionGain = correct ? (1 + perceptionDistortion * 0.5) : -1
  streak.perception = Math.min(10, Math.max(0, streak.perception + perceptionGain))
  
  return streak
}

// Get streak multiplier for scoring
export function getStreakMultiplier(streak: Streak): number {
  const baseMultiplier = 1 + streak.correct * 0.1
  return Math.min(2.5, baseMultiplier)
}
