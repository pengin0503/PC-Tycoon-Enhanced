import {it,expect} from 'vitest';
import {withTestStaff} from './staff-fixture';
import {createGame,command,type GameState} from '../packages/sim/src/index';
import {exportSave,importSave} from '../packages/save/src/index';
import {evaluateHardware} from '../packages/sim/src/hardware';
import {researchPointCost} from '../packages/sim/src/business';
import {defaultSpec,fieldRange,hardwareCatalog} from '../packages/content/src/hardware';
import {techById,researchBranches} from '../packages/content/src/tech-catalog';
import {discontinueHint,monthlyKindSales} from '../apps/web/src/sales-stats';

function seller(seed=3){
 let s=withTestStaff(createGame({id:'st',name:'統計社',difficulty:'normal',seed}));
 s=command(s,{type:'research',id:'cpu-compute-1'});
 s=command(s,{type:'design',kind:'cpu',name:'First',spec:defaultSpec('cpu'),price:40000});
 s=command(s,{type:'advance',days:35});s=command(s,{type:'launch',id:'p-1'});s=command(s,{type:'line',id:'p-1',target:300});
 return s;
}

it('monthly history keeps sales per product kind, and the chart reads monthly differences from it (#43)',()=>{
 let s=seller();s=command(s,{type:'advance',days:90});
 const withKinds=s.history.filter(h=>h.kinds);
 expect(withKinds.length).toBeGreaterThanOrEqual(3);
 const last=withKinds.at(-1)!,cpu=s.products[0];
 expect(last.kinds!.cpu!.sold).toBeLessThanOrEqual(cpu.sold);expect(last.kinds!.cpu!.sold).toBeGreaterThan(0);
 const months=monthlyKindSales(s.history,'cpu');
 expect(months.length).toBe(withKinds.length-1);
 expect(months.reduce((n,m)=>n+m.sold,0)).toBe(last.kinds!.cpu!.sold-withKinds[0].kinds!.cpu!.sold);
 expect(monthlyKindSales(s.history,'all')).toEqual(months);
 expect(monthlyKindSales(s.history,'gpu').every(m=>m.sold===0&&m.revenue===0)).toBe(true);
 // Months saved before per-kind totals existed are skipped instead of read as zero sales.
 const old=s.history.map((h,i)=>i<2?{...h,kinds:undefined}:h);
 expect(withKinds).toHaveLength(s.history.length);
 expect(monthlyKindSales(old,'cpu')).toEqual(months.filter(m=>m.day>old[2].day));
 expect(importSave(exportSave(s)).history.at(-1)!.kinds).toEqual(last.kinds);
});

it('flags products sold below cost or without a sale for 90 days',()=>{
 let s=seller();s=command(s,{type:'advance',days:30});
 const p=s.products[0];
 expect(p.lastSaleDay).toBeGreaterThan(p.releaseDay);
 expect(discontinueHint(s.day,p)).toBe('');
 expect(discontinueHint(s.day,{...p,price:p.unitCost-1})).toBe('原価割れ');
 expect(discontinueHint(p.lastSaleDay!+90,p)).toBe('90日以上販売なし');
 expect(discontinueHint(p.lastSaleDay!+89,p)).toBe('');
 // Products without a recorded sale count from their release; retired or unreleased products are never flagged.
 expect(discontinueHint(p.releaseDay+90,{...p,lastSaleDay:undefined})).toBe('90日以上販売なし');
 expect(discontinueHint(s.day+999,{...p,discontinuedDay:s.day})).toBe('');
 expect(discontinueHint(s.day+999,{...p,launched:false})).toBe('');
});

/** Researches the cheapest CPU stages each year; with `refresh` a new CPU replaces the line-up every four years. */
function run(refresh:boolean,years:number){
 let s=seller(11);
 for(let y=1;y<=years;y++){
  for(let k=0;k<110;k++){
   const next=researchBranches('cpu').map(({axis})=>techById.get(`cpu-${axis}-${s.research.completed.filter(id=>id.startsWith(`cpu-${axis}-`)).length+1}`))
    .filter((t):t is NonNullable<typeof t>=>!!t&&t.prerequisites.every(p=>s.research.completed.includes(p)));
   next.sort((a,b)=>researchPointCost(s,a.id)-researchPointCost(s,b.id)||a.id.localeCompare(b.id));
   if(!next.length||researchPointCost(s,next[0].id)>s.company.researchPoints)break;
   s=command(s,{type:'research',id:next[0].id});
  }
  let used=0;
  if(refresh&&y%4===0){
   const r=(k:string)=>fieldRange('cpu',k,s.research.completed);
   const spec={...defaultSpec('cpu'),cores:Math.min(8,r('cores').max),clock:Math.min(3,r('clock').max),ipc:Math.min(3,r('ipc').max),process:r('process').min,
    cooling:Math.max(...hardwareCatalog.cpu.fields.cooling.values!.filter(v=>v<=Math.min(120,r('cooling').max)))};
   while(evaluateHardware('cpu',spec,s.research.completed,{stored:true}).power>Math.min(spec.cooling,120))spec.cores=spec.cores/2;
   const metrics=evaluateHardware('cpu',spec,s.research.completed);
   s=command(s,{type:'design',kind:'cpu',name:`R${y}`,spec,price:Math.round(metrics.unitCost*1.8)});s=command(s,{type:'advance',days:35});used=35;
   const p=s.products.at(-1)!;s=command(s,{type:'launch',id:p.id});
   for(const o of s.products.filter(o=>o.id!==p.id&&o.line))s=command(s,{type:'discontinue',id:o.id});
   s=command(s,{type:'line',id:p.id,target:300});
  }
  s=command(s,{type:'advance',days:360-used});
 }
 return s;
}

it('an old model keeps its design-time cost, and replacing it beats selling it for years (#44)',()=>{
 const keep=run(false,12),refresh=run(true,12);
 const first=(s:GameState)=>s.products[0];
 // Unit cost is fixed when a product is designed: research never makes an old model cheaper to build.
 expect(first(keep).unitCost).toBe(first(seller(11)).unitCost);
 expect(keep.gameOver).toBeFalsy();expect(refresh.gameOver).toBeFalsy();
 expect(refresh.products.length).toBeGreaterThan(1);
 const sold=(s:GameState)=>s.products.reduce((n,p)=>n+p.sold,0);
 expect(sold(refresh)).toBeGreaterThan(sold(keep)*3);
 expect(refresh.company.cash).toBeGreaterThan(keep.company.cash*2);
},60_000);
