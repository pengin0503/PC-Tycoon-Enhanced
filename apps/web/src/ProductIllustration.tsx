import {useId,type ReactNode} from 'react';
import type {Spec} from '../../../packages/content/src/hardware';
import {formatValue} from './RangeField';

type Props={kind:string,tier:number,color:string,spec?:Spec};
type V3=readonly [number,number,number];
type Paint={top:string,left:string,right:string};

const COS=Math.cos(Math.PI/6),SIN=.5;
const INK='#08121f',GOLD='#e4b54a',GOLD_DARK='#a8781f',PCB='#1d5843',PCB_DARK='#152b33',CHIP='#141c26',SLOT='#0f1720';

/** Moves a #rrggbb colour toward white (amount>0) or black (amount<0). */
export function shade(hex:string,amount:number){
 const n=parseInt(hex.slice(1),16),target=amount<0?0:255,p=Math.min(1,Math.abs(amount));
 return '#'+[n>>16,(n>>8)&255,n&255].map(v=>Math.round(v+(target-v)*p).toString(16).padStart(2,'0')).join('');
}
const paint=(base:string,top=.18,right=-.28):Paint=>({top:shade(base,top),left:base,right:shade(base,right)});

/**
 * Isometric camera fitted to an object whose bounding box spans x∈[0,w], y∈[0,d], z∈[0,h].
 * World x runs to the lower right, y to the lower left and z straight up, so the visible faces of a box
 * are its top, its +y face (left) and its +x face (right).
 */
function camera(w:number,d:number,h:number){
 const k=Math.min(1.3,360/((w+d)*COS),224/((w+d)*SIN+h));
 const ox=260-(w-d)*COS*k/2,oy=146-((w+d)*SIN-h)*k/2;
 const xy=([x,y,z]:V3):[number,number]=>[ox+(x-y)*COS*k,oy+((x+y)*SIN-z)*k];
 const vec=([x,y,z]:V3)=>[(x-y)*COS*k,((x+y)*SIN-z)*k];
 const path=(...points:V3[])=>'M'+points.map(p=>xy(p).map(v=>v.toFixed(1)).join(' ')).join('L')+'Z';
 /** SVG matrix that maps 2D drawing coordinates onto the plane through `o` spanned by `u` and `v`. */
 const plane=(o:V3,u:V3,v:V3)=>{const [a,b]=vec(u),[c,d2]=vec(v),[e,f]=xy(o);return `matrix(${[a,b,c,d2,e,f].map(n=>n.toFixed(4)).join(' ')})`;};
 const top=(z:number,x=0,y=0)=>plane([x,y,z],[1,0,0],[0,1,0]);
 /** The +y face at depth y; drawing x follows world x, drawing y runs downward from height z. */
 const left=(y:number,z:number,x=0)=>plane([x,y,z],[1,0,0],[0,0,-1]);
 /** The +x face at x; drawing x runs from world y=y0 toward y=0 (screen right), drawing y downward from z. */
 const right=(x:number,y0:number,z:number)=>plane([x,y0,z],[0,-1,0],[0,0,-1]);
 const box=(x:number,y:number,z:number,bw:number,bd:number,bh:number,c:Paint,key?:string|number,edge=INK)=><g key={key} stroke={edge} strokeWidth="1.2" strokeLinejoin="round">
  <path d={path([x,y+bd,z+bh],[x+bw,y+bd,z+bh],[x+bw,y+bd,z],[x,y+bd,z])} fill={c.left}/>
  <path d={path([x+bw,y+bd,z+bh],[x+bw,y,z+bh],[x+bw,y,z],[x+bw,y+bd,z])} fill={c.right}/>
  <path d={path([x,y,z+bh],[x+bw,y,z+bh],[x+bw,y+bd,z+bh],[x,y+bd,z+bh])} fill={c.top}/>
 </g>;
 return {xy,path,top,left,right,box,shadow:{cx:ox+(w-d)*COS*k/2,cy:oy+(w+d)*SIN*k*.62+12,rx:(w+d)*COS*k*.5,ry:Math.max(14,(w+d)*SIN*k*.42)}};
}

/** Axial fan drawn flat; place it inside a plane transform to get the correct perspective ellipse. */
function Fan({x,y,r,frame,accent,blades=7}:{x:number,y:number,r:number,frame:string,accent:string,blades?:number}){
 return <g transform={`translate(${x} ${y})`}>
  <circle r={r+4} fill={frame} stroke={INK} strokeWidth="1.2"/>
  <circle r={r} fill="#0d1622"/>
  {Array.from({length:blades},(_,n)=><path key={n} d={`M0 0Q${r*.62} ${-r*.92} ${r*.94} ${-r*.2}Q${r*.66} ${r*.18} 0 0Z`} fill={n%2?'#3f5a70':'#56738a'} transform={`rotate(${n*360/blades})`}/>)}
  <circle r={r*.28} fill="#1b2a3a" stroke={accent} strokeWidth="2"/>
 </g>;
}

/** Storage looks like the hardware its transfer speed implies: an HDD, a 2.5" SATA SSD or an M.2 NVMe stick. */
export function storageForm(spec?:Spec):'hdd'|'sata'|'nvme'{
 const speed=Number(spec?.speed??0);
 return speed>600?'nvme':speed>250?'sata':'hdd';
}

/** The one headline figure printed in the corner, formatted like the spec sheet. */
function specLabel(kind:string,spec?:Spec){
 const n=(k:string)=>typeof spec?.[k]==='number'?spec[k] as number:undefined;
 const cores=n('cores'),vram=n('vram'),capacity=n('capacity'),wattage=n('wattage'),resolution=n('resolution');
 if(kind==='cpu'&&cores)return formatValue(cores,'コア');
 if(kind==='gpu'&&vram)return `VRAM ${formatValue(vram,'GB')}`;
 if((kind==='ram'||kind==='storage')&&capacity)return formatValue(capacity,'GB');
 if(kind==='psu'&&wattage)return formatValue(wattage,'W');
 if(kind==='monitor'&&resolution)return formatValue(resolution,'p');
 return '';
}

/** Original isometric product illustration built from flat SVG faces. No network or 3D runtime required. */
export function ProductIllustration({kind,tier,color,spec}:Props){
 const id=useId().replace(/:/g,'');
 const primary=color==='silver'?'#aebfca':color==='teal'?'#3f9f9b':'#4d5f78';
 const body=paint(primary);
 const metal=paint(tier>=3?'#c9d4da':'#8ea2b2',.2,-.3);
 const accent=tier>=5?'#f6c672':tier>=4?'#5cf1d0':'#7ec6bd';
 const glow=tier>=4?accent:undefined;
 const screen=`${id}-screen`,sheen=`${id}-sheen`,platter=`${id}-platter`;
 let art:ReactNode;let shadow={cx:260,cy:250,rx:180,ry:24};

 if(kind==='cpu'){
  const c=camera(180,180,34);shadow=c.shadow;
  const lid=paint(tier>=2?shade(primary,.45):shade(primary,.25),.2,-.3);
  art=<>
   {[168,180].map((y,row)=>Array.from({length:14},(_,i)=>{const [x1,y1]=c.xy([8+i*12+row*5,y,10]),[,y2]=c.xy([8+i*12+row*5,y,row?0:3]);return <path key={`a${row}-${i}`} d={`M${x1} ${y1}V${y2}`} stroke={row?GOLD:GOLD_DARK} strokeWidth="2.2"/>;}))}
   {[168,180].map((x,row)=>Array.from({length:14},(_,i)=>{const [x1,y1]=c.xy([x,172-i*12-row*5,10]),[,y2]=c.xy([x,172-i*12-row*5,row?0:3]);return <path key={`b${row}-${i}`} d={`M${x1} ${y1}V${y2}`} stroke={row?GOLD:GOLD_DARK} strokeWidth="2.2"/>;}))}
   {c.box(0,0,10,180,180,8,paint(PCB,.12,-.3))}
   <g transform={c.top(18)}>
    <path d="M8 8h22L8 30Z" fill={GOLD}/>
    {Array.from({length:8},(_,i)=><rect key={i} x={36+i*15} y="12" width="7" height="4" rx="1" fill="#c9a24a"/>)}
    {Array.from({length:8},(_,i)=><rect key={i} x="12" y={44+i*15} width="4" height="7" rx="1" fill="#c9a24a"/>)}
   </g>
   {c.box(24,24,18,132,132,4,lid)}
   {c.box(34,34,22,112,112,10,lid)}
   <g transform={c.top(32,34,34)}>
    <rect x="8" y="8" width="96" height="96" rx="4" fill={`url(#${sheen})`} opacity=".55"/>
    <text x="14" y="34" fontSize="14" fontWeight="800" fill={shade(primary,-.55)} letterSpacing="1">TYCOON</text>
    <rect x="14" y="44" width="58" height="5" rx="2" fill={shade(primary,-.4)}/>
    <rect x="14" y="54" width="40" height="5" rx="2" fill={shade(primary,-.4)}/>
    <rect x="14" y="80" width="20" height="16" rx="2" fill="none" stroke={shade(primary,-.45)} strokeWidth="2"/>
    {tier>=1&&<rect x="4" y="4" width="104" height="104" rx="6" fill="none" stroke={accent} strokeWidth={tier>=4?4:2.5}/>}
   </g>
  </>;
 }else if(kind==='gpu'){
  const c=camera(268,118,62);shadow=c.shadow;
  const fans=tier>=2?[52,134,216]:[78,190],r=tier>=2?34:42;
  art=<>
   {c.box(46,104,2,118,6,8,paint(GOLD,.1,-.25))}
   {c.box(0,4,10,262,106,6,paint(PCB_DARK,.15,-.3))}
   {c.box(4,0,16,256,110,34,body)}
   <g transform={c.left(110,50,4)}>
    <path d="M0 6H256" stroke={shade(primary,-.4)} strokeWidth="2"/>
    {tier>=1&&<path d="M12 14H180l12 10H244" fill="none" stroke={accent} strokeWidth={tier>=4?5:3}/>}
    <text x="200" y="28" fontSize="9" fontWeight="800" fill={shade(primary,-.55)}>TYCOON</text>
   </g>
   <g transform={c.top(50,4,0)}>
    <path d="M0 0H256V110H0Z" fill={`url(#${sheen})`} opacity=".25"/>
    <path d="M6 6L30 6L16 104L6 104Z M250 6L226 6L240 104L250 104Z" fill={shade(primary,-.22)}/>
    {fans.map((x,i)=><Fan key={i} x={x} y={55} r={r} frame={shade(primary,-.35)} accent={glow??accent}/>)}
   </g>
   {c.box(262,-4,0,5,122,62,metal)}
   <g transform={c.right(267,118,62)}>
    {[0,1,2].map(i=><rect key={i} x={16+i*20} y="22" width="14" height="9" rx="1.5" fill={SLOT}/>)}
    <rect x="78" y="22" width="16" height="9" rx="1.5" fill={SLOT}/>
    {Array.from({length:6},(_,i)=><rect key={i} x={14+i*16} y="40" width="9" height="14" rx="2" fill={SLOT} opacity=".8"/>)}
   </g>
  </>;
 }else if(kind==='motherboard'){
  const c=camera(220,200,38);shadow=c.shadow;
  const sink=paint(tier>=3?shade(primary,.2):primary);
  art=<>
   {c.box(0,0,0,220,200,6,paint(tier>=2?PCB_DARK:PCB,.12,-.3))}
   <g transform={c.top(6)} fill="none" stroke={tier>=2?'#36586a':'#3f8a6a'} strokeWidth="1.4">
    {Array.from({length:7},(_,i)=><path key={i} d={`M${64+i*8} 112V${124+i*3}H${30+i*2}V196`}/>)}
    {Array.from({length:5},(_,i)=><path key={i} d={`M126 ${58+i*10}H${136}`}/>)}
   </g>
   {c.box(6,6,6,30,40,30,metal)}
   {c.box(42,6,6,104,20,18,sink)}
   {c.box(6,52,6,20,66,18,sink)}
   {Array.from({length:5},(_,i)=>c.box(48+i*17,32,6,10,10,8,paint('#39434f'),`l${i}`))}
   {c.box(50,48,6,64,64,3,metal)}
   <g transform={c.top(9,50,48)}>
    <rect x="8" y="8" width="48" height="48" fill="#2a3440"/>
    {Array.from({length:6},(_,r)=>Array.from({length:6},(_,q)=><circle key={`${r}-${q}`} cx={13+q*7.6} cy={13+r*7.6} r="1.6" fill={GOLD}/>))}
    <path d="M60 4V60" stroke="#dfe7ea" strokeWidth="2.5"/>
   </g>
   {[0,1,2,3].map(i=>c.box(134+i*11,44,6,6,112,7,paint(i%2?SLOT:shade(primary,-.15)),`d${i}`))}
   {c.box(196,52,6,12,44,9,paint('#d7dde2',.1,-.25))}
   {[0,1].map(i=>c.box(18,128+i*32,6,98,7,8,paint(i===0&&tier>=2?'#c9d4da':SLOT),`p${i}`))}
   {c.box(132,166,6,40,26,9,sink)}
   <g transform={c.top(15,132,166)}><circle cx="20" cy="13" r="6" fill={glow??shade(primary,-.35)}/></g>
   {tier>=1&&<g transform={c.left(200,6)}><path d="M10 3H210" stroke={accent} strokeWidth={tier>=4?4:2.5}/></g>}
  </>;
 }else if(kind==='ram'){
  const c=camera(250,24,76);shadow=c.shadow;
  const spreader=tier>=2;
  art=<>
   {c.box(0,8,0,250,6,62,paint(PCB,.12,-.3))}
   <g transform={c.left(14,62)}>
    {Array.from({length:44},(_,i)=><rect key={i} x={8+i*5.4+(i>=20?6:0)} y="50" width="3.4" height="11" fill={GOLD}/>)}
    <path d="M114 62V54h6v8" fill={PCB} stroke="none"/>
    {!spreader&&Array.from({length:8},(_,i)=><rect key={i} x={10+i*29.5} y="14" width="22" height="26" rx="1.5" fill={CHIP}/>)}
    {!spreader&&<rect x="10" y="4" width={tier>=1?92:60} height="7" rx="1.5" fill={shade(primary,.35)}/>}
   </g>
   {spreader&&<>
    {c.box(2,14,10,246,4,52,body)}
    <g transform={c.left(18,62,2)}>
     <path d="M0 0H246V8L226 18H20L0 8Z" fill={shade(primary,-.25)}/>
     <text x="16" y="38" fontSize="13" fontWeight="800" fill={shade(primary,-.55)} letterSpacing="2">TYCOON</text>
     <path d="M150 30H230" stroke={accent} strokeWidth="3"/>
    </g>
   </>}
   {tier>=4&&c.box(2,10,62,246,8,8,paint(accent,.25,-.2),undefined,shade(accent,-.5))}
  </>;
 }else if(kind==='storage'){
  const form=storageForm(spec);
  if(form==='hdd'){
   const c=camera(150,220,26);shadow=c.shadow;
   art=<>
    {c.box(0,0,0,150,220,26,paint(shade(primary,-.2)))}
    <g transform={c.top(26)}>
     <rect x="6" y="6" width="138" height="208" rx="10" fill={shade(primary,.25)} stroke={INK} strokeWidth="1"/>
     <circle cx="75" cy="84" r="62" fill={`url(#${platter})`} stroke={INK} strokeWidth="1.2"/>
     <circle cx="75" cy="84" r="14" fill={shade(primary,.1)} stroke={INK} strokeWidth="1"/>
     <path d="M124 186L118 150L82 96" stroke="#dfe6ea" strokeWidth="7" strokeLinecap="round" fill="none"/>
     <circle cx="124" cy="186" r="11" fill={shade(primary,-.3)} stroke={INK} strokeWidth="1"/>
     <rect x="18" y="160" width="76" height="44" rx="3" fill="#eef3f6"/>
     <rect x="24" y="168" width="44" height="6" rx="2" fill={tier>=1?accent:'#7d8b97'}/>
     <rect x="24" y="180" width="62" height="4" rx="2" fill="#a9b6c0"/><rect x="24" y="190" width="50" height="4" rx="2" fill="#a9b6c0"/>
     {[[12,12],[138,12],[12,208],[138,208]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="3" fill={shade(primary,-.4)}/>)}
    </g>
    <g transform={c.left(220,26)}>
     <rect x="14" y="8" width="44" height="10" rx="1.5" fill={SLOT}/><rect x="17" y="12" width="38" height="2.5" fill={GOLD}/>
     <rect x="66" y="8" width="60" height="10" rx="1.5" fill={SLOT}/><rect x="69" y="12" width="54" height="2.5" fill={GOLD}/>
    </g>
   </>;
  }else if(form==='sata'){
   const c=camera(140,200,14);shadow=c.shadow;
   art=<>
    {c.box(0,0,0,140,200,14,body)}
    <g transform={c.top(14)}>
     <rect x="10" y="10" width="120" height="180" rx="8" fill={shade(primary,-.35)}/>
     <rect x="18" y="20" width="104" height="160" rx="5" fill={`url(#${sheen})`} opacity=".3"/>
     <text x="70" y="98" fontSize="30" fontWeight="900" textAnchor="middle" fill="#eef3f6" letterSpacing="2">SSD</text>
     <path d="M30 120H110" stroke={tier>=1?accent:'#8fa6b6'} strokeWidth="4"/>
     <text x="70" y="150" fontSize="10" fontWeight="700" textAnchor="middle" fill="#c9d6e0">TYCOON</text>
    </g>
    <g transform={c.left(200,14)}>
     <rect x="18" y="4" width="40" height="7" rx="1" fill={SLOT}/><rect x="64" y="4" width="52" height="7" rx="1" fill={SLOT}/>
    </g>
   </>;
  }else{
   const c=camera(60,250,22);shadow=c.shadow;
   art=<>
    {c.box(0,0,6,60,250,4,paint(PCB_DARK,.15,-.3))}
    <g transform={c.top(10)}>
     <circle cx="30" cy="0" r="7" fill={INK}/>
     {Array.from({length:28},(_,i)=><rect key={i} x={4+i*1.9} y="236" width="1.1" height="12" fill={GOLD}/>)}
     <rect x="36" y="236" width="4" height="14" fill={PCB_DARK}/>
    </g>
    {tier>=2?<>
     {c.box(4,16,10,52,212,8,body)}
     <g transform={c.top(18,4,16)}>
      {Array.from({length:12},(_,i)=><path key={i} d={`M6 ${12+i*16}H46`} stroke={shade(primary,-.3)} strokeWidth="3"/>)}
      <text x="26" y="110" fontSize="10" fontWeight="800" textAnchor="middle" fill={shade(primary,-.6)} transform="rotate(-90 26 110)">NVMe</text>
      {tier>=4&&<path d="M2 2H50V210H2Z" fill="none" stroke={accent} strokeWidth="3"/>}
     </g>
    </>:<>
     {c.box(8,190,10,44,34,4,paint(CHIP))}
     {c.box(8,100,10,44,62,4,paint(CHIP))}
     {c.box(8,24,10,44,62,4,paint(CHIP))}
     <g transform={c.top(10)}><rect x="8" y="170" width="44" height="12" fill="#eef3f6"/><rect x="12" y="174" width="26" height="4" fill={tier>=1?accent:'#7d8b97'}/></g>
    </>}
   </>;
  }
 }else if(kind==='psu'){
  const c=camera(150,140,86);shadow=c.shadow;
  const modular=String(spec?.modular??(tier>=1?'semi':'none'));
  art=<>
   {c.box(0,0,0,150,140,86,body)}
   <g transform={c.top(86)}>
    <circle cx="75" cy="70" r="56" fill="#0c141d" stroke={INK}/>
    <Fan x={75} y={70} r={48} frame={shade(primary,-.3)} accent={glow??accent} blades={9}/>
    {[18,32,46].map(r=><circle key={r} cx="75" cy="70" r={r} fill="none" stroke={shade(primary,.1)} strokeWidth="2"/>)}
    <path d="M75 20V120M25 70H125" stroke={shade(primary,.1)} strokeWidth="2"/>
   </g>
   <g transform={c.right(150,140,86)}>
    <rect x="16" y="16" width="108" height="54" rx="4" fill="#eef3f6"/>
    <text x="70" y="50" fontSize="22" fontWeight="900" textAnchor="middle" fill="#1d2b3a">{spec?.wattage?`${spec.wattage}W`:'PSU'}</text>
    <rect x="28" y="58" width="84" height="4" rx="2" fill={tier>=1?accent:'#9aa8b4'}/>
   </g>
   <g transform={c.left(140,86)}>
    {modular==='none'?<rect x="16" y="34" width="34" height="22" rx="4" fill="#151d27"/>
     :Array.from({length:modular==='full'?8:4},(_,i)=><rect key={i} x={14+(i%4)*32} y={18+Math.floor(i/4)*24} width="24" height="16" rx="2" fill={SLOT} stroke={shade(primary,-.4)}/>)}
    {modular==='semi'&&<rect x="20" y="52" width="30" height="20" rx="4" fill="#151d27"/>}
    {tier>=4&&<path d="M6 80H144" stroke={accent} strokeWidth="4"/>}
   </g>
  </>;
 }else if(kind==='pc'){
  const c=camera(220,100,236);shadow=c.shadow;
  art=<>
   {[[10,10],[190,10],[10,80],[190,80]].map(([x,y],i)=>c.box(x,y,0,20,12,6,paint('#1a222c'),`f${i}`))}
   {c.box(0,0,6,220,100,230,body)}
   <g transform={c.top(236)}>{Array.from({length:8},(_,i)=><rect key={i} x={30+i*20} y="22" width="10" height="56" rx="4" fill={shade(primary,-.35)}/>)}</g>
   <g transform={c.left(100,236)}>
    <rect x="12" y="12" width="196" height="206" rx="6" fill={`url(#${screen})`} stroke={shade(primary,-.4)} strokeWidth="3"/>
    <rect x="28" y="22" width="172" height="128" rx="3" fill="#121b26"/>
    <Fan x={44} y={58} r={20} frame="#273646" accent={glow??accent}/>
    <rect x="114" y="34" width="56" height="56" rx="4" fill="#2c3b4a"/>
    <Fan x={142} y={62} r={22} frame="#3a4c5e" accent={glow??accent}/>
    {[0,1,2,3].map(i=><rect key={i} x={178+i*5} y="34" width="3.5" height="50" fill={tier>=4?accent:'#4b6074'}/>)}
    <rect x="50" y="110" width="140" height="22" rx="3" fill={shade(primary,-.25)}/>
    <path d="M58 121H182" stroke={glow??'#2b3a49'} strokeWidth="3"/>
    <rect x="14" y="166" width="192" height="50" fill={shade(primary,-.15)}/>
    <text x="196" y="198" fontSize="12" fontWeight="800" textAnchor="end" fill={shade(primary,-.5)}>TYCOON</text>
    <path d="M12 12H208" stroke="#ffffff" strokeOpacity=".22" strokeWidth="6"/>
   </g>
   <g transform={c.right(220,100,236)}>
    <rect x="12" y="34" width="76" height="176" rx="5" fill={shade(primary,-.4)}/>
    {Array.from({length:22},(_,i)=><path key={i} d={`M16 ${40+i*8}H84`} stroke={shade(primary,-.2)} strokeWidth="2"/>)}
    {(tier>=2?[64,120,176]:[90,160]).map((y,i)=><circle key={i} cx="50" cy={y} r="24" fill="none" stroke={glow??shade(primary,-.15)} strokeWidth={glow?4:3}/>)}
    <circle cx="50" cy="18" r="7" fill="#101820" stroke={tier>=1?accent:'#8fa6b6'} strokeWidth="2.5"/>
    <rect x="66" y="14" width="10" height="5" rx="1" fill={SLOT}/><rect x="66" y="22" width="10" height="5" rx="1" fill={SLOT}/>
   </g>
  </>;
 }else if(kind==='laptop'){
  const c=camera(240,170,160);shadow=c.shadow;
  art=<>
   {c.box(0,0,10,240,8,150,body)}
   <g transform={c.left(8,160)}>
    <rect x="8" y="8" width="224" height="134" rx="3" fill="#0b121b"/>
    <rect x="14" y="14" width="212" height="122" fill={`url(#${screen})`}/>
    <path d="M14 112L70 72L112 98L164 58L226 104V136H14Z" fill="#2f7a73"/><path d="M14 124L80 96L134 118L190 86L226 112V136H14Z" fill="#6ad0c2" opacity=".75"/>
   </g>
   {c.box(0,8,0,240,162,10,body)}
   <g transform={c.top(10,0,8)}>
    <rect x="18" y="14" width="204" height="78" rx="4" fill={shade(primary,-.4)}/>
    {Array.from({length:5},(_,r)=>Array.from({length:14},(_,q)=><rect key={`${r}-${q}`} x={22+q*14.4} y={18+r*14.6} width="11.4" height="11" rx="2" fill={tier>=4?shade(accent,-.25):'#18222e'}/>))}
    <rect x="86" y="104" width="68" height="44" rx="5" fill={shade(primary,-.12)} stroke={shade(primary,-.35)}/>
    {tier>=1&&<path d="M6 156H234" stroke={accent} strokeWidth="2.5"/>}
   </g>
  </>;
 }else if(kind==='ai-cluster'){
  const c=camera(230,90,210);shadow=c.shadow;
  art=<>{[0,1,2].map(n=><g key={n}>
   {c.box(n*80,0,0,70,90,210,paint('#1e2c3c',.15,-.3))}
   <g transform={c.left(90,210,n*80)}>
    <rect x="5" y="6" width="60" height="198" rx="3" fill="#0d151f"/>
    {Array.from({length:12},(_,i)=><g key={i}><rect x="8" y={10+i*16} width="54" height="12" rx="1.5" fill={i%3===0?primary:'#2a3a4c'}/>
     <circle cx="14" cy={16+i*16} r="2.2" fill={i%2?accent:'#5cf1d0'}/><path d={`M22 ${16+i*16}H56`} stroke="#0d151f" strokeWidth="2" strokeDasharray="3 2"/></g>)}
   </g>
   <g transform={c.top(210,n*80)}>{Array.from({length:4},(_,i)=><circle key={i} cx={18+(i%2)*34} cy={22+Math.floor(i/2)*44} r="13" fill="#0d151f" stroke="#3c4f63"/>)}</g>
  </g>)}</>;
 }else if(kind==='ai-model'){
  const c=camera(160,160,200);shadow=c.shadow;
  // The network floats as a hologram facing the viewer, so it is laid out in screen space above the chip.
  const [cx,cy]=c.xy([80,80,14]);
  const layers=[[-84,[-66,-120]],[0,[-54,-102,-150]],[84,[-66,-120]]] as const;
  const nodes=layers.flatMap(([dx,dys])=>dys.map(dy=>[cx+dx,cy+dy]));
  const edges=layers.slice(0,-1).flatMap(([dx,dys],l)=>dys.flatMap(dy=>layers[l+1][1].map(dy2=>[[cx+dx,cy+dy],[cx+layers[l+1][0],cy+dy2]])));
  art=<>
   {c.box(10,10,0,140,140,14,paint('#1b2838',.15,-.3))}
   <g transform={c.top(14,10,10)}>
    <rect x="22" y="22" width="96" height="96" rx="8" fill={primary} stroke={INK}/>
    <rect x="40" y="40" width="60" height="60" rx="4" fill="#0d151f" stroke={accent} strokeWidth="2"/>
    {Array.from({length:10},(_,i)=><rect key={i} x={14+i*12} y="4" width="5" height="10" fill={GOLD}/>)}
   </g>
   <path d={`M${cx-30} ${cy}L${cx-110} ${cy-165}H${cx+110}L${cx+30} ${cy}Z`} fill={accent} opacity=".12"/>
   {edges.map(([[x1,y1],[x2,y2]],i)=><path key={i} d={`M${x1} ${y1}L${x2} ${y2}`} stroke={accent} strokeWidth="2.2" opacity=".7"/>)}
   {nodes.map(([x,y],i)=><circle key={i} cx={x} cy={y} r="11" fill={i%2?'#5cf1d0':primary} stroke="#e0ebec" strokeWidth="2.5"/>)}
  </>;
 }else if(kind==='monitor'||kind==='os'){
  const c=camera(280,72,224);shadow=c.shadow;
  const theme=({blue:'#2b5fb8',orange:'#c4621c',violet:'#6a42c2'} as Record<string,string>)[String(spec?.theme)]??'#1d6d6b';
  art=<>
   {c.box(80,0,0,120,72,8,body)}
   {c.box(126,8,8,28,12,110,body)}
   {c.box(0,22,60,280,12,164,body)}
   <g transform={c.left(34,224)}>
    <rect x="8" y="8" width="264" height="140" rx="2" fill="#0b121b"/>
    {kind==='os'?<>
     <rect x="12" y="12" width="256" height="132" fill={theme}/>
     <rect x="34" y="28" width="110" height="74" rx="3" fill="#f4f8ff" opacity=".94"/><rect x="34" y="28" width="110" height="11" rx="3" fill="#9fb4cc"/>
     <rect x="160" y="40" width="88" height="54" rx="3" fill="#f4f8ff" opacity=".75"/>
     <rect x="12" y="132" width="256" height="12" fill="#0f1e30" opacity=".85"/>
     {[0,1,2,3].map(n=><rect key={n} x={20+n*18} y="135" width="12" height="6" rx="2" fill={accent}/>)}
    </>:<>
     <rect x="12" y="12" width="256" height="132" fill={`url(#${screen})`}/>
     <path d="M12 116L84 66L132 98L196 52L268 104V144H12Z" fill="#2f7a73"/><path d="M12 128L96 94L150 118L214 82L268 112V144H12Z" fill="#6ad0c2" opacity=".75"/>
    </>}
    <text x="140" y="160" fontSize="8" fontWeight="800" textAnchor="middle" fill={shade(primary,-.55)} letterSpacing="2">TYCOON</text>
    {tier>=4&&<path d="M2 2H278V162H2Z" fill="none" stroke={accent} strokeWidth="3"/>}
   </g>
  </>;
 }else{
  const c=camera(160,160,120);shadow=c.shadow;
  art=c.box(0,0,0,160,160,120,body);
 }

 const label=specLabel(kind,spec);
 return <svg className="product-illustration" role="img" aria-label={`${kind.toUpperCase()} ゲーム調3D製品 グレード${tier} ${color}`} viewBox="0 0 520 320">
 <title>{`${kind.toUpperCase()} グレード ${tier}`}</title>
 <defs>
  <radialGradient id={id} cx=".48" cy=".4" r=".8"><stop stopColor="#365570"/><stop offset="1" stopColor="#101c30"/></radialGradient>
  <linearGradient id={sheen} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffffff" stopOpacity=".9"/><stop offset=".5" stopColor="#ffffff" stopOpacity="0"/><stop offset="1" stopColor="#ffffff" stopOpacity=".35"/></linearGradient>
  <linearGradient id={screen} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#24557a"/><stop offset="1" stopColor="#0f2a40"/></linearGradient>
  <radialGradient id={platter}><stop stopColor="#f2f6f8"/><stop offset=".55" stopColor="#9fb0bd"/><stop offset=".8" stopColor="#dfe7ec"/><stop offset="1" stopColor="#7d8f9c"/></radialGradient>
 </defs>
 <rect width="520" height="320" rx="18" fill={`url(#${id})`}/>
 <g stroke="#7392ab" strokeWidth="1" opacity=".13">{Array.from({length:11},(_,n)=><path key={n} d={`M${n*52} 0V320`}/>)}{Array.from({length:7},(_,n)=><path key={n} d={`M0 ${n*53}H520`}/>)}</g>
 <ellipse {...shadow} fill={glow??'#060c1c'} opacity={glow?.16:.45}/>
 {art}
 {tier>=1&&<><circle cx="44" cy="42" r="19" fill="#172a3a" stroke={accent} strokeWidth="3"/><text x="44" y="48" textAnchor="middle" fill={accent} fontWeight="bold" fontSize="17">{tier}</text></>}
 {tier>=5&&<path d="M474 28l6 12 12 5 -12 4 -6 13 -6 -13 -12 -4 12 -5Z" fill="#ffcf75"/>}
 <text x="25" y="303" fill="#a6d6d5" fontSize="12" letterSpacing="3">{kind.toUpperCase()} / VISUAL STUDIO</text>
 {label&&<text x="495" y="303" fill="#a6d6d5" textAnchor="end" fontSize="12" fontWeight="700">{label}</text>}
 </svg>;
}
