import {osBalance as b} from '../../content/src/os';
import {findPart,deviceParts} from './devices';
import type {GameState,Product} from './types';

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
