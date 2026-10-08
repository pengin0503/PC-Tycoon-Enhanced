import {PriceEditor,ProductionEditor} from './ProductEditors';
import { t as uiText } from './i18n';
import type { GameState, GameCommand } from '../../../packages/sim/src/index';
import { productCatalog } from '../../../packages/content/src/devices';
import { yen } from './i18n';
import { ProductVisual } from './ProductVisual';
export function ProductCards({ state, send, kinds }: {
    state: GameState;
    send: (c: GameCommand) => void;
    kinds: string[];
}) {
    return <div className="grid-list">{state.products.filter(p => kinds.includes(p.kind)).map(p => <article className="card" key={p.id}><h3>{p.name} <span className="pill">{productCatalog[p.kind].label}</span></h3><ProductVisual product={p}/><p>{uiText("ui_2fa6f4840362")}{p.performance}{uiText("ui_1820323a7ea3")}{yen(p.unitCost)}{uiText("ui_c5cdaef5d665")}{p.power}</p><p>{uiText("ui_658b13fe06be")}{p.remaining.toFixed(1)}{uiText("ui_8409c9c1e7b0")}{p.inventory}{uiText("ui_18dc417e0cbe")}<b data-testid={`sold-${p.id}`}>{p.sold}</b></p><p>{uiText("ui_dbe914179fc2")}{yen(p.revenue)}{uiText("ui_02aee73f5562")}{yen(p.profit)}</p>{p.remaining > 0 ? <progress max={20} value={20 - p.remaining}/> : !p.launched ? <button onClick={() => send({ type: 'launch', id: p.id })}>{uiText("ui_c336a7c01701")}</button> : p.kind !== 'os' && <ProductionEditor product={p} send={send}/>}<PriceEditor product={p} send={send}/></article>)}</div>;
}
