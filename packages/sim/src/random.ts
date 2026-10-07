// xorshift32 with a nonzero internal state; persisted state belongs to the simulation.
export function nextRandom(seed: number): [number, number] {
  let x = seed || 0x9e3779b9;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  const next = x >>> 0;
  return [next / 0x100000000, next];
}
