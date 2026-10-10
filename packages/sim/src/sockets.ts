import {industrySockets,industrySocketsAt,socketBalance as b,socketDesignCost,socketPowerSteps,socketResearch,type SocketSpec} from '../../content/src/sockets';
import {fieldRange,hardwareCatalog} from '../../content/src/hardware';
import {calendarYearAt} from '../../content/src/era';
import {expense,logEvent} from './finance';
import {requireRole} from './business';
import type {GameState,GameCommand} from './types';
/** Sockets a new CPU or motherboard design may use: the industry sockets released so far and the company's finished ones. */
export function companySockets(s:Pick<GameState,'sockets'|'day'>):SocketSpec[]{
 return [...industrySocketsAt(calendarYearAt(s.day)),...s.sockets.filter(x=>x.remaining===0)];
}
/** Sockets still in development (they share the engineers' weekly work with products). */
export function developSockets(s:GameState){return s.sockets.filter(x=>x.remaining>0);}
/**
 * Socket ranges the company's CPU research allows: power delivery up to the CPU cooling limit, memory channels up to
 * the CPU memory-channel limit.
 */
export function socketLimits(completed:readonly string[]){
 const power=fieldRange('cpu','cooling',completed).max,channels=fieldRange('cpu','memoryChannels',completed).max;
 const channelSteps=(hardwareCatalog.cpu.fields.memoryChannels.values??[]).filter(v=>v<=channels);
 return {powers:socketPowerSteps.filter(v=>v>=b.minPower&&v<=power),channels:channelSteps};
}
export function socketCommand(s:GameState,c:GameCommand):boolean{
 if(c.type!=='designSocket')return false;
 requireRole(s,'engineering');
 if(!s.research.completed.includes(socketResearch))throw new Error('「CPU 独自ソケット設計」の研究が必要です');
 if(s.sockets.length>=b.maxSockets)throw new Error('ソケット数の上限です');
 const name=c.name.trim();
 // Future industry sockets are reserved too, so a company socket never shares a name with one.
 if([...industrySockets,...s.sockets].some(x=>x.name.toLowerCase()===name.toLowerCase()))throw new Error(`ソケット名「${name}」は使用済みです`);
 const limits=socketLimits(s.research.completed);
 if(!limits.powers.includes(c.power))throw new Error(`電力供給は現在の研究では${limits.powers[0]}～${limits.powers.at(-1)}Wの範囲で設計できます`);
 if(!limits.channels.includes(c.channels))throw new Error(`メモリチャネル数は現在の研究では${limits.channels[0]}～${limits.channels.at(-1)}chの範囲で設計できます`);
 expense(s,socketDesignCost(c));
 s.sockets.push({id:`s-${s.sockets.length+1}`,name,power:c.power,channels:c.channels,remaining:b.work,day:s.day});
 logEvent(s,'socketStarted',name);
 return true;
}
