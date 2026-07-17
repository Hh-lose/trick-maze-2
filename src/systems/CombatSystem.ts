export function damage(attack: number, defense: number, multiplier = 1, crit = false): number {
  return Math.max(1, Math.round(attack * multiplier * (crit ? 1.75 : 1) * 100 / (100 + defense)));
}
