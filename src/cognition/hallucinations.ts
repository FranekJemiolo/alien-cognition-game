import { Hallucination } from '../core/state.js'
import { indexedRng } from '../core/rng.js'

// Generate hallucinations based on streak state
export function generateHallucinations(
  seed: number,
  step: number,
  streak: any,
  intensity: number
): Hallucination[] {
  const rng = indexedRng(seed, step)
  const hallucinations: Hallucination[] = []
  
  // Higher streak = more stable (fewer hallucinations)
  // Lower streak = more chaotic (more hallucinations)
  const chaosLevel = 1 - (streak.stability / 10)
  const numHallucinations = Math.floor(chaosLevel * intensity * 3)
  
  for (let i = 0; i < numHallucinations; i++) {
    hallucinations.push({
      type: pickHallucinationType(rng),
      strength: 0.3 + rng() * 0.5,
      target: pickTarget(rng)
    })
  }
  
  return hallucinations
}

// Pick hallucination type
function pickHallucinationType(rng: () => number): string {
  const types = ["blur", "shift", "fade", "invert", "glitch"]
  return types[Math.floor(rng() * types.length)]
}

// Pick target element
function pickTarget(rng: () => number): string {
  const targets = ["sequence", "choices", "ui", "all"]
  return targets[Math.floor(rng() * targets.length)]
}

// Clamp hallucinations for mobile
export function clampHallucinationsForMobile(hallucinations: Hallucination[]): Hallucination[] {
  if (typeof window === 'undefined' || window.innerWidth >= 768) {
    return hallucinations
  }
  
  return hallucinations.map(h => ({
    ...h,
    strength: Math.min(h.strength, 0.5)
  }))
}
