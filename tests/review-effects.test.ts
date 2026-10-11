import {it,expect} from 'vitest';
import {command,validateGame} from '../packages/sim/src';
import {aiFixture,serviceConfig} from './review-fixture';
import {estimateInference} from '../packages/sim/src/ai-math';
import {aiEffects} from '../packages/sim/src/ai';
import {attackMonthly} from '../packages/sim/src/os';
import {hardwareExplanations} from '../apps/web/src/HardwareTerms';
it('refreshes live inference research without losing subscription accrual or scores',()=>{
 const s=command(aiFixture(),serviceConfig),before=s.models[0].service!.speed;
 s.models[0].service!.subscriptionUserDays=123;const scores={...s.models[0].scores};
 s.research.completed.push('ai-context-1','ai-quantization-2');
 const restored=validateGame(s),service=restored.models[0].service!;
 const expected=estimateInference(s.models[0].design,s.clusters[0],4,4096,1,aiEffects(s));
 expect(service.speed).toBe(expected.tokensPerSecond);expect(service.speed).not.toBe(before);
 expect(service.qualityPenalty).toBe(expected.qualityPenalty);expect(service.subscriptionUserDays).toBe(123);expect(restored.models[0].scores).toEqual(scores);
});
it('ended OS cannot trigger new attacks but an existing attack remains',()=>{
 const s=aiFixture();s.products=[{id:'os',name:'OS',kind:'os',price:5000,spec:{support:0},performance:100,power:0,unitCost:1,reliability:.9,remaining:0,inventory:0,target:0,line:false,launched:true,sold:0,revenue:0,profit:0,releaseDay:0,discontinuedDay:0}];
 s.day=720;attackMonthly(s);expect(s.pendingAttack).toBeNull();
 delete s.products[0].discontinuedDay;attackMonthly(s);expect(s.pendingAttack).not.toBeNull();
 const pending=structuredClone(s.pendingAttack);s.products[0].discontinuedDay=720;attackMonthly(s);expect(s.pendingAttack).toEqual(pending);
});
it('clock help describes the game linear model, not a square law',()=>{
 expect(hardwareExplanations.clock).toContain('比例');expect(hardwareExplanations.clock).not.toContain('2乗');
});
