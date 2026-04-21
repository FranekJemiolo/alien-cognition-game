// Base36 encoding/decoding for compact URL state
export function base36(num: number): string {
  return num.toString(36)
}

export function parseBase36(str: string): number {
  const result = parseInt(str, 36)
  console.log(`parseBase36("${str}") = ${result}, isNaN: ${isNaN(result)}`)
  return result
}
