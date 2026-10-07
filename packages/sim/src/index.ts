import { balance } from '../../content/src/balance';
import { gameSchema, newGameSchema, gameCommandSchema } from './schema';
import {hardwareCommand,researchAndDevelopment,manufacture,sellProducts} from './hardware';
import {deviceCommand} from './devices';
import {managementCommand,marketingWeek,monthlyCosts,monthlyHistory} from './management';
import { expense, logEvent } from './finance';
import type { GameState, GameCommand, NewGameOptions } from './types';
export type { GameState, GameCommand, NewGameOptions } from './types';
export { nextRandom } from './random';
export { gameSchema } from './schema';
export function createGame(options: NewGameOptions): GameState {
  const o = newGameSchema.parse(options);
  return gameSchema.parse({version:1,id:o.id,seed:o.seed,initialSeed:o.seed,day:0,year:o.year,difficulty:o.difficulty,
    company:{name:o.name,cash:balance.initialCash[o.difficulty],debt:0,reputation:20,awareness:10},
    finance:{revenue:0,expenses:0,capital:0},events:[]});
}
export function command(state: GameState, input: GameCommand): GameState {
  const c=gameCommandSchema.parse(input); const s=gameSchema.parse(state);
  hardwareCommand(s,c);
  deviceCommand(s,c);
  managementCommand(s,c);
  if(c.type==='spend') {expense(s,c.amount); logEvent(s,'expense',String(c.amount));}
  if(c.type==='advance') for(let i=0;i<c.days;i++) {
    s.day++; manufacture(s);logEvent(s,'daily');
    if(s.day%7===0) {researchAndDevelopment(s);marketingWeek(s);sellProducts(s);logEvent(s,'weekly');}
    if(s.day%30===0) {expense(s,monthlyCosts(s),true);monthlyHistory(s);logEvent(s,'monthly');}
  }
  return gameSchema.parse(s);
}
