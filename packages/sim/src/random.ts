// xorshift32 with a nonzero internal state; persisted state belongs to the simulation.
export function nextRandom(seed: number): [number, number] {
  let x = seed || 0x9e3779b9;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  const next = x >>> 0;
  return [next / 0x100000000, next];
}
/** Side-channel randomness for features added later: depends on the save's initial seed, day and a salt, never advances `seed`. */
export function derivedRandom(initialSeed:number,day:number,salt:number):number{
  let x=(initialSeed^Math.imul(day+1,0x85ebca6b)^Math.imul(salt+1,0xc2b2ae35))>>>0;
  for(let i=0;i<3;i++)x=nextRandom(x)[1];
  return x/0x100000000;
}
