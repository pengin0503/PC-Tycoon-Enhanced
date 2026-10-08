import {Children,isValidElement,useId,useRef,useState,type ReactNode} from 'react';

/** One touch-friendly, viewport-bounded workspace at a time. No vertical stack of panels. */
export function PanelPages({labels,children}:{labels:readonly string[],children:ReactNode}){
 const id=useId().replace(/:/g,'');
 const panes=Children.toArray(children).filter(isValidElement);
 const [choice,setChoice]=useState(0);
 const active=Math.min(choice,Math.max(0,panes.length-1));
 const viewport=useRef<HTMLDivElement>(null);
 function select(i:number){setChoice(i);viewport.current?.scrollTo({top:0,left:0});}
 return <section className="panel-pages">
  <div role="tablist" aria-label="画面内メニュー" className="workspace-tabs">
   {panes.map((_,i)=><button key={i} role="tab" id={id+'-tab-'+i}
    aria-selected={active===i} aria-controls={id+'-pane-'+i}
    className={active===i?'selected':''} onClick={()=>select(i)}>
     {labels[i]??'ページ '+(i+1)}
    </button>)}
  </div>
  <div ref={viewport} id={id+'-pane-'+active} role="tabpanel" aria-labelledby={id+'-tab-'+active}
    className="workspace-content">{panes[active]}</div>
 </section>;
}
