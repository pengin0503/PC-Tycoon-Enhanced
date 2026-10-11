import {createGame,validateGame,advanceInteractive} from '../packages/sim/src';
import {techCatalog} from '../packages/content/src/tech-catalog';
import {evaluateDevice} from '../packages/sim/src/devices';
import {withTestStaff} from '../tests/staff-fixture';
for(const research of [1,1000,techCatalog.length])for(const products of [100,500]){
 const s=withTestStaff(createGame({id:'benchmark',name:'Benchmark',seed:42,difficulty:'normal',mode:'sandbox'}),true);
 s.company.cash=1e12;s.company.awareness=100;s.company.reputation=100;s.company.fans=1e7;
 s.research.completed=research===1?['pc-compute-1']:research===1000?[...techCatalog.slice(0,999).map(t=>t.id),'pc-compute-1']:techCatalog.map(t=>t.id);
 const parts={cpu:'v-cpu',gpu:'v-gpu',motherboard:'v-board',ram:'v-ram',storage:'v-storage'},metrics=evaluateDevice(s,parts,'gaming','pc',undefined,false,150);
 s.products=Array.from({length:products},(_,i)=>({id:'p-'+(i+1),name:'PC'+i,kind:'pc',spec:{...parts,purpose:'gaming',cooling:150},...metrics,price:metrics.unitCost,remaining:0,inventory:10000,target:0,line:false,launched:true,sold:0,revenue:0,profit:0,releaseDay:0}));
 const state=validateGame(s);advanceInteractive(state,7);
 const start=performance.now();for(let i=0;i<5;i++)advanceInteractive(state,7);
 console.log(JSON.stringify({research:state.research.completed.length,products,sevenDaysMs:+((performance.now()-start)/5).toFixed(2)}));
}
