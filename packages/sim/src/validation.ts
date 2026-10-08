import {gameSchema} from './schema';
import {techById,hardwareKinds,type HardwareKind} from '../../content/src/research';
import {offices} from '../../content/src/management';
import {evaluateHardware} from './hardware';
import {evaluateDevice} from './devices';
import {estimateInference} from './ai-math';
import type {GameState} from './types';
export function validateGame(value:unknown):GameState{
 const s=gameSchema.parse(value);const fail=(message:string):never=>{throw new Error(`セーブの整合性エラー: ${message}`);};
 const unique=(ids:string[],label:string)=>{if(new Set(ids).size!==ids.length)fail(`${label}のIDが重複しています`);};
 unique(s.products.map(p=>p.id),'製品');unique(s.staff.map(e=>e.id),'スタッフ');unique(s.clusters.map(c=>c.id),'クラスタ');unique(s.models.map(m=>m.id),'モデル');unique(s.rivals.map(r=>r.id),'競合');unique(s.research.completed,'研究');unique(s.research.active.map(r=>r.id),'進行中研究');
 for(const id of s.research.completed){const t=techById.get(id);if(!t||t.prerequisites.some(p=>!s.research.completed.includes(p)))fail('完了研究の前提条件が不正です');}
 for(const r of s.research.active){const t=techById.get(r.id);if(!t||s.research.completed.includes(r.id)||t.prerequisites.some(id=>!s.research.completed.includes(id)))fail('進行中研究が不正です');}
 const office=offices[s.officeLevel-1];if(s.staff.length>office.staffCapacity||s.research.active.length>office.researchSlots)fail('施設の枠を超えています');
 for(const e of s.events)if(e.day>s.day)fail('未来のイベントが保存されています');
 let previous=0;for(const h of s.history){if(h.day>s.day||h.day<=previous)fail('決算履歴の日付が不正です');previous=h.day;}
 for(const p of s.products){if(p.launched&&p.remaining>0)fail('開発中の製品が発売されています');if(!p.launched&&(p.inventory>0||p.line))fail('発売前製品の生産状態が不正です');if(p.releaseDay>s.day)fail('発売日が未来です');
  if((hardwareKinds as readonly string[]).includes(p.kind))evaluateHardware(p.kind as HardwareKind,p.spec,s.research.completed);
  if(p.kind==='pc'||p.kind==='laptop'){const parts=Object.fromEntries(['cpu','gpu','motherboard','ram','storage'].map(k=>[k,String(p.spec[k])]));if(!['gaming','office','server'].includes(String(p.spec.purpose)))fail('端末用途が不正です');evaluateDevice(s,parts,p.spec.purpose as 'gaming'|'office'|'server',p.kind,p.spec.osId?String(p.spec.osId):undefined,true);}
 }
 for(const c of s.clusters){if(!s.products.some(p=>p.id===c.gpuId&&p.kind==='gpu'))fail('クラスタのGPU参照が不正です');if(c.serverId!=='vendor'&&!s.products.some(p=>p.id===c.serverId&&p.kind==='pc'&&p.spec.purpose==='server'))fail('クラスタのサーバー参照が不正です');}
 const occupied=new Set<string>();const reserve=(id:string)=>{if(occupied.has(id))fail('クラスタが重複割当されています');occupied.add(id);};
 for(const m of s.models){if(!s.clusters.some(c=>c.id===m.clusterId))fail('学習クラスタが見つかりません');if(m.status==='training')reserve(m.clusterId);else if(m.remainingSeconds!==0||m.preparationRemaining!==0)fail('モデルの完了状態が不正です');
  if(m.service){const v=m.service,c=s.clusters.find(c=>c.id===v.clusterId);if(!c)fail('推論クラスタが見つかりません');const e=estimateInference(m.design,c!,v.bits,v.context,v.batch);if(v.memoryBytes!==e.memoryBytes)fail('推論メモリの保存値が不正です');if(v.enabled){if(m.status!=='ready')fail('未評価モデルのサービスが有効です');if(v.mode!=='open'){if(e.memoryBytes>c!.vramBytes)fail('推論VRAMが不足しています');reserve(v.clusterId);}}}
 }
 return s;
}
