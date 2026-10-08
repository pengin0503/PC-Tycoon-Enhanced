import {afterEach,it,expect} from 'vitest';
import {dispatchBack,registerBackHandler} from '../apps/web/src/app-gestures';

const cleanups:(()=>void)[]=[];
afterEach(()=>{for(const cleanup of cleanups.splice(0))cleanup();});

it('dispatches Back from the highest priority layer and falls through only when it declines',()=>{
 const calls:string[]=[];
 cleanups.push(registerBackHandler(()=>{calls.push('screen');return true;},10));
 cleanups.push(registerBackHandler(()=>{calls.push('overlay');return false;},90));
 cleanups.push(registerBackHandler(()=>{calls.push('modal');return true;},100));
 expect(dispatchBack()).toBe(true);
 expect(calls).toEqual(['modal']);
 cleanups.pop()!();
 calls.length=0;
 expect(dispatchBack()).toBe(true);
 expect(calls).toEqual(['overlay','screen']);
});
