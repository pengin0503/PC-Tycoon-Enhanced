import {withTestStaff} from './staff-fixture';
import {it,expect} from 'vitest';
import {indexedDB} from 'fake-indexeddb';
import {createGame,command} from '../packages/sim/src/index';
import {exportSave,importSave} from '../packages/save/src/index';
import {SaveRepository} from '../packages/save/src/repository';
import {defaultSpec} from '../packages/content/src/hardware';
import {unlockBranch} from './research-helpers';
const start=()=>createGame({id:'valid',name:'保存社',difficulty:'normal',seed:1});const cmd=(s:any,c:any)=>command(s,c);
it('rejects unknown or duplicate research identifiers and overstaffing',()=>{
 const s=start();for(const research of [{completed:['unknown'],active:[]},{completed:['cpu-compute-1','cpu-compute-1'],active:[]}])expect(()=>importSave(JSON.stringify({...s,research}))).toThrow();
 const staff=Array.from({length:5},(_,i)=>({id:`e-${i}`,role:'research',skill:20,salary:600}));expect(()=>importSave(JSON.stringify({...s,staff}))).toThrow();
});
it('rejects future histories missing clusters and overbooked compute',()=>{
 const s=cmd(start(),{type:'advance',days:30});s.history[0].day=31;expect(()=>importSave(JSON.stringify(s))).toThrow();
 let a=withTestStaff(start(),true);a.day=12*360;a.year=2012;a.research.completed.push('ai-compute-1','gpu-compute-1');unlockBranch(unlockBranch(a,'gpu','units',8),'gpu','vram',8);
 a=cmd(a,{type:'design',kind:'gpu',name:'Own GPU',spec:{...defaultSpec('gpu'),vram:2},price:20000});
 a=cmd(a,{type:'advance',days:14});a=cmd(a,{type:'launch',id:'p-1'});a=cmd(a,{type:'line',id:'p-1',target:100});a=cmd(a,{type:'advance',days:1});
 a=cmd(a,{type:'buyCluster',gpuId:'p-1',serverId:'vendor',gpus:1,network:.8,cooling:.9});a=cmd(a,{type:'trainModel',name:'Model',design:{architecture:'dense',total:1e8,active:1e8,layers:12,hidden:768,attention:'standard',context:4096,tokens:1e9,quality:.8,diversity:.8},clusterId:'c-1',budget:40000000});
 expect(()=>importSave(JSON.stringify({...a,clusters:[]}))).toThrow();expect(()=>importSave(JSON.stringify({...a,models:[...a.models,{...a.models[0],id:'m-2'}]}))).toThrow();
});
it('migrates older v1 snapshots with explicit default behavior',()=>{
 const old:any=JSON.parse(exportSave(start()));for(const k of ['officeLevel','factoryLevel','staff','advertising','history','rivals','clusters','models','modifiers'])delete old[k];delete old.company.loan;
 const s=importSave(JSON.stringify(old));expect(s.officeLevel).toBe(1);expect(s.rivals).toEqual([]);expect(s.models).toEqual([]);expect(command(s,{type:'advance',days:30}).company.cash).toBe(999800000);
});
it('recovers the last intact slot with an explicit corruption warning',async()=>{
 const repo=new SaveRepository(indexedDB,'corruption-recovery');await repo.save(start());
 const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('corruption-recovery',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
 await new Promise<void>((resolve,reject)=>{const tx=db.transaction('saves','readwrite');tx.objectStore('saves').put({id:'corrupt',json:'{',order:9});tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});db.close();
 expect((await repo.latest())?.id).toBe('valid');expect((repo as any).warnings).toHaveLength(1);repo.close();
});
