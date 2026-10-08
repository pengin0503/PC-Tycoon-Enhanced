import { balance } from '../../content/src/balance';
import { gameSchema, newGameSchema, gameCommandSchema } from './schema';
import {hardwareCommand,researchAndDevelopment,manufacture,sellProducts} from './hardware';
import {deviceCommand} from './devices';
import {newRivals,rivalCommand,rivalDaily,rivalWeekly,rivalMonthly,marketShare} from './rivals';
import {managementCommand,marketingWeek,monthlyCosts,monthlyHistory} from './management';
import {aiCommand,aiDaily,aiWeekly,aiMonthly} from './ai';
import {marketDaily,marketMonthly,eventCommand} from './events';
import {validateGame} from './validation';
export {validateGame} from './validation';
import { expense, logEvent } from './finance';
import type { GameState, GameCommand, NewGameOptions } from './types';
export type { GameState, GameCommand, NewGameOptions } from './types';
export { nextRandom } from './random';
export { gameSchema } from './schema';
export function createGame(options: NewGameOptions): GameState {
  const o = newGameSchema.parse(options);
  return gameSchema.parse({version:1,id:o.id,seed:o.seed,initialSeed:o.seed,day:0,year:o.year,difficulty:o.difficulty,
    company:{name:o.name,cash:balance.initialCash[o.difficulty],debt:0,reputation:20,awareness:10},
    finance:{revenue:0,expenses:0,capital:0},rivals:newRivals(o.seed,o.difficulty),events:[]});
}
export function command(state: GameState, input: GameCommand): GameState {
  const c=gameCommandSchema.parse(input); const s=validateGame(state);
  hardwareCommand(s,c);
  deviceCommand(s,c);
  managementCommand(s,c);
  rivalCommand(s,c);
  aiCommand(s,c);
  eventCommand(s,c);
  if(c.type==='spend') {expense(s,c.amount); logEvent(s,'expense',String(c.amount));}
  if(c.type==='advance') for(let i=0;i<c.days;i++) {
    s.day++; marketDaily(s);manufacture(s);rivalDaily(s);aiDaily(s);logEvent(s,'daily');
    if(s.day%7===0) {aiWeekly(s);researchAndDevelopment(s);marketingWeek(s);sellProducts(s);rivalWeekly(s);logEvent(s,'weekly');}
    if(s.day%30===0) {aiMonthly(s);expense(s,monthlyCosts(s),true);rivalMonthly(s);marketMonthly(s);monthlyHistory(s,marketShare(s));logEvent(s,'monthly');}
  }
  return validateGame(s);
}

/** UI progression halts at the first unresolved decision; batch simulation replay stays unchanged. */
export function advanceInteractive(state:GameState,days:number):GameState{
 if(!Number.isInteger(days)||days<0||days>31)throw new Error('時間操作の指定が不正です');
 let result=state;
 for(let i=0;i<days;i++){
  if(result.pendingDecision)break;
  result=command(result,{type:'advance',days:1});
 }
 return result;
}
