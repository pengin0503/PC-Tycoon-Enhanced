import { t as uiText } from './i18n';
import { useState } from 'react';
import {priceRange} from '../../../packages/sim/src/pricing';
import {yen} from './i18n';
import type { Product } from '../../../packages/sim/src/types';
import type {GameState} from '../../../packages/sim/src/index';
import type { GameCommand } from '../../../packages/sim/src/index';
export function PriceEditor({ product: p, send }: {
    product: Product;
    send: (c: GameCommand) => void;
}) {
    const [draft, setDraft] = useState(String(p.price));
    const {min,max}=priceRange(p);const valid=Number.isSafeInteger(Number(draft))&&Number(draft)>=min&&Number(draft)<=max;
    return <div><label>{uiText("ui_7fbd0b3bdbca")}<input aria-label={`${p.name} 価格`} type="number" min={min} max={max} step={1} value={draft} onChange={e => setDraft(e.target.value)}/></label><small>設定可能範囲：{yen(min)}～{yen(max)}</small><button disabled={!valid} onClick={() => send({ type: 'price', id: p.id, price: Number(draft) })}>{uiText("ui_4fd144438643")}</button></div>;
}
export function ProductionEditor({product:p,state,send}:{product:Product,state:GameState,send:(c:GameCommand)=>void}){
    const [target,setTarget]=useState(p.target||100);
    // Inventory already paid for remains selectable; the remaining budget is current cash / per-unit cost.
    const affordable=Math.floor(state.company.cash/Math.max(1,p.unitCost));
    const max=Math.max(0,Math.min(1000000,Math.max(p.target,p.inventory,p.inventory+affordable)));
    const value=Math.max(0,Math.min(max,target));
    const change=(next:number)=>setTarget(Math.max(0,Math.min(max,Math.round(next))));
    return <div className="inventory-target">
      <label htmlFor={`target-${p.id}`}>在庫目標 <b>{value.toLocaleString('ja-JP')}台</b></label>
      <input id={`target-${p.id}`} type="range" aria-label={`${p.name} 在庫目標`} min={0} max={max} step={1} value={value} onChange={e=>change(Number(e.target.value))}/>
      <input aria-label={`${p.name} 在庫目標（数値）`} type="number" min={0} max={max} step={1} value={value} onChange={e=>change(Number(e.target.value))}/>
      <small>資金と製造原価から設定可能な上限：{max.toLocaleString('ja-JP')}台（所持金 {yen(state.company.cash)}）</small>
      <div className="button-row"><button onClick={()=>send({type:'line',id:p.id,target:value})}>{uiText("ui_cc00dce2515a")}</button>
      <button onClick={()=>send({type:'line',id:p.id,target:p.line?0:value})}>{p.line?uiText("ui_3e9e944ff26b"):uiText("ui_f59c0c5a321e")}</button></div>
    </div>;
}
