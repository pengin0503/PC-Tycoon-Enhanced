import {useEffect,useId,useRef,type ReactNode} from 'react';

/** Accessible modal dialog: labelled, focus moves inside on open, Escape closes when allowed. */
export function Modal({title,children,onClose,wide=false,className=''}:{title:string,children:ReactNode,onClose?:()=>void,wide?:boolean,className?:string}){
 const id=useId().replace(/:/g,'');const ref=useRef<HTMLElement>(null);
 useEffect(()=>{ref.current?.focus();},[]);
 useEffect(()=>{if(!onClose)return;const key=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose();};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[onClose]);
 return <div className="modal-overlay"><section ref={ref} tabIndex={-1} className={`modal ${wide?'wide':''} ${className}`} role="dialog" aria-modal="true" aria-labelledby={id+'-title'}>
  <header className="modal-header"><h2 id={id+'-title'}>{title}</h2>{onClose&&<button className="icon-button" aria-label="閉じる" onClick={onClose}>×</button>}</header>
  <div className="modal-body">{children}</div>
 </section></div>;
}

export function Stars({value,size='md'}:{value:number,size?:'sm'|'md'|'lg'}){
 return <span className={`stars ${size}`} role="img" aria-label={`★${value.toFixed(1)}`}>
  {Array.from({length:5},(_,i)=>{const fill=Math.max(0,Math.min(1,value-i));return <span key={i} className="star"><span className="star-fill" style={{width:`${fill*100}%`}}>★</span>★</span>;})}
 </span>;
}

export function Meter({value,max=100,tone='accent',label}:{value:number,max?:number,tone?:'accent'|'good'|'warn'|'bad'|'rp',label?:string}){
 const pct=Math.max(0,Math.min(100,value/max*100));
 return <span className={`meter ${tone}`} role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.round(value)}><span style={{width:`${pct}%`}}/></span>;
}

export function Chip({children,tone=''}:{children:ReactNode,tone?:string}){return <span className={`chip ${tone}`}>{children}</span>;}

export function Empty({children}:{children:ReactNode}){return <p className="empty">{children}</p>;}

export function compact(n:number){
 const abs=Math.abs(n);
 if(abs>=1e12)return (n/1e12).toFixed(1)+'兆';
 if(abs>=1e8)return (n/1e8).toFixed(abs>=1e10?0:1)+'億';
 if(abs>=1e4)return (n/1e4).toFixed(abs>=1e6?0:1)+'万';
 return Math.round(n).toLocaleString('ja-JP');
}
export function gameDate(startYear:number,day:number){
 return {year:startYear+Math.floor(day/360),month:Math.floor(day%360/30)+1,date:day%30+1};
}
