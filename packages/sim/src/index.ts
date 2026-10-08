import { balance } from '../../content/src/balance';
import { gameSchema, newGameSchema, gameCommandSchema } from './schema';
import {hardwareCommand,researchAndDevelopment,manufacture,sellProducts} from './hardware';
import {deviceCommand} from './devices';
import {newRivals,rivalCommand,rivalDaily,rivalWeekly,rivalMonthly,marketShare} from './rivals';
import {managementCommand,marketingWeek,monthlyCosts,monthlyHistory} from './management';
import {aiCommand,aiDaily,aiWeekly,aiMonthly} from './ai';
import {marketDaily,marketMonthly,eventCommand} from './events';
import {validateGame} from './validation';
import {osCommand,attackDaily,attackMonthly} from './os';
import {progressCommand,checkAchievements,checkGameOver} from './progress';
import {businessCommand,businessWeekly,businessMonthly,expireOffers,generateCandidates} from './business';
import {researchPointBalance} from '../../content/src/management';
export {validateGame} from './validation';
import { expense, logEvent } from './finance';
import type { GameState, GameCommand, NewGameOptions } from './types';
export type { GameState, GameCommand, NewGameOptions } from './types';
export { nextRandom } from './random';
export { gameSchema } from './schema';
export function createGame(options: NewGameOptions): GameState {
  const o = newGameSchema.parse(options);
  const s=gameSchema.parse({version:1,id:o.id,seed:o.seed,initialSeed:o.seed,day:0,year:o.year,difficulty:o.difficulty,mode:o.mode??'standard',
    company:{name:o.name,cash:balance.initialCash[o.difficulty],debt:0,reputation:20,awareness:10,researchPoints:researchPointBalance.initial},
    finance:{revenue:0,expenses:0,capital:0},rivals:newRivals(o.seed,o.difficulty,o.mode??'standard'),events:[]});
  generateCandidates(s,'free');
  return s;
}
export function command(state: GameState, input: GameCommand): GameState {
  const c=gameCommandSchema.parse(input); const s=validateGame(state);
  if(s.gameOver&&c.type!=='markNotificationsRead')throw new Error('ゲームオーバーです。新しいゲームを始めてください');
  progressCommand(s,c);
  hardwareCommand(s,c);
  deviceCommand(s,c);
  managementCommand(s,c);
  businessCommand(s,c);
  osCommand(s,c);
  rivalCommand(s,c);
  aiCommand(s,c);
  eventCommand(s,c);
  if(c.type==='markNotificationsRead')s.notificationReadId=Math.max(s.notificationReadId,Math.min(s.notificationSeq,c.id));
  if(c.type==='spend') {expense(s,c.amount); logEvent(s,'expense',String(c.amount));}
  if(c.type==='advance') for(let i=0;i<c.days;i++) {
    s.day++; expireOffers(s); attackDaily(s); marketDaily(s);manufacture(s);rivalDaily(s);aiDaily(s);logEvent(s,'daily');
    if(s.day%7===0) {aiWeekly(s);researchAndDevelopment(s);marketingWeek(s);sellProducts(s);businessWeekly(s);rivalWeekly(s);logEvent(s,'weekly');}
    if(s.day%30===0) {aiMonthly(s);expense(s,monthlyCosts(s),true);rivalMonthly(s);marketMonthly(s);businessMonthly(s);attackMonthly(s);monthlyHistory(s,marketShare(s));logEvent(s,'monthly');checkGameOver(s);}
    if(s.gameOver)break;
  }
  checkAchievements(s);
  return validateGame(s);
}

/** UI progression halts at the first unresolved decision; batch simulation replay stays unchanged. */
export function advanceInteractive(state:GameState,days:number):GameState{
 if(!Number.isInteger(days)||days<0||days>31)throw new Error('時間操作の指定が不正です');
 let result=state;
 for(let i=0;i<days;i++){
  if(result.pendingDecision||result.pendingAttack||result.gameOver)break;
  result=command(result,{type:'advance',days:1});
 }
 return result;
}
