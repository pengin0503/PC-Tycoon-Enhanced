import {aiGPUs,aiBalance as b} from '../../content/src/ai';
import {expense,logEvent} from './finance';
import type {GameState,GameCommand} from './types';
export function aiCommand(s:GameState,c:GameCommand):boolean{
 if(c.type==='buyCluster'){
  if(!s.research.completed.includes('ai-compute-1'))throw new Error('AI基盤研究が必要です');if(s.clusters.length>=20)throw new Error('クラスタ数の上限です');
  const vendor=aiGPUs.find(g=>g.id===c.gpuId);const own=s.products.find(p=>p.id===c.gpuId&&p.kind==='gpu'&&p.launched);
  if(!vendor&&!own)throw new Error('GPUが存在しません');if(own&&own.inventory<c.gpus)throw new Error('GPU在庫が不足しています');
  const server=c.serverId==='vendor'?undefined:s.products.find(p=>p.id===c.serverId&&p.kind==='pc'&&p.spec.purpose==='server'&&p.launched);
  if(c.serverId!=='vendor'&&(!server||server.inventory<1))throw new Error('自社サーバー在庫が必要です');
  const cost=(vendor?vendor.cost*c.gpus:0)+(server?0:b.serverCost);expense(s,cost,false,true);
  if(own)own.inventory-=c.gpus;if(server)server.inventory--;
  s.clusters.push({id:`c-${s.clusters.length+1}`,gpuId:c.gpuId,serverId:c.serverId,gpus:c.gpus,peakFlops:(vendor?.peakFlops??own!.performance*1e11)*c.gpus,vramBytes:(vendor?.vramBytes??Number(own!.spec.vram)*1e9)*c.gpus,powerWatts:(vendor?.powerWatts??own!.power)*c.gpus+(server?.power??0),network:c.network*Math.min(1,server?server.performance/1000:1),cooling:c.cooling,purchaseCost:cost});
  logEvent(s,'clusterPurchased',String(c.gpus));return true;
 }
 return false;
}
