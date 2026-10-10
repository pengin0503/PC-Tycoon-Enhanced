import {hardwareCatalog} from '../../../packages/content/src/hardware';
import {hardwareKinds,type HardwareKind} from '../../../packages/content/src/research';
import type {Product} from '../../../packages/sim/src/types';
import {formatValue} from './RangeField';

const optionLabels:Record<string,string>={none:'直付け',semi:'セミモジュラー',full:'フルモジュラー',graphite:'グラファイト',silver:'シルバー',teal:'ティール'};
export const isHardware=(kind:string):kind is HardwareKind=>(hardwareKinds as readonly string[]).includes(kind);
/** Designed specification of a component with units; fields a product was saved without are omitted. */
export function specRows(p:Pick<Product,'kind'|'spec'>):{key:string,label:string,value:string}[]{
 if(!isHardware(p.kind))return [];
 return Object.entries(hardwareCatalog[p.kind].fields).flatMap(([key,field])=>{
  const v=p.spec[key];if(v===undefined)return [];
  return [{key,label:field.label,value:typeof v==='number'?formatValue(v,field.unit):field.optionLabels?.[v]??optionLabels[v]??v}];
 });
}
