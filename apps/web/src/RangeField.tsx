import {TermHelp} from './HardwareTerms';
/** Default display: grouped number followed by its unit ("3.2GHz", "1,024GB"). */
export function formatValue(value:number,unit=''){return value.toLocaleString('ja-JP',{maximumFractionDigits:2})+unit;}
type Props={label:string,value:number,min:number,max:number,step:number,onChange:(n:number)=>void,unit?:string,disabled?:boolean,description?:string,
 /** Custom value text (overrides `unit`). */
 format?:(n:number)=>string,
 /** Absolute bound still locked behind research, shown next to the current limit. */
 researchLimit?:{value:number,side:'max'|'min',hint?:string},
 /** Discrete values (e.g. model sizes): the slider walks the list instead of `min`..`max`. */
 values?:readonly number[]};
export function RangeField({label,value,min,max,step,onChange,unit='',disabled=false,description,format,researchLimit,values}:Props){
 const show=format??((n:number)=>formatValue(n,unit));
 const list=values?.filter(v=>v>=min-1e-9&&v<=max+1e-9);
 const found=list?list.findIndex(v=>v>=value-1e-9):-1;
 const index=list?.length?(found===-1?list.length-1:found):0;
 const shown=list?.length?list[index]:Math.max(min,Math.min(max,value));
 const lower=list?.length?list[0]:min,upper=list?.length?list.at(-1)!:max;
 const lock=researchLimit&&<small className="research-lock" title={researchLimit.hint}>🔒 研究で{show(researchLimit.value)}まで</small>;
 return <label className="range-field"><span className="range-label"><span>{label}<TermHelp label={label} description={description}/></span><output>{show(shown)}</output></span>
 {list?.length?<input type="range" aria-label={label} aria-valuetext={show(shown)} min={0} max={list.length-1} step={1} value={index} disabled={disabled} onChange={e=>onChange(list[Number(e.currentTarget.value)])}/>
  :<input type="range" aria-label={label} aria-valuetext={show(shown)} min={min} max={max} step={step} value={shown} disabled={disabled} onChange={e=>onChange(Number(e.currentTarget.value))}/>}
 <span className="range-endpoints"><small>{show(lower)}</small><small>{show(upper)}</small></span>
 {researchLimit&&<span className={`range-lock ${researchLimit.side}`}>{lock}</span>}</label>;
}
