import {vendorParts,deviceBalance as b} from '../../content/src/devices';
import type {GameState,GameCommand,Product} from './types';
import {expense,logEvent} from './finance';
export function evaluateDevice(s:GameState,parts:Record<string,string>,purpose:'gaming'|'office'|'server',kind:'pc'|'laptop',osId?:string){
 const ids=['cpu','gpu','motherboard','ram','storage'] as const;
 const resolved=ids.map(k=>{const p=s.products.find(p=>p.id===parts[k])??vendorParts.find(p=>p.id===parts[k]);if(!p||p.kind!==k||('remaining'in p&&p.remaining>0))throw new Error('利用可能な部品を選択してください');return p;});
 const [cpu,gpu,board,ram,storage]=resolved;
 if(cpu.spec.socket!==board.spec.socket||ram.spec.memoryGen!==board.spec.memoryGen)throw new Error('ソケットまたはメモリ世代が非互換です');
 const os=osId?s.products.find(p=>p.id===osId&&p.kind==='os'&&p.launched):undefined;if(osId&&!os)throw new Error('発売済みOSが必要です');
 const factors=[cpu.performance/1200,gpu.performance/1600,ram.performance/320,storage.performance/150];
 const score=factors.reduce((sum,x,i)=>sum+x*b.purposeWeights[purpose][i],0)*1000;
 const osFactor=os?(b.os.baseCompatibility+Number(os.spec.compatibility)*.5)*(.8+Number(os.spec.quality)*.2):b.os.withoutOS;
 return {performance:Math.round(score*osFactor*(kind==='laptop'?b.laptopCooling:1)),power:resolved.reduce((n,p)=>n+p.power,0),unitCost:resolved.reduce((n,p)=>n+p.unitCost,0)+b.caseCost+(kind==='laptop'?b.laptopPackaging:0)+(os?os.unitCost:0)};
}
export function appendProduct(s:GameState,data:Pick<Product,'name'|'kind'|'spec'|'price'|'performance'|'power'|'unitCost'>,work:number){
 if(s.products.length>=500)throw new Error('製品数の上限です');
 s.products.push({...data,id:`p-${s.products.length+1}`,remaining:work,inventory:0,target:0,line:false,launched:false,sold:0,revenue:0,profit:0,releaseDay:0});logEvent(s,'designStarted',data.name);
}
export function deviceCommand(s:GameState,c:GameCommand):boolean{
 if(c.type==='assemble'){
  if(!s.research.completed.includes(`${c.kind}-compute-1`))throw new Error('端末の基盤研究が必要です');
  const result=evaluateDevice(s,c.parts,c.purpose,c.kind,c.osId);expense(s,b.designCost);
  appendProduct(s,{name:c.name,kind:c.kind,price:c.price,spec:{...c.parts,purpose:c.purpose,appearance:c.appearance,...(c.osId?{osId:c.osId}:{})},...result},b.work);return true;
 }
 return false;
}
