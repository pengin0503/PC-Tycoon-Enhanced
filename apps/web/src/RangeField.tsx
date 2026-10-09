import {TermHelp} from './HardwareTerms';
const plain=(value:number,unit:string)=>value.toLocaleString('ja-JP',{maximumFractionDigits:2})+unit;
/** Sizes ship in binary (1,536GB = 1.5TB) or decimal (4,000GB = 4TB) steps; pick the one that gives a round figure. */
function gigabytes(value:number){
 if(value<1)return plain(Math.round(value*1000*100)/100,'MB');
 const base=value%1024===0||value*2%1024===0?1024:1000;
 return value>=base*base?plain(value/base/base,'PB'):value>=base?plain(value/base,'TB'):plain(value,'GB');
}
/**
 * Default display: grouped number followed by its unit ("3.2GHz", "1,024コア"). Sizes and rates that span orders of
 * magnitude switch prefix so year-2000 and year-2100 values both read naturally ("128MB", "4TB", "256KB", "1.5TB/s").
 */
export function formatValue(value:number,unit=''):string{
 switch(unit){
  case'GB':return gigabytes(value);
  case'MB':return value<1?plain(value*1024,'KB'):value>=1024?formatValue(value/1024,'GB'):plain(value,unit);
  case'MB/s':return value>=1000?formatValue(value/1000,'GB/s'):plain(value,unit);
  case'GB/s':return value>=1e6?plain(value/1e6,'PB/s'):value>=1000?plain(value/1000,'TB/s'):plain(value,unit);
  default:return plain(value,unit);
 }
}
/** Large performance scores in 万/億/兆 so they fit the metric tiles ("39.9億"). */
export function formatScore(value:number){
 const abs=Math.abs(value);
 if(abs>=1e12)return plain(Number((value/1e12).toPrecision(3)),'兆');
 if(abs>=1e8)return plain(Number((value/1e8).toPrecision(3)),'億');
 if(abs>=1e6)return plain(Number((value/1e4).toPrecision(3)),'万');
 return Math.round(value).toLocaleString('ja-JP');
}
/** Floating-point throughput with an SI prefix ("1.6GFLOPS", "180TFLOPS"). */
export function formatFlops(flops:number){
 const units:[number,string][]=[[1e18,'E'],[1e15,'P'],[1e12,'T'],[1e9,'G'],[1e6,'M']];
 const [scale,prefix]=units.find(([v])=>flops>=v)??[1,''];
 return plain(Number((flops/scale).toPrecision(3)),`${prefix}FLOPS`);
}
type Props={label:string,value:number,min:number,max:number,step:number,onChange:(n:number)=>void,unit?:string,disabled?:boolean,description?:string,
 /** Custom value text (overrides `unit`). */
 format?:(n:number)=>string,
 /** Absolute bound still locked behind research, shown next to the current limit. */
 researchLimit?:{value:number,side:'max'|'min',hint?:string},
 /** Discrete values (e.g. model sizes): the slider walks the list instead of `min`..`max`. */
 values?:readonly number[],exactInput?:boolean};
export function RangeField({label,value,min,max,step,onChange,unit='',disabled=false,description,format,researchLimit,values,exactInput=false}:Props){
 const show=format??((n:number)=>formatValue(n,unit));
 // A value saved before the list existed (e.g. an older service's context length) stays selectable and shown as is.
 const inRange=(v:number)=>v>=min-1e-9&&v<=max+1e-9;
 const list=values&&[...values.filter(inRange),...(inRange(value)&&!values.some(v=>Math.abs(v-value)<1e-9)?[value]:[])].sort((a,b)=>a-b);
 const found=list?list.findIndex(v=>v>=value-1e-9):-1;
 const index=list?.length?(found===-1?list.length-1:found):0;
 const shown=list?.length?list[index]:Math.max(min,Math.min(max,value));
 const lower=list?.length?list[0]:min,upper=list?.length?list.at(-1)!:max;
 const lock=researchLimit&&<small className="research-lock" title={researchLimit.hint}>🔒 研究で{show(researchLimit.value)}まで</small>;
 return <label className="range-field"><span className="range-label"><span>{label}<TermHelp label={label} description={description}/></span><output>{show(shown)}</output></span>
 {list?.length?<input type="range" aria-label={label} aria-valuetext={show(shown)} min={0} max={list.length-1} step={1} value={index} disabled={disabled} onChange={e=>onChange(list[Number(e.currentTarget.value)])}/>
  :<input type="range" aria-label={label} aria-valuetext={show(shown)} min={min} max={max} step={step} value={shown} disabled={disabled} onChange={e=>onChange(Number(e.currentTarget.value))}/>}
 {exactInput&&<input type="number" aria-label={`${label}を直接入力`} min={min} max={max} step="any" value={shown} disabled={disabled} onChange={e=>{const n=Number(e.currentTarget.value);if(e.currentTarget.value!==''&&Number.isFinite(n))onChange(Math.round(Math.max(min,Math.min(max,n))));}}/>}
 <span className="range-endpoints"><small>{show(lower)}</small><small>{show(upper)}</small></span>
 {researchLimit&&<span className={`range-lock ${researchLimit.side}`}>{lock}</span>}</label>;
}
