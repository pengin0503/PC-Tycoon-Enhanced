import {it,expect} from 'vitest';
import {withTestStaff} from './staff-fixture';
import {createGame,command,type GameState} from '../packages/sim/src/index';
import {exportSave,importSave} from '../packages/save/src/index';
import {evaluateHardware} from '../packages/sim/src/hardware';
import {companySockets,socketLimits} from '../packages/sim/src/sockets';
import {industrySockets,mainstreamSocket,socketDesignCost,socketBoardCost,socketResearch,socketBalance} from '../packages/content/src/sockets';
import {researchAtShare} from '../packages/content/src/tech-catalog';
import {eraBalance,shareAtYear} from '../packages/content/src/era';
import {defaultSpec} from '../packages/content/src/hardware';
import {researchPointCost} from '../packages/sim/src/business';
import {unlockBranch} from './research-helpers';
import {typicalSpec} from '../packages/sim/src/market';
import {findVendorPart} from '../packages/sim/src/vendor-market';

const cmd=(s:GameState,c:any)=>command(s,c);
function lab(){
 const s=withTestStaff(createGame({id:'sock',name:'ソケット社',difficulty:'normal',seed:5}));
 s.research.completed.push('cpu-compute-1','motherboard-compute-1');s.company.researchPoints=1_000_000;s.company.cash=10_000_000_000;
 return s;
}
/** A CPU that draws more than Atlas (120 W) delivers. */
const hot={...defaultSpec('cpu'),cores:4,clock:3,ipc:2,process:65,cooling:300,socket:'Atlas'};
function hotResearch(s:GameState){unlockBranch(s,'cpu','cores',8);unlockBranch(s,'cpu','clock',20);unlockBranch(s,'cpu','ipc',10);unlockBranch(s,'cpu','process',10);unlockBranch(s,'cpu','cooling',30);return s;}

it('socket development is a CPU research that unlocks designing sockets within the CPU research limits',()=>{
 let s=lab();
 expect(()=>cmd(s,{type:'designSocket',name:'Helios',power:120,channels:2})).toThrow(/独自ソケット設計/);
 expect(researchPointCost(s,socketResearch)).toBeGreaterThan(researchPointCost(s,'cpu-cores-1'));
 s=cmd(s,{type:'research',id:socketResearch});
 // A year-2000 company may only design sockets up to its CPU cooler (60 W) and memory channels (1).
 expect(socketLimits(s.research.completed)).toEqual({powers:[50,60],channels:[1]});
 expect(()=>cmd(s,{type:'designSocket',name:'Helios',power:180,channels:1})).toThrow(/電力供給は現在の研究では50～60W/);
 hotResearch(s);unlockBranch(s,'cpu','memoryChannels',20);
 const {powers,channels}=socketLimits(s.research.completed);
 expect(powers.at(-1)).toBeGreaterThanOrEqual(300);expect(channels.at(-1)).toBeGreaterThanOrEqual(4);
 expect(()=>cmd(s,{type:'designSocket',name:'atlas',power:300,channels:4})).toThrow(/使用済み/);
 // Names of industry sockets that are not released yet are reserved as well.
 expect(()=>cmd(s,{type:'designSocket',name:'Sirius',power:300,channels:4})).toThrow(/使用済み/);
 const cash=s.company.cash;
 s=cmd(s,{type:'designSocket',name:'Helios',power:300,channels:4});
 expect(cash-s.company.cash).toBe(socketDesignCost({power:300,channels:4}));
 expect(socketDesignCost({power:120,channels:2})).toBe(socketBalance.designCost);
 expect(s.sockets).toEqual([{id:'s-1',name:'Helios',power:300,channels:4,remaining:socketBalance.work,day:s.day}]);
 // Unfinished sockets cannot be used yet; engineers finish them like a product.
 expect(companySockets(s).map(x=>x.name)).toEqual(['Atlas','Nova']);
 s=cmd(s,{type:'advance',days:21});
 expect(s.sockets[0].remaining).toBe(0);expect(s.events.some(e=>e.kind==='socketComplete'&&e.detail==='Helios')).toBe(true);
 expect(s.notifications.some(n=>n.kind==='socketComplete')).toBe(true);
 expect(companySockets(s).map(x=>x.name)).toContain('Helios');
});

it('a CPU must fit its socket power and memory channels; boards pay for stronger sockets',()=>{
 let s=hotResearch(lab());unlockBranch(s,'cpu','memoryChannels',20);
 expect(()=>cmd(s,{type:'design',kind:'cpu',name:'Hot',spec:hot,price:200000})).toThrow(/ソケット「Atlas」の電力供給を超えています/);
 expect(()=>cmd(s,{type:'design',kind:'cpu',name:'Wide',spec:{...defaultSpec('cpu'),memoryChannels:3,socket:'Atlas'},price:60000})).toThrow(/メモリチャネル数を超えています/);
 expect(()=>cmd(s,{type:'design',kind:'cpu',name:'Ghost',spec:{...hot,socket:'Helios'},price:200000})).toThrow(/ソケット「Helios」は使用できません/);
 s.research.completed.push(socketResearch);
 s=cmd(s,{type:'designSocket',name:'Helios',power:300,channels:4});s=cmd(s,{type:'advance',days:21});
 const metrics=evaluateHardware('cpu',{...hot,socket:'Helios'},s.research.completed,{sockets:companySockets(s)});
 s=cmd(s,{type:'design',kind:'cpu',name:'Hot',spec:{...hot,socket:'Helios'},price:Math.round(metrics.unitCost*2)});
 expect(s.products.at(-1)!.spec.socket).toBe('Helios');
 // A Helios motherboard costs more than the same Atlas board; mass-produced industry sockets add nothing.
 const board=defaultSpec('motherboard');
 const atlas=evaluateHardware('motherboard',board,s.research.completed).unitCost;
 const helios=evaluateHardware('motherboard',{...board,socket:'Helios'},s.research.completed,{sockets:companySockets(s)}).unitCost;
 expect(helios-atlas).toBe(socketBoardCost({power:300,channels:4}));
 expect(evaluateHardware('motherboard',{...board,socket:'Nova'},s.research.completed).unitCost).toBe(atlas);
});

it('PCs need a CPU and motherboard of the same company socket, and saves keep sockets',()=>{
 let s=hotResearch(lab());unlockBranch(s,'cpu','memoryChannels',10);unlockBranch(s,'pc','cooling',20);s.research.completed.push(socketResearch);
 s=cmd(s,{type:'designSocket',name:'Helios',power:300,channels:2});s=cmd(s,{type:'advance',days:21});
 const metrics=evaluateHardware('cpu',{...hot,socket:'Helios'},s.research.completed,{sockets:companySockets(s)});
 s=cmd(s,{type:'design',kind:'cpu',name:'Hot',spec:{...hot,socket:'Helios'},price:Math.round(metrics.unitCost*2)});
 const board=evaluateHardware('motherboard',{...defaultSpec('motherboard'),socket:'Helios'},s.research.completed,{sockets:companySockets(s)});
 s=cmd(s,{type:'design',kind:'motherboard',name:'Board',spec:{...defaultSpec('motherboard'),socket:'Helios'},price:board.unitCost*2});
 s=cmd(s,{type:'advance',days:28});
 const [cpu,mb]=s.products.slice(-2);
 for(const p of [cpu,mb])s=cmd(s,{type:'launch',id:p.id});
 const parts=(motherboard:string)=>({cpu:cpu.id,gpu:'v-gpu',motherboard,ram:'v-ram',storage:'v-storage'});
 const assemble=(motherboard:string)=>cmd(s,{type:'assemble',kind:'pc',name:'Helios PC',parts:parts(motherboard),purpose:'office',appearance:'silver',price:400000,cooling:500});
 expect(()=>assemble('v-board')).toThrow(/ソケットまたはメモリ世代が非互換です/);
 s=assemble(mb.id);
 expect(s.products.at(-1)!.kind).toBe('pc');
 const loaded=importSave(exportSave(s));
 expect(loaded.sockets).toEqual(s.sockets);expect(loaded.products.find(p=>p.id===cpu.id)!.spec.socket).toBe('Helios');
 // Stored products keep loading even if their socket is unknown (e.g. hand-edited or from an acquired brand).
 const json=JSON.parse(exportSave(s));json.sockets=[];
 expect(importSave(JSON.stringify(json)).products.find((p:{id:string})=>p.id===cpu.id)!.spec.socket).toBe('Helios');
 json.sockets=[s.sockets[0],{...s.sockets[0],id:'s-2'}];
 expect(()=>importSave(JSON.stringify(json))).toThrow(/ソケット名のIDが重複/);
});

it('industry sockets follow the calendar; rivals and suppliers build on the mainstream one, which fits their CPUs',()=>{
 expect(industrySockets.map(x=>x.name)).toEqual(['Atlas','Nova','Orion','Lyra','Polaris','Sirius']);
 for(let i=1;i<industrySockets.length;i++){
  const [a,b]=[industrySockets[i-1],industrySockets[i]];
  expect(b.power).toBeGreaterThan(a.power);expect(b.channels).toBeGreaterThan(a.channels);expect(b.mainstream).toBeGreaterThan(a.mainstream);
 }
 const day=(year:number)=>(year-eraBalance.startYear)*eraBalance.daysPerYear;
 expect(companySockets({sockets:[],day:day(2044)}).map(x=>x.name)).toEqual(['Atlas','Nova']);
 expect(companySockets({sockets:[],day:day(2045)}).map(x=>x.name)).toContain('Orion');
 expect(mainstreamSocket(2048).name).toBe('Nova');expect(mainstreamSocket(2049).name).toBe('Orion');
 expect(companySockets({sockets:[],day:day(2200)})).toHaveLength(industrySockets.length);
 // Every year's mainstream CPU fits its mainstream socket (checked like a new design, not a stored one).
 for(let year=eraBalance.startYear;year<=eraBalance.endYear;year++){
  const share=shareAtYear(year),spec=typicalSpec('cpu',share),socket=mainstreamSocket(year);
  expect(spec.socket,`${year}`).toBe(socket.name);
  const cpu=evaluateHardware('cpu',spec,researchAtShare('cpu',share),{stored:true});
  expect(cpu.power,`${year} power`).toBeLessThanOrEqual(socket.power);
  expect(Number(spec.memoryChannels),`${year} channels`).toBeLessThanOrEqual(socket.channels);
  expect(typicalSpec('motherboard',share).socket).toBe(socket.name);
 }
 // Generic parts of one release year pair with each other.
 for(const year of [2005,2050,2100,2150,2200])expect(findVendorPart(`v-${year}-cpu`)!.spec.socket).toBe(findVendorPart(`v-${year}-motherboard`)!.spec.socket);
 expect(findVendorPart('v-2005-motherboard')!.spec.socket).toBe('Atlas');expect(findVendorPart('v-2150-motherboard')!.spec.socket).toBe('Polaris');
});
