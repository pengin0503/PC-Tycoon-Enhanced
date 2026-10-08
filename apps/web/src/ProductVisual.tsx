import {ProductIllustration} from './ProductIllustration';
import type {Product} from '../../../packages/sim/src/types';
export function ProductVisual({product:p}:{product:Product}){
 const color=p.visual?.color??(p.spec.appearance==='silver'||p.spec.appearance==='teal'?p.spec.appearance:'graphite');
 return <ProductIllustration kind={p.kind} color={color} tier={p.visual?.tier??0} spec={p.spec}/>;
}
