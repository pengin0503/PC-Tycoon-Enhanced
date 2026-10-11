import {createGame,validateGame} from '../packages/sim/src';
import {withTestStaff} from './staff-fixture';
export const modelDesign={architecture:'dense' as const,total:100e6,active:100e6,layers:8,hidden:1024,attention:'standard' as const,context:4096,tokens:1e9,quality:.8,diversity:.8};
export function aiFixture(){
 const s=withTestStaff(createGame({id:'review-ai',name:'AI',seed:42,difficulty:'normal',mode:'sandbox'}),true);
 s.company.cash=1e12;s.research.completed=['ai-compute-1','ai-quantization-1'];
 s.clusters=[{id:'c-1',gpuId:'v-ai-small',serverId:'vendor',gpus:1,peakFlops:1e13,vramBytes:16e9,powerWatts:200,network:.8,cooling:.9,purchaseCost:1e6,purchaseDay:0}];
 s.models=[{id:'m-1',name:'Model',design:modelDesign,clusterId:'c-1',status:'ready',remainingSeconds:0,initialSeconds:100,preparationRemaining:0,trainingCost:100,scores:{math:60,coding:60,knowledge:60,reasoning:60,multilingual:60},service:null}];
 return validateGame(s);
}
export const serviceConfig={type:'deployModel' as const,id:'m-1',clusterId:'c-1',bits:4 as const,context:4096,batch:1,mode:'subscription' as const,apiPrice:1000,subscriptionPrice:3000};
