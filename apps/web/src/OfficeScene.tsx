import type {GameState} from '../../../packages/sim/src/index';
import {offices} from '../../../packages/content/src/management';
import {Logo} from './Logo';

const roleColors={research:'#8b5cf6',engineering:'#2f7cf6',marketing:'#ff5c8a',ai:'#16b07d'} as const;
/** Era palettes: garage → office → campus → future. */
function palette(level:number){
 if(level<=2)return {wallL:'#aab3bd',wallR:'#c3cbd3',floor:'#b9a58a',floorAlt:'#ad9a80',trim:'#7d8794'};
 if(level<=5)return {wallL:'#dfe6ee',wallR:'#eef3f8',floor:'#d8bf98',floorAlt:'#ceb48c',trim:'#9aa9ba'};
 if(level<=8)return {wallL:'#d4e1f0',wallR:'#e6eef8',floor:'#c9d3dd',floorAlt:'#bfcad5',trim:'#7f97b2'};
 return {wallL:'#c2d6ee',wallR:'#d9e7f7',floor:'#aebfd2',floorAlt:'#a4b6ca',trim:'#5d7fa8'};
}

/** Original isometric office that grows with the office level and seats every employee. */
export function OfficeScene({state}:{state:GameState}){
 const level=state.officeLevel,n=level+4,tw=560/n,th=tw/2,wallH=92;
 const iso=(gx:number,gy:number):[number,number]=>[320+(gx-gy)*tw/2,110+(gx+gy)*th/2];
 const pts=(...p:[number,number][])=>p.map(([x,y])=>`${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
 const up=([x,y]:[number,number],h:number):[number,number]=>[x,y-h];
 const c=palette(level);
 const capacity=offices[level-1].staffCapacity;
 const slots:[number,number][]=[];
 for(let gy=1;gy<n-1;gy++)for(let gx=1;gx<n-1;gx+=2)slots.push([gx,gy]);
 const desks=slots.slice(0,capacity).map((p,i)=>({p,staff:state.staff[i]})).sort((a,b)=>a.p[0]+a.p[1]-(b.p[0]+b.p[1]));
 const busy=state.products.some(p=>p.remaining>0)||state.models.some(m=>m.status==='training');
 const tiles=[];
 for(let gx=0;gx<n;gx++)for(let gy=0;gy<n;gy++)tiles.push(<polygon key={`t${gx}-${gy}`} points={pts(iso(gx,gy),iso(gx+1,gy),iso(gx+1,gy+1),iso(gx,gy+1))} fill={(gx+gy)%2?c.floor:c.floorAlt}/>);
 const along=(t:number,h:number):[number,number]=>{const a=iso(0,0),b=iso(n,0);return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t-h];};
 const alongL=(t:number,h:number):[number,number]=>{const a=iso(0,0),b=iso(0,n);return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t-h];};
 const windows=1+Math.floor(level/2);
 const desk=({p:[gx,gy],staff}:{p:[number,number],staff?:GameState['staff'][number]},i:number)=>{
  const [x,y]=iso(gx+.5,gy+.5),h=th*.55,w=tw*.42,d=th*.42;
  const top:[number,number][]=[[x,y-d-h],[x+w,y-h],[x,y+d-h],[x-w,y-h]];
  return <g key={'d'+i}>
   <polygon points={pts(top[3],top[2],[top[2][0],top[2][1]+h],[top[3][0],top[3][1]+h])} fill="#8a6a4a"/>
   <polygon points={pts(top[2],top[1],[top[1][0],top[1][1]+h],[top[2][0],top[2][1]+h])} fill="#73573c"/>
   <polygon points={pts(...top)} fill="#b48a5e"/>
   <rect x={x-tw*.16} y={y-h-th*.95} width={tw*.32} height={th*.6} rx="2" fill="#1d2a3a"/>
   <rect className={busy&&staff?'monitor-glow':''} x={x-tw*.13} y={y-h-th*.9} width={tw*.26} height={th*.48} rx="1.5" fill={staff?'#7fd3ff':'#4a5a6c'}/>
   {staff&&<g aria-hidden="true">
    <rect x={x+tw*.08} y={y-th*.2} width={tw*.22} height={th*.75} rx={tw*.1} fill={roleColors[staff.role]}/>
    <circle cx={x+tw*.19} cy={y-th*.38} r={tw*.1} fill="#f2c9a0"/>
    {staff.trait&&<circle cx={x+tw*.3} cy={y-th*.55} r={tw*.05} fill="#ffb020"/>}
   </g>}
  </g>;
 };
 return <svg role="img" aria-label={`オフィス Lv.${level}（${offices[level-1].label}）社員${state.staff.length}名`} viewBox="0 0 640 420" className="office-scene">
  <defs><linearGradient id="office-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#bfe0ff"/><stop offset="1" stopColor="#eef6ff"/></linearGradient></defs>
  <rect width="640" height="420" rx="18" fill="url(#office-sky)"/>
  <polygon points={pts(iso(0,n),iso(0,0),up(iso(0,0),wallH),up(iso(0,n),wallH))} fill={c.wallL}/>
  <polygon points={pts(iso(0,0),iso(n,0),up(iso(n,0),wallH),up(iso(0,0),wallH))} fill={c.wallR}/>
  <polyline points={pts(up(iso(0,n),wallH),up(iso(0,0),wallH),up(iso(n,0),wallH))} fill="none" stroke={c.trim} strokeWidth="4"/>
  {Array.from({length:windows},(_,i)=>{const t0=(i+.25)/windows,t1=(i+.8)/windows;return <polygon key={'w'+i} points={pts(along(t0,wallH*.82),along(t1,wallH*.82),along(t1,wallH*.3),along(t0,wallH*.3))} fill={level>=6?'#9fd4ff':'#cfe8ff'} stroke={c.trim} strokeWidth="2"/>;})}
  {level>=9&&<polyline points={pts(along(0,wallH*.12),along(1,wallH*.12))} stroke="#5cf1d0" strokeWidth="3" fill="none"/>}
  <g transform={`translate(${alongL(.3,wallH*.85)[0]} ${alongL(.3,wallH*.85)[1]}) matrix(1 -.5 0 1 0 0)`}><rect width="56" height="56" rx="8" fill="#fff" opacity=".85"/><g transform="translate(4 4)"><Logo id={state.company.logo} size={48}/></g></g>
  {level>=3&&<polygon points={pts(alongL(.4,wallH*.78),alongL(.62,wallH*.78),alongL(.62,wallH*.38),alongL(.4,wallH*.38))} fill="#fdfdfd" stroke="#8a97a6" strokeWidth="2"/>}
  {level>=7&&<polygon points={pts(alongL(.68,wallH*.85),alongL(.92,wallH*.85),alongL(.92,wallH*.35),alongL(.68,wallH*.35))} fill="#1d2a3a"/>}
  {tiles}
  {level>=2&&(()=>{const [x,y]=iso(n-.6,.6);return <g><rect x={x-7} y={y-14} width="14" height="14" rx="3" fill="#a0613b"/><circle cx={x} cy={y-24} r="12" fill="#2fa36b"/><circle cx={x-7} cy={y-30} r="8" fill="#38b878"/></g>;})()}
  {(level>=4||state.clusters.length>0)&&(()=>{const [x,y]=iso(.55,n-1.3);return <g>{[0,1].map(k=><g key={k}><rect x={x-12+k*16} y={y-62+k*8} width="15" height="58" fill="#2b3746"/>{Array.from({length:6},(_,r)=><rect key={r} x={x-10+k*16} y={y-58+k*8+r*9} width="11" height="3" fill={state.clusters.length?'#5cf1d0':'#61758a'}/>)}</g>)}</g>;})()}
  {desks.map(desk)}
  {level>=5&&(()=>{const [x,y]=iso(n-1.4,n-1.2);return <g><rect x={x-34} y={y-14} width="68" height="18" rx="8" fill="#ff8a1f"/><rect x={x-34} y={y-26} width="68" height="14" rx="7" fill="#ffa64d"/></g>;})()}
 </svg>;
}
