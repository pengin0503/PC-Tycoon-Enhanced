/** 24 original company marks: 6 geometric shapes × 4 palettes. */
const palettes=[['#2f7cf6','#9cc4ff'],['#ff8a1f','#ffd08a'],['#16b07d','#8ff0c9'],['#8b5cf6','#d3c0ff']];
const shapes=[
 (a:string,b:string)=><><path d="M32 6L56 20V44L32 58L8 44V20Z" fill={a}/><path d="M32 18L45 26V40L32 48L19 40V26Z" fill={b}/></>,
 (a:string,b:string)=><><circle cx="32" cy="32" r="26" fill={a}/><path d="M18 34a14 14 0 0 1 28 0" stroke={b} strokeWidth="7" fill="none" strokeLinecap="round"/><circle cx="32" cy="38" r="5" fill={b}/></>,
 (a:string,b:string)=><><rect x="8" y="8" width="48" height="48" rx="12" fill={a}/><path d="M20 44L32 20L44 44Z" fill={b}/></>,
 (a:string,b:string)=><><path d="M32 4L60 32L32 60L4 32Z" fill={a}/><rect x="22" y="22" width="20" height="20" rx="3" fill={b}/></>,
 (a:string,b:string)=><><rect x="6" y="14" width="52" height="36" rx="18" fill={a}/><path d="M20 32h24M32 22v20" stroke={b} strokeWidth="7" strokeLinecap="round"/></>,
 (a:string,b:string)=><><circle cx="24" cy="32" r="18" fill={a}/><circle cx="40" cy="32" r="18" fill={b} opacity=".9"/><circle cx="32" cy="32" r="7" fill="#fff"/></>,
];
export function Logo({id,size=40,label}:{id:number,size?:number,label?:string}){
 const [a,b]=palettes[Math.floor(id/6)%4];const shape=shapes[id%6];
 return <svg className="logo" width={size} height={size} viewBox="0 0 64 64" role={label?'img':undefined} aria-label={label} aria-hidden={label?undefined:true}>{shape(a,b)}</svg>;
}
export const logoIds=Array.from({length:24},(_,i)=>i);
