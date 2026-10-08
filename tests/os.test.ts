import {it,expect} from 'vitest';
import {createGame,command} from '../packages/sim/src/index';
const cmd=(s:any,c:any)=>command(s,c);
function ready(){let s=createGame({id:'os',name:'OS社',year:2026,difficulty:'normal',seed:4});return cmd(cmd(s,{type:'research',id:'os-compute-1'}),{type:'advance',days:7});}
const os={type:'developOS',name:'Aurora',version:1,features:['files','calculator','browser'],quality:.8,compatibility:.8,support:.7,price:50};
it('develops and sells software with licensing and support expenses',()=>{
 let s=cmd(ready(),os);s=cmd(s,{type:'advance',days:14});s=cmd(s,{type:'launch',id:'p-1'});
 const n=cmd(s,{type:'advance',days:60});expect(n.products[0].sold).toBeGreaterThan(0);expect(n.products[0].inventory).toBe(0);expect(n.products[0].profit).toBeGreaterThan(0);expect(n.finance.expenses).toBeGreaterThan(24000);
});
it('rejects OS research versions duplicate features and invalid quality',()=>{
 const s=ready();const designed=cmd(s,os);
 for(const change of [{quality:2},{version:0},{features:['calculator','calculator']},{features:['host-shell']}])expect(()=>cmd(s,{...os,...change})).toThrow();
 expect(()=>cmd(designed,os)).toThrow();expect(cmd(designed,{...os,version:2}).products).toHaveLength(2);
});
it('bundled OS quality and compatibility affect computer scores',()=>{
 let s=cmd(ready(),os);s=cmd(s,{type:'advance',days:14});s=cmd(s,{type:'launch',id:'p-1'});s.research.completed.push('pc-compute-1');
 const build={type:'assemble',kind:'pc',name:'Station',parts:{cpu:'v-cpu',gpu:'v-gpu',motherboard:'v-board',ram:'v-ram',storage:'v-storage'},purpose:'office',appearance:'silver',price:3000};
 const plain=cmd(s,build).products[1];const bundled=cmd(s,{...build,osId:'p-1'}).products[1];expect(bundled.performance).toBeGreaterThan(plain.performance);
 expect(()=>cmd(s,{...build,osId:'missing'})).toThrow();
});
it('bundled PCs allocate license revenue without double counting company income',()=>{
 let s=cmd(ready(),os);s=cmd(s,{type:'advance',days:14});s=cmd(s,{type:'launch',id:'p-1'});s.research.completed.push('pc-compute-1');
 s=cmd(s,{type:'assemble',kind:'pc',name:'Bundle',parts:{cpu:'v-cpu',gpu:'v-gpu',motherboard:'v-board',ram:'v-ram',storage:'v-storage'},purpose:'office',appearance:'silver',price:3000,osId:'p-1'});s=cmd(s,{type:'advance',days:14});s=cmd(s,{type:'launch',id:'p-2'});s=cmd(s,{type:'line',id:'p-2',target:100});
 const before=s.products[0].sold;const n=cmd(s,{type:'advance',days:7});const pc=n.products[1];expect(pc.sold).toBeGreaterThan(0);expect(pc.revenue).toBe(pc.sold*2950);expect(n.products[0].sold-before).toBeGreaterThanOrEqual(pc.sold);expect(n.finance.revenue).toBe(n.products.reduce((v,p)=>v+p.revenue,0));
});
