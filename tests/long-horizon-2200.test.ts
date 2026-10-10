import {expect,it} from 'vitest';
import {createGame,command} from '../packages/sim/src/index';
import {defaultSpec,hardwareTechYear,fieldRange,hardwareCatalog} from '../packages/content/src/hardware';
import {evaluateHardware} from '../packages/sim/src/hardware';
import {marketYear} from '../packages/sim/src/market';
import {techById,researchBranches} from '../packages/content/src/tech-catalog';
import {researchPointCost} from '../packages/sim/src/business';
import {offices} from '../packages/content/src/management';
import {companySockets} from '../packages/sim/src/sockets';

/**
 * Two-century commercial runs to year 2200 (#25), recorded in docs/dev/LONG_HORIZON_RESEARCH_RESULTS.md. They take
 * about three minutes, so they only run on request: `PCT_LONG_HORIZON=1 npx vitest run tests/long-horizon-2200.test.ts`.
 * Policies use real commands only (no cash or RP grants): buy the cheapest CPU research stage while RP lasts, refresh
 * the CPU every four years with the best design that fits its cooler and the strongest available socket, and either
 * keep a five-person company (`expand=false`) or add an office level every four years and two researchers a year while
 * ten years of the added running cost stay in the bank.
 */
type Row={year:number,tech:number,cash:number,debt:number,sold:number,rival:number,rp:number,office:number,staff:number};

function run(seed:number,years:number,expand:boolean,every=4){
 let s=createGame({id:'h',name:'長期',difficulty:'normal',seed});
 for(const role of ['research','engineering','marketing'] as const)s=command(s,{type:'hire',role,skill:55});
 s=command(s,{type:'research',id:'cpu-compute-1'});
 s=command(s,{type:'design',kind:'cpu',name:'First',spec:defaultSpec('cpu'),price:40000});
 s=command(s,{type:'advance',days:35});s=command(s,{type:'launch',id:'p-1',presentation:'none'});s=command(s,{type:'line',id:'p-1',target:300});s=command(s,{type:'marketing',budget:15000});
 const rows:Row[]=[];let spent=0,fails=0;
 for(let y=1;y<=years;y++){
  if(y===6&&s.company.cash>6000000){s=command(s,{type:'office',level:2});s=command(s,{type:'hire',role:'research',skill:55});s=command(s,{type:'hire',role:'research',skill:55});}
  if(expand&&y>6){
   // Grow gradually: one office level every four years and two researchers a year, each only with ten years of the
   // added running cost (and the refresh budget) in the bank.
   const salary=200000+55*5000,o=offices[s.officeLevel];
   if(y%4===0&&o&&s.company.cash>o.upgradeCost+(o.monthlyCost-offices[s.officeLevel-1].monthlyCost)*120+1e9)try{s=command(s,{type:'office',level:s.officeLevel+1});}catch{}
   for(let i=0;i<2;i++){if(s.company.cash<salary*120+1e9)break;try{s=command(s,{type:'hire',role:'research',skill:55});}catch{break;}}
  }
  for(let k=0;k<400;k++){
   const c=researchBranches('cpu').map(({axis})=>techById.get(`cpu-${axis}-${s.research.completed.filter(id=>id.startsWith(`cpu-${axis}-`)).length+1}`)).filter((t):t is NonNullable<typeof t>=>!!t&&t.prerequisites.every(p=>s.research.completed.includes(p)));
   c.sort((a,b)=>researchPointCost(s,a.id)-researchPointCost(s,b.id)||a.id.localeCompare(b.id));
   if(!c.length||researchPointCost(s,c[0].id)>s.company.researchPoints)break;
   spent+=researchPointCost(s,c[0].id);s=command(s,{type:'research',id:c[0].id});
  }
  let used=0;
  if(y%every===0&&s.company.cash>450_000_000){
   const r=(k:string)=>fieldRange('cpu',k,s.research.completed);
   const sockets=companySockets(s);const socket=sockets.reduce((a,b)=>b.power>a.power?b:a);
   const d:Record<string,any>={...defaultSpec('cpu'),socket:socket.name,cores:r("cores").max,clock:r('clock').max,ipc:r('ipc').max,process:r('process').min,
    memoryChannels:Math.min(socket.channels,r('memoryChannels').max),l2Cache:r('l2Cache').max};
   const cool=hardwareCatalog.cpu.fields.cooling.values!.filter(v=>v<=r('cooling').max&&v>=r('cooling').min);
   d.cooling=cool.at(-1);
   const memVals=hardwareCatalog.cpu.fields.memoryChannels.values!.filter(v=>v<=d.memoryChannels);d.memoryChannels=memVals.at(-1);
   let m=evaluateHardware('cpu',d,s.research.completed,{stored:true});
   for(let i=0;i<20;i++){
    m=evaluateHardware('cpu',d,s.research.completed,{stored:true});
    if(m.power<=Math.min(d.cooling,socket.power))break;d.cores=Math.max(1,d.cores/2);if(d.cores===1)d.clock=Math.max(r('clock').min,+(d.clock/1.5).toFixed(1));
   }
   d.cooling=cool.find(v=>v>=m.power)??d.cooling;
   try{m=evaluateHardware('cpu',d,s.research.completed,{sockets});
    s=command(s,{type:'design',kind:'cpu',name:`R${y}`,spec:d,price:Math.round(m.unitCost*1.8)});s=command(s,{type:'advance',days:35});used=35;
    const p=s.products.at(-1)!;if(p.remaining===0){s=command(s,{type:'launch',id:p.id,presentation:'none'});for(const o of s.products.filter(o=>o.kind==='cpu'&&o.id!==p.id&&o.discontinuedDay===undefined&&o.launched))s=command(s,{type:'discontinue',id:o.id});s=command(s,{type:'line',id:p.id,target:300});}
   }catch{fails++;}
  }
  s=command(s,{type:'advance',days:360-used});
  if(y%10===0||y===years)rows.push({year:marketYear(s.day),tech:+hardwareTechYear('cpu',s.research.completed).toFixed(1),cash:Math.round(s.company.cash/1e6),debt:Math.round(s.company.debt/1e6),sold:s.products.reduce((n,p)=>n+p.sold,0),rival:Math.max(...s.rivals.map(r=>r.researchLevel)),rp:s.company.researchPoints,office:s.officeLevel,staff:s.staff.length});
 }
 return {seed,spent,fails,rows};
}

const enabled=process.env.PCT_LONG_HORIZON==='1';
for(const expand of [false,true])it.runIf(enabled)(`200-year commercial run to 2200, ${expand?'growing':'five-person'} company (#25)`,()=>{
 for(const seed of [3,11,47]){
  const {rows,spent,fails}=run(seed,200,expand);
  console.info('LONG_HORIZON_2200 '+JSON.stringify({seed,expand,spent,fails,rows}));
  expect(fails).toBe(0);
  expect(rows.at(-1)!.year).toBe(2200);
  expect(rows.every(r=>Number.isFinite(r.cash)&&r.debt===0)).toBe(true);
  expect(rows.at(-1)!.rival).toBe(99);
  if(expand)expect(rows.find(r=>r.year===2100)!.tech).toBe(2200);
 }
},600_000);
