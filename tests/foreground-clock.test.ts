import {it,expect} from 'vitest';
import {createForegroundClock} from '../apps/web/src/foreground-clock';

it('excludes native pause and hidden time while retaining active elapsed time',()=>{
 let now=0;let visible=true;
 const clock=createForegroundClock(()=>now,()=>visible);
 now=1000;expect(clock.elapsed()).toBe(1000);
 clock.pause();now=11_000;expect(clock.elapsed()).toBe(1000);
 clock.resume();now=11_500;expect(clock.elapsed()).toBe(1500);
 visible=false;clock.visibilityChanged();now=21_500;expect(clock.elapsed()).toBe(1500);
 visible=true;clock.visibilityChanged();now=22_000;expect(clock.elapsed()).toBe(2000);
 clock.pause();clock.resume();now=22_250;clock.resume();now=22_500;
 expect(clock.elapsed()).toBe(2500);
});
