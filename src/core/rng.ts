// Deterministic seeded RNG using Mulberry32
export function mulberry32(a: number): () => number {
  return function() {
    var t = a += 0x6D2B79F5
    t = Math.imul(t ^ t >>> 15, t | 1)
    t ^= t + Math.imul(t ^ t >>> 7, t | 61)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

// Create RNG from seed string
export function seededRng(seed: number): () => number {
  return mulberry32(seed)
}

// Create RNG from seed string + index
export function indexedRng(seed: number, index: number): () => number {
  return mulberry32(seed + index * 0x9E3779B9)
}
