import {marketEvents,eventBalance} from '../../content/src/events';
import {nextRandom} from './random';
import {logEvent} from './finance';
import type {GameState} from './types';
export function marketDaily(s:GameState){if(s.modifiers.expiresDay>0&&s.modifiers.expiresDay<=s.day)s.modifiers={demand:1,production:1,expiresDay:0};}
export function marketMonthly(s:GameState){const [chance,seed]=nextRandom(s.seed);s.seed=seed;if(chance>=eventBalance.monthlyChance)return;const [choice,next]=nextRandom(s.seed);s.seed=next;const event=marketEvents[Math.floor(choice*marketEvents.length)];s.modifiers={demand:event.demand,production:event.production,expiresDay:s.day+eventBalance.durationDays};logEvent(s,'marketEvent',event.label);}
