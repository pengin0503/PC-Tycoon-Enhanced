import {osBalance as b} from '../../content/src/os';
import {findPart,deviceParts} from './devices';
import {derivedRandom} from './random';
import {logEvent} from './finance';
import type {GameState,GameCommand,Product} from './types';

export type OSRequirements={cpu:number,ram:number,storage:number};
export function osFeatureList(os:Pick<Product,'spec'>):string[]{return String(os.spec.features??'').split(',').filter(Boolean);}
/** Minimum fictional CPU score, RAM (GB) and storage (GB) an OS asks of the PC it ships with. */
export function osRequirements(os:Pick<Product,'spec'>):OSRequirements{
 const features=osFeatureList(os).length,version=Number(os.spec.version)||1;
 return {cpu:b.requirements.cpuBase+b.requirements.cpuPerFeature*features+b.requirements.cpuPerVersion*version,
  ram:b.requirements.ramBase+b.requirements.ramPerFeature*features,
  storage:b.requirements.storageBase+b.requirements.storagePerFeature*features+b.requirements.storagePerVersion*version};
}
export function meetsOSRequirements(s:GameState,spec:Record<string,string|number>,req:OSRequirements):boolean{
 const parts=deviceParts(spec);
 const cpu=findPart(s,parts.cpu,true),ram=findPart(s,parts.ram,true),storage=findPart(s,parts.storage,true);
 return !!cpu&&!!ram&&!!storage&&cpu.performance>=req.cpu&&Number(ram.spec.capacity)>=req.ram&&Number(storage.spec.capacity)>=req.storage;
}

// ---- security incidents ----
const attack=b.attack;
export function osIncidentFactor(s:GameState){return s.osIncident&&s.osIncident.expiresDay>s.day?s.osIncident.demand:1;}
/** Fraction of full damage after the defence result, security feature and support quality. */
export function attackDamage(os:Product|undefined,blocked:number,targets:number){
 const unblocked=1-Math.min(targets,Math.max(0,blocked))/targets;
 const security=os&&osFeatureList(os).includes('security')?1-attack.securityReduction:1;
 const support=1-attack.supportReduction*Number(os?.spec.support??0);
 return unblocked*security*support;
}
export function resolveAttack(s:GameState,blocked:number){
 const pending=s.pendingAttack;if(!pending)throw new Error('対処中の攻撃はありません');
 const os=s.products.find(p=>p.id===pending.osId);const damage=attackDamage(os,blocked,pending.targets);
 s.company.reputation=Math.max(0,s.company.reputation-attack.reputationLoss*damage);
 s.company.fans=Math.floor(s.company.fans*(1-attack.fanLoss*damage));
 if(damage>0)s.osIncident={demand:Math.max(.1,1-attack.demandPenalty*damage),expiresDay:s.day+attack.penaltyDays};
 s.pendingAttack=null;
 logEvent(s,'attackResolved',`${os?.name??'OS'}: ${Math.min(blocked,pending.targets)}/${pending.targets} 撃退（被害 ${Math.round(damage*100)}%）`);
}
export function attackMonthly(s:GameState){
 if(s.pendingAttack)return;
 const targets=s.products.filter(p=>p.kind==='os'&&p.launched);if(!targets.length)return;
 if(derivedRandom(s.initialSeed,s.day,9000)>=attack.monthlyChance)return;
 const os=targets[Math.floor(derivedRandom(s.initialSeed,s.day,9001)*targets.length)];
 s.pendingAttack={osId:os.id,day:s.day,deadlineDay:s.day+attack.deadlineDays,targets:attack.targets};
 logEvent(s,'hackerAttack',os.name);
}
export function attackDaily(s:GameState){
 if(s.pendingAttack&&s.day>s.pendingAttack.deadlineDay)resolveAttack(s,0);
 if(s.osIncident&&s.osIncident.expiresDay<=s.day)s.osIncident=null;
}
export function osCommand(s:GameState,c:GameCommand):boolean{
 if(c.type!=='defendAttack')return false;
 const pending=s.pendingAttack;if(!pending)throw new Error('対処中の攻撃はありません');
 if(c.blocked>pending.targets)throw new Error('撃退数が不正です');
 resolveAttack(s,c.blocked);return true;
}
