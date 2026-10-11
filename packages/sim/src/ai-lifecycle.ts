import {aiBalance as b} from '../../content/src/ai';
import {income,logEvent} from './finance';
import type {GameState,GameCommand} from './types';
export function settleSubscription(s:GameState,service:NonNullable<GameState['models'][number]['service']>){
 if(service.mode!=='subscription'||service.subscriptionUserDays===0)return;
 const amount=Math.round(service.subscriptionUserDays*service.subscriptionPrice/30*(1-b.fee-b.refund));
 if(amount){income(s,amount);service.revenue+=amount;}service.subscriptionUserDays=0;
}
export function clusterBookValue(s:GameState,c:GameState['clusters'][number]){return Math.round(c.purchaseCost*Math.max(0,1-(s.day-c.purchaseDay)*86400/b.lifetimeSeconds));}
/** Existing IDs may have gaps: neither removal nor trimmed history may reuse a sequence number. */
export function normalizeAILifecycle(s:GameState){
 const max=(seq:number,ids:string[],prefix:string)=>ids.reduce((n,id)=>{const match=new RegExp(`^${prefix}-(\\d+)$`).exec(id);const value=Number(match?.[1]??0);if(!Number.isSafeInteger(value))throw new Error('AI設備/モデルのIDが不正です');return Math.max(n,value);},seq);
 s.clusterSeq=max(s.clusterSeq,[...s.clusters,...s.aiHistory.clusters].map(x=>x.id),'c');
 s.modelSeq=max(s.modelSeq,[...s.models,...s.aiHistory.models].map(x=>x.id),'m');
 for(const m of s.models)if(m.status!=='training'&&!m.trainingCluster){const c=s.clusters.find(x=>x.id===m.clusterId);if(c)m.trainingCluster=structuredClone(c);}
}
export function aiLifecycleCommand(s:GameState,c:GameCommand){
 if(c.type==='archiveModel'){
  const m=s.models.find(x=>x.id===c.id);if(!m)throw new Error('モデルが存在しません');
  if(m.status==='training')throw new Error('学習中のモデルは履歴へ移せません');
  if(m.service?.enabled)throw new Error('サービスを停止してから履歴へ移してください');
  if(m.service)settleSubscription(s,m.service);
  const record={id:m.id,name:m.name,day:s.day,status:m.status,clusterId:m.clusterId,architecture:m.design.architecture,total:m.design.total,active:m.design.active,scores:{...m.scores},trainingCost:m.trainingCost,revenue:m.service?.revenue??0,cost:m.service?.cost??0,tokens:m.service?.tokens??0};
  const t=s.aiHistory.totals;t.models++;if(m.status==='failed')t.failed++;
  t.trainingCost+=record.trainingCost;t.revenue+=record.revenue;t.cost+=record.cost;
  s.aiHistory.models.push(record);s.aiHistory.models=s.aiHistory.models.slice(-200);
  s.models=s.models.filter(x=>x.id!==c.id);logEvent(s,'modelArchived',m.name);return true;
 }
 if(c.type==='disposeCluster'){
  const cluster=s.clusters.find(x=>x.id===c.id);if(!cluster)throw new Error('クラスタが存在しません');
  if(s.models.some(m=>m.status==='training'&&m.clusterId===c.id||m.service?.enabled&&m.service.mode!=='open'&&m.service.clusterId===c.id))throw new Error('使用中のクラスタは撤去できません');
  const writeoff=clusterBookValue(s,cluster);
  // Noncash loss: do NOT call expense(), which would charge the already-paid equipment twice.
  s.finance.expenses+=writeoff;
  s.aiHistory.clusters.push({id:cluster.id,gpuId:cluster.gpuId,serverId:cluster.serverId,gpus:cluster.gpus,purchaseDay:cluster.purchaseDay,purchaseCost:cluster.purchaseCost,day:s.day,writeoff});
  s.aiHistory.clusters=s.aiHistory.clusters.slice(-200);
  const t=s.aiHistory.totals;t.clusters++;t.purchaseCost+=cluster.purchaseCost;t.writeoffs+=writeoff;
  s.clusters=s.clusters.filter(x=>x.id!==c.id);logEvent(s,'clusterDisposed',`${c.id}: ${writeoff}円`);return true;
 }
 return false;
}
