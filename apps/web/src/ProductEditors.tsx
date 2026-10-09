import { t as uiText } from './i18n';
import { useState } from 'react';
import {priceRange} from '../../../packages/sim/src/pricing';
import {assemblyDemand,availableForRetail,availableForAssembly,availableForAI} from '../../../packages/sim/src/inventory-allocation';
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
    const max=Math.max(0,Math.min(1000000,p.inventory+affordable));
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

/** Per-product routing: the external sale pool excludes assembly and AI allocations.
 * Assembly/AI consumption separately protects the retail reserve.
 */
export function StockAllocationEditor({product:p,state,send}:{product:Product,state:GameState,send:(c:GameCommand)=>void}){
 const [draft,setDraft]=useState(p.stockAllocation??{retail:0,assembly:0,ai:0});
 const fields=[['retail','外販用最低確保'],['assembly','PC組立用引当'],['ai','AI Lab用引当']] as const;
 const change=(key:keyof typeof draft,raw:string)=>setDraft({...draft,[key]:Math.max(0,Math.min(1000000,Math.round(Number(raw)||0)))});
 const nextAssembly=assemblyDemand(state,p),retail=availableForRetail(state,p),internal=availableForAssembly(p),ai=availableForAI(state,p);
 const shortage=Math.max(0,nextAssembly-internal);
 return <div className="inventory-target"><h3>在庫の用途別引当</h3>
  <p className="hint">外販用は組立・AI調達から保護し、組立用・AI用の引当は日次の通常販売から保護します。数量は各在庫に対する上限で、在庫自体は増えません。</p>
  <p className="hint" data-testid={`allocation-forecast-${p.id}`}>翌日組立の最大必要量：{nextAssembly}台 / 組立に利用可能：{internal}台 / 不足予測：{shortage}台 / 通常販売可能：{retail}台 / AI Lab調達可能：{ai}台</p>
  <p className="hint">優先順位：外販最低確保とAI用引当を保護した残りから組立し、翌日組立予約とAI用引当を除いた在庫を通常販売します。資金・他社部品不足では組立量は減少します。</p>
  <div className="form-grid">{fields.map(([key,label])=><label key={key}>{label}
   <input type="number" min={0} max={1000000} step={1} aria-label={`${p.name} ${label}`} value={draft[key]} onChange={e=>change(key,e.target.value)}/></label>)}</div>
  <button onClick={()=>send({type:'allocateStock',id:p.id,...draft})}>引当設定を保存</button>
 </div>;
}
