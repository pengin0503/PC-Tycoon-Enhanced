import {gameSchema} from './schema';
import {hardwareKinds,type HardwareKind} from '../../content/src/research';
import {techById} from '../../content/src/tech-catalog';
import {aiGPUs} from '../../content/src/ai';
import {offices} from '../../content/src/management';
import {evaluateHardware} from './hardware';
import {evaluateDevice,deviceParts} from './devices';
import {estimateInference} from './ai-math';
import type {GameState} from './types';
export function validateGame(value:unknown):GameState{
 const input=typeof value==='object'&&value!==null&&!Array.isArray(value)&&Array.isArray((value as Record<string,unknown>).clusters)
  ?{...(value as Record<string,unknown>),clusters:((value as Record<string,unknown>).clusters as unknown[]).map(cluster=>typeof cluster==='object'&&cluster!==null&&!Array.isArray(cluster)&&!('purchaseDay'in cluster)?{...cluster,purchaseDay:(value as Record<string,unknown>).day}:cluster)}
  :value;
 const s=gameSchema.parse(input);const fail=(message:string):never=>{throw new Error(`セーブの整合性エラー: ${message}`);};
 const failIf=(condition:boolean,message:string)=>{if(condition)fail(message);};
 const highestStaffId=s.staff.reduce((max,employee)=>{
  const match=/^e-(\d+)$/.exec(employee.id);
  return Math.max(max,Number(match?.[1]??0));
 },0);
 s.staffSeq=Math.max(s.staffSeq,highestStaffId);
 const unique=(ids:string[],label:string)=>{if(new Set(ids).size!==ids.length)fail(`${label}のIDが重複しています`);};
 unique(s.products.map(p=>p.id),'製品');unique(s.staff.map(e=>e.id),'スタッフ');unique(s.clusters.map(c=>c.id),'クラスタ');unique(s.models.map(m=>m.id),'モデル');unique(s.rivals.map(r=>r.id),'競合');unique(s.research.completed,'研究');unique(s.research.active.map(r=>r.id),'進行中研究');
 for(const id of s.research.completed){const t=techById.get(id);if(!t||t.prerequisites.some(p=>!s.research.completed.includes(p)))fail('完了研究の前提条件が不正です');}
 for(const r of s.research.active){const t=techById.get(r.id);if(!t||s.research.completed.includes(r.id)||t.prerequisites.some(id=>!s.research.completed.includes(id)))fail('進行中研究が不正です');}
 const office=offices[s.officeLevel-1];if(s.staff.length>office.staffCapacity||s.research.active.length>office.researchSlots)fail('施設の枠を超えています');
 for(const e of s.events)if(e.day>s.day)fail('未来のイベントが保存されています');
 for(let i=0;i<s.marketSales.length;i++){const record=s.marketSales[i];if(record.day>s.day||(i>0&&record.day<s.marketSales[i-1].day))fail('販売履歴の日付が不正です');}
 if(s.notificationReadId>s.notificationSeq)fail('通知既読位置が不正です');
 let prevNotice=0;
 for(const notice of s.notifications){
  if(notice.id<=prevNotice||notice.id>s.notificationSeq||notice.day>s.day)fail('通知履歴の順序が不正です');
  prevNotice=notice.id;
 }
 if(s.pendingAttack&&!s.products.some(p=>p.id===s.pendingAttack!.osId&&p.kind==='os'))fail('攻撃対象のOSが見つかりません');
 for(const o of s.offers)if(!s.products.some(p=>p.id===o.productId&&p.discontinuedDay===undefined))fail('取引対象の製品が見つかりません');
 unique(s.offers.map(o=>String(o.id)),'取引');unique(s.candidates.map(k=>k.id),'候補者');
 for(const p of s.products)if(p.inventoryValue!==undefined&&p.inventory===0&&p.inventoryValue!==0)fail('空在庫に原価が残っています');
 let previous=0;for(const h of s.history){if(h.day>s.day||h.day<=previous)fail('決算履歴の日付が不正です');previous=h.day;}
 for(const p of s.products){if(p.launched&&p.remaining>0)fail('開発中の製品が発売されています');if(p.discontinuedDay!==undefined&&(!p.launched||p.line||p.discontinuedDay>s.day||p.discontinuedDay<p.releaseDay))fail('販売終了の状態が不正です');if(!p.launched&&(p.inventory>0||p.line))fail('発売前製品の生産状態が不正です');if(p.releaseDay>s.day)fail('発売日が未来です');
  if((hardwareKinds as readonly string[]).includes(p.kind))evaluateHardware(p.kind as HardwareKind,p.spec,s.research.completed,{stored:true});
  if(p.kind==='pc'||p.kind==='laptop'){const parts=deviceParts(p.spec);if(!['gaming','office','server'].includes(String(p.spec.purpose)))fail('端末用途が不正です');evaluateDevice(s,parts,p.spec.purpose as 'gaming'|'office'|'server',p.kind,p.spec.osId?String(p.spec.osId):undefined,true,typeof p.spec.cooling==='number'?p.spec.cooling:undefined);}
 }
 for(const c of s.clusters){failIf(c.purchaseDay>s.day,'クラスタ購入日が未来です');if(!aiGPUs.some(g=>g.id===c.gpuId)&&!s.products.some(p=>p.id===c.gpuId&&p.kind==='gpu'))fail('クラスタのGPU参照が不正です');if(c.serverId!=='vendor'&&!s.products.some(p=>p.id===c.serverId&&p.kind==='pc'&&p.spec.purpose==='server'))fail('クラスタのサーバー参照が不正です');}
 const occupied=new Set<string>();const reserve=(id:string)=>{if(occupied.has(id))fail('クラスタが重複割当されています');occupied.add(id);};
 for(const m of s.models){if(!s.clusters.some(c=>c.id===m.clusterId))fail('学習クラスタが見つかりません');if(m.status==='training')reserve(m.clusterId);else if(m.remainingSeconds!==0||m.preparationRemaining!==0)fail('モデルの完了状態が不正です');
  if(m.service){const v=m.service,c=s.clusters.find(c=>c.id===v.clusterId);if(!c)fail('推論クラスタが見つかりません');const e=estimateInference(m.design,c!,v.bits,v.context,v.batch);if(v.memoryBytes!==e.memoryBytes)fail('推論メモリの保存値が不正です');if(v.enabled){if(m.status!=='ready')fail('未評価モデルのサービスが有効です');if(v.mode!=='open'){if(e.memoryBytes>c!.vramBytes)fail('推論VRAMが不足しています');reserve(v.clusterId);}}}
 }
 return s;
}

