import {useId} from 'react';
import type {Spec} from '../../../packages/content/src/hardware';

type Props={kind:string,tier:number,color:string,spec?:Spec};
/** Original layered, isometric-inspired product illustration. No network or 3D runtime required. */
export function ProductIllustration({kind,tier,color,spec}:Props){
 const id=useId().replace(/:/g,'');
 const primary=color==='silver'?'#aebfca':color==='teal'?'#4faeaa':'#51657f';
 const metal=tier>=3?'#d5dfdf':'#829caf',accent=tier>=5?'#f6c672':tier>=4?'#5cf1d0':'#7ec6bd';
 const fan=(x:number,y:number,r:number,i:number)=><g key={i} transform={`translate(${x} ${y})`}>
  <circle r={r+5} fill="#122134" stroke={metal} strokeWidth="5"/>
  <circle r={r-4} fill="#263a51" stroke={accent} strokeWidth="2"/>
  {Array.from({length:7},(_,n)=><path key={n} d={`M0 0 Q${r*.74} -${r*.85} ${r*.81} -${r*.15} Q${r*.72} ${r*.3} 0 0Z`} fill={n%2?'#46677e':'#68879a'} transform={`rotate(${n*360/7})`}/>)}
  <circle r="7" fill={accent}/></g>;
 const chassis=<>
  <path d="M68 141L286 63L452 111L233 193Z" fill={primary} stroke="#c1d8d8" strokeWidth="4"/>
  <path d="M68 141L233 193V245L68 190Z" fill="#20334b" stroke="#809caf" strokeWidth="3"/>
  <path d="M233 193L452 111V160L233 245Z" fill="#1d3144" stroke="#6f90a6" strokeWidth="3"/>
  <path d="M88 147L287 77L426 117L228 183Z" fill="#1b3044"/>
  {tier>=3&&<path d="M75 161L232 206L446 124" stroke={accent} strokeWidth="6" fill="none"/>}
  {tier>=4&&<path d="M77 187L231 232L446 151" stroke="#5cf1d0" strokeWidth="5" fill="none"/>}
 </>;
 const art=kind==='cpu'?<><path d="M112 169L271 81L416 154L257 248Z" fill={primary} stroke={metal} strokeWidth="8"/>
  <path d="M149 166L273 103L378 154L253 221Z" fill={tier>=2?'#b5c4c7':'#758e9e'} stroke="#e0ebec" strokeWidth="4"/>
  <path d="M202 169L278 126L337 155L260 202Z" fill="#233c55" stroke={accent} strokeWidth="5"/>
  {tier>=1&&Array.from({length:6},(_,i)=><path key={i} d={`M${160+i*28} ${196-i*12} l18 8`} stroke={accent} strokeWidth="4"/>)}
  {tier>=4&&<path d="M148 175L258 229L378 164" fill="none" stroke="#5cf1d0" strokeWidth="5"/>}</>
 :kind==='gpu'?<>{chassis}{[0,1,...(tier>=2?[2]:[])].map(n=>fan(177+80*n,138-n*25,29,n))}
  {tier>=1&&<path d="M90 188L222 234" stroke={metal} strokeWidth="5"/>}</>
 :kind==='motherboard'?<>{chassis}<path d="M115 150L285 94L385 125L227 182Z" fill="#234f50" stroke="#92c8b9" strokeWidth="4"/>
  <path d="M180 135L266 107L317 123L230 158Z" fill="#142737" stroke={accent} strokeWidth="5"/>
  {Array.from({length:5},(_,n)=><path key={n} d={`M${135+n*13} ${171+n*3}L${247+n*12} ${133+n*3}`} stroke="#a4e1d1" strokeWidth="4"/>)}{tier>=2&&fan(320,145,18,0)}</>
 :kind==='ram'?<><path d="M72 158L362 87L450 117L157 198Z" fill={primary} stroke={metal} strokeWidth="5"/>
  <path d="M157 198L450 117V161L157 244Z" fill="#24434d" stroke="#a6b7c8" strokeWidth="3"/>
  {Array.from({length:7},(_,n)=><path key={n} d={`M${164+n*37} ${185-n*9}l18 -5v32l-18 5Z`} fill="#132938" stroke="#83c1b7" strokeWidth="2"/>)}
  {tier>=2&&<path d="M91 149L367 82L441 106" fill="none" stroke={metal} strokeWidth="9"/>}
  {tier>=4&&<path d="M90 170L161 216L441 134" fill="none" stroke={accent} strokeWidth="6"/>}</>
 :kind==='storage'?<><path d="M88 169L350 104L442 136L181 211Z" fill="#275349" stroke={metal} strokeWidth="6"/>
  {Array.from({length:4},(_,n)=><path key={n} d={`M${151+n*58} ${163-n*14}l32 -9l22 8l-32 10Z`} fill="#162938" stroke="#92b9ba" strokeWidth="3"/>)}
  {tier>=2&&<path d="M107 170L351 111L425 133" stroke={metal} strokeWidth="9" fill="none"/>}
  {tier>=4&&<path d="M112 184L179 205L432 139" stroke={accent} strokeWidth="5" fill="none"/>}</>
 :kind==='pc'?<><path d="M152 78L322 109V252L152 220Z" fill={primary} stroke={metal} strokeWidth="5"/>
  <path d="M322 109L391 78V219L322 252Z" fill="#223b52" stroke={metal} strokeWidth="4"/>
  <path d="M152 78L224 46L391 78L322 109Z" fill="#7592a5" stroke={metal} strokeWidth="4"/>
  <path d="M166 104L310 131V236L166 210Z" fill="#152c42" stroke="#83c1bc" strokeWidth="3"/>
  {fan(240,169,tier>=2?33:25,0)}{tier>=2&&<path d="M333 131L382 110V192L333 212Z" fill="#306575" stroke={metal} strokeWidth="3"/>}
  {tier>=4&&<path d="M169 105L308 130V231" stroke={accent} strokeWidth="5" fill="none"/>}</>
 :<><path d="M110 77H413V224H110Z" fill="#172d42" stroke={primary} strokeWidth="13"/>
  <path d="M129 95H393V210H129Z" fill="#1b4657"/>
  <path d="M129 190L220 117L282 164L349 109L393 157V210H129Z" fill="#31756f"/>
  <path d="M129 198L202 150L270 181L359 127L393 158V210H129Z" fill="#68c2b7" opacity=".75"/>
  {kind==='laptop'?<path d="M101 235H421L455 265H70Z" fill={primary} stroke={metal} strokeWidth="5"/>:<><path d="M250 225H273V252H250Z" fill={primary}/><path d="M210 252H317V264H210Z" fill={primary}/></>}
  {tier>=4&&<path d="M111 77H413V224" stroke={accent} strokeWidth="5" fill="none"/>}</>;
 return <svg className="product-illustration" role="img" aria-label={`${kind.toUpperCase()} ゲーム調3D製品 グレード${tier} ${color}`} viewBox="0 0 520 320">
 <title>{kind.toUpperCase()} グレード {tier}</title>
 <defs><radialGradient id={id} cx=".48" cy=".4" r=".8"><stop stopColor="#365570"/><stop offset="1" stopColor="#101c30"/></radialGradient></defs>
 <rect width="520" height="320" rx="18" fill={`url(#${id})`}/>
 <g stroke="#7392ab" strokeWidth="1" opacity=".13">{Array.from({length:11},(_,n)=><path key={n} d={`M${n*52} 0V320`}/>)}{Array.from({length:7},(_,n)=><path key={n} d={`M0 ${n*53}H520`}/>)}</g>
 <ellipse cx="260" cy="269" rx="181" ry="24" fill="#060c1c" opacity=".55"/>
 {art}
 {tier>=1&&<><circle cx="63" cy="61" r="19" fill="#172a3a" stroke={accent} strokeWidth="3"/><text x="63" y="67" textAnchor="middle" fill={accent} fontWeight="bold" fontSize="17">{tier}</text></>}
 {tier>=5&&<path d="M417 51l6 12 12 5 -12 4 -6 13 -6 -13 -12 -4 12 -5Z" fill="#ffcf75"/>}
 <text x="25" y="299" fill="#a6d6d5" fontSize="12" letterSpacing="3">{kind.toUpperCase()} / VISUAL STUDIO</text>
 <text x="491" y="299" fill="#a6d6d5" textAnchor="end" fontSize="11">{spec?.vram??spec?.cores??''}</text>
 </svg>;
}
