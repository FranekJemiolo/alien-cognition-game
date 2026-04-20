
// Get phase based on level
export function getPhaseForLevel(level: number): number {
  if (level < 3) return 1
  if (level < 7) return 2
  if (level < 12) return 3
  return 4
}

// Check if level complete
export function isLevelComplete(level: number, puzzlesSolved: number): boolean {
  const required = 3 + Math.floor(level / 2)
  return puzzlesSolved >= required
}
