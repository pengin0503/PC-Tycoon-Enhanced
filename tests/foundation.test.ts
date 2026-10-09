import { describe, it, expect } from 'vitest';
import * as api from '../packages/sim/src/index';

// Removing validation or monthly debits must break these consumer assertions.
const sim = api as any;
const options = { id: 'test', name: '北極テック', year: 2000, difficulty: 'normal', seed: 42 };
describe('foundation', () => {
  it('exposes an executable new game', () => { expect(sim.createGame).toBeTypeOf('function'); });
  it('charges monthly costs with immutable daily weekly monthly ordering', () => {
    const s = sim.createGame(options); const n = sim.command(s, { type: 'advance', days: 30 });
    expect(n.day).toBe(30); expect(n.company.cash).toBe(48800000); expect(s.day).toBe(0);
    expect(n.finance.expenses).toBe(1200000); expect(n.events.slice(-1)[0].kind).toBe('monthly');
    expect(n.events.filter((e: any) => e.kind === 'weekly')).toHaveLength(4);
  });
  it('replays seed and commands exactly across split ticks', () => {
    const s = sim.createGame(options);
    expect(sim.command(s, { type: 'advance', days: 60 })).toEqual(sim.command(sim.command(s, { type: 'advance', days: 30 }), { type: 'advance', days: 30 }));
    expect(sim.command(s, {type:'advance',days:60})).toEqual(sim.command(sim.createGame(options),{type:'advance',days:60}));
    expect(sim.createGame({...options,seed:43}).seed).not.toBe(s.seed);
  });
  it('rejects unaffordable purchases without modifying the input', () => {
    const s=sim.createGame(options);
    expect(()=>sim.command(s,{type:'spend',amount:50000001})).toThrow();
    expect(s.company.cash).toBe(50000000);
    expect(sim.command(s,{type:'spend',amount:100}).company.cash).toBe(49999900);
  });
  it.each([-1,0.5,NaN,Infinity,Number.MAX_SAFE_INTEGER])('rejects invalid advance %s',days=>{
    expect(()=>sim.command(sim.createGame(options),{type:'advance',days})).toThrow();
  });
  it.each([-1,0.5,NaN,Infinity,Number.MAX_SAFE_INTEGER])('rejects invalid expense %s',amount=>{
    expect(()=>sim.command(sim.createGame(options),{type:'spend',amount})).toThrow();
  });
  it('validates names years seeds and difficulty',()=>{
    for(const change of [{name:''},{name:'x'.repeat(81)},{year:0},{year:2026},{seed:-1},{seed:1.1},{difficulty:'invalid'}]) expect(()=>sim.createGame({...options,...change})).toThrow();
  });
  it('records insolvent fixed costs as explicit debt',()=>{
    const s=sim.command(sim.createGame(options),{type:'spend',amount:50000000});
    const n=sim.command(s,{type:'advance',days:30});
    expect(n.company.cash).toBe(0); expect(n.company.debt).toBe(1200000);
    expect(n.events.some((e:any)=>e.kind==='insolvency')).toBe(true);
  });
});
