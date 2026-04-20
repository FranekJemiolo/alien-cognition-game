// Base36 encoding/decoding for compact URL state
export function base36(num: number): string {
  return num.toString(36)
}

export function parseBase36(str: string): number {
  return parseInt(str, 36)
}
