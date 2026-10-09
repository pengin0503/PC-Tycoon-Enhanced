import {expect,it} from 'vitest';
import {createGame,command,type GameState} from '../packages/sim/src/index';
import {defaultSpec,hardwareTechYear,fieldRange} from '../packages/content/src/hardware';
import {evaluateHardware} from '../packages/sim/src/hardware';
import {marketYear} from '../packages/sim/src/market';
import {techById} from '../packages/content/src/research';
import {researchPointCost} from '../packages/sim/src/business';

/** Real company commands, no free cash/RP injection. Different from the trillion-yen smoke baseline. */
it('models 30 years of paid research, office expansion, engineering and retail revenue (#25)',()=>{
 let s=createGame({id:'commercial-30',name:'実販売検証',difficulty:'normal',seed:47});
 for(const role of ['research','engineering','marketing'] as const)s=command(s,{type:'hire',role,skill:55});
 s=command(s,{type:'research',id:'cpu-compute-1'});
 const original=defaultSpec('cpu');
 s=command(s,{type:'design',kind:'cpu',name:'First CPU',spec:original,price:40000});
 s=command(s,{type:'advance',days:35});
 s=command(s,{type:'launch',id:'p-1',presentation:'none'});
 s=command(s,{type:'line',id:'p-1',target:300});
 s=command(s,{type:'marketing',budget:15000});
 let spent=100,upgrades=0;
 const rows:{year:number,tech:number,cash:number,revenue:number,sold:number,rivalLevel:number,office:number,rp:number}[]=[];
 for(let y=1;y<=30;y++){
  if(y===6&&s.company.cash>officesUpgradeCost(s)){
   s=command(s,{type:'office',level:2});upgrades++;
   s=command(s,{type:'hire',role:'research',skill:55});
   s=command(s,{type:'hire',role:'research',skill:55});
  }
  for(let k=0;k<110;k++){
   const candidates=['compute','power','capacity','compatibility'].map(axis=>{
    const n=s.research.completed.filter(id=>id.startsWith(`cpu-${axis}-`)).length+1;
    return techById.get(`cpu-${axis}-${n}`);
   }).filter((t):t is NonNullable<typeof t>=>!!t&&t.prerequisites.every(p=>s.research.completed.includes(p)));
   candidates.sort((a,b)=>researchPointCost(s,a.id)-researchPointCost(s,b.id)||a.id.localeCompare(b.id));
   if(!candidates.length||researchPointCost(s,candidates[0].id)>s.company.researchPoints)break;
   const cost=researchPointCost(s,candidates[0].id);
   s=command(s,{type:'research',id:candidates[0].id});spent+=cost;
  }
  if((y===9||y===17||y===25)&&s.company.cash>450_000_000){
   const draft=defaultSpec('cpu');
   draft.cores=Math.min(4,fieldRange('cpu','cores',s.research.completed).max);
   draft.clock=Math.min(2,fieldRange('cpu','clock',s.research.completed).max);
   draft.ipc=Math.min(2,fieldRange('cpu','ipc',s.research.completed).max);
   draft.process=fieldRange('cpu','process',s.research.completed).min;
   draft.cooling=fieldRange('cpu','cooling',s.research.completed).max;
   const metrics=evaluateHardware('cpu',draft,s.research.completed);
   const price=Math.round(metrics.unitCost*1.8);
   s=command(s,{type:'design',kind:'cpu',name:`Refresh ${y}`,spec:draft,price});
   s=command(s,{type:'advance',days:35});
   const product=s.products.at(-1)!;
   if(product.remaining===0){
    s=command(s,{type:'launch',id:product.id,presentation:'none'});
    for(const old of s.products.filter(p=>p.kind==='cpu'&&p.id!==product.id&&p.line))s=command(s,{type:'line',id:old.id,target:0});
    s=command(s,{type:'line',id:product.id,target:300});
   }
  }
  s=command(s,{type:'advance',days:360-(y===9||y===17||y===25?35:0)});
  if([10,20,30].includes(y))rows.push({year:marketYear(s.day),tech:hardwareTechYear('cpu',s.research.completed),cash:s.company.cash,revenue:s.finance.revenue,sold:s.products.reduce((n,p)=>n+p.sold,0),rivalLevel:Math.max(...s.rivals.map(r=>r.researchLevel)),office:s.officeLevel,rp:s.company.researchPoints});
  expect(s.gameOver, `game-over in year ${y}`).toBeFalsy();
 }
 expect(upgrades).toBe(1);
 expect(s.products.some(p=>p.sold>0)).toBe(true);
 expect(rows).toHaveLength(3);
 expect(rows.every(x=>x.cash>=0&&Number.isFinite(x.tech))).toBe(true);
 console.info('COMMERCIAL_30_YEAR_RESULTS '+JSON.stringify({rows,spent,productCount:s.products.length}));
},120000);

function officesUpgradeCost(s:GameState){return s.officeLevel===1?6000000:Infinity;}
