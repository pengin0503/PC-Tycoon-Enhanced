import {it,expect,vi} from 'vitest';
import {createGame,command,advanceInteractive} from '../packages/sim/src';
import * as validation from '../packages/sim/src/validation';
it('validates interactive batches at entry/exit, preserving one-day results',()=>{
 const s=createGame({id:'perf',name:'Perf',seed:42,difficulty:'normal'});
 let expected=s;for(let i=0;i<7;i++)expected=command(expected,{type:'advance',days:1});
 const spy=vi.spyOn(validation,'validateGame');const n=advanceInteractive(s,7);const calls=spy.mock.calls.length;spy.mockRestore();
 expect(n).toEqual(expected);expect(calls).toBe(2);expect(s.day).toBe(0);
});
it('zero-day and paused advances still validate input without mutation',()=>{
 const s=createGame({id:'zero',name:'Zero',seed:42,difficulty:'normal'});
 expect(()=>advanceInteractive({...s,company:{...s.company,cash:-1}},0)).toThrow();
 const paused={...s,gameOver:{day:0,reason:'Test'}};expect(advanceInteractive(paused,7)).toEqual(paused);
 expect(advanceInteractive(s,0)).toEqual(s);
});
