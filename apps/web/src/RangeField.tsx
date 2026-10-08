import {TermHelp} from './HardwareTerms';
type Props={label:string,value:number,min:number,max:number,step:number,onChange:(n:number)=>void,unit?:string,disabled?:boolean,description?:string};
export function RangeField({label,value,min,max,step,onChange,unit='',disabled=false,description}:Props){
 return <label className="range-field"><span className="range-label"><span>{label}<TermHelp label={label} description={description}/></span><output>{value.toLocaleString('ja-JP')}{unit}</output></span>
 <input type="range" aria-label={label} min={min} max={max} step={step} value={Math.max(min,Math.min(max,value))} disabled={disabled} onChange={e=>onChange(Number(e.currentTarget.value))}/>
 <span className="range-endpoints"><small>{min.toLocaleString('ja-JP')}</small><small>{max.toLocaleString('ja-JP')}</small></span></label>;
}
