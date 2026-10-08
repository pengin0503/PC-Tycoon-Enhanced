import {PanelPages} from './PanelPages';
import {useState} from 'react';
import {vendorParts} from '../../../packages/content/src/devices';
import {evaluateDevice} from '../../../packages/sim/src/devices';
import {priceRange} from '../../../packages/sim/src/pricing';
import {yen} from './i18n';
import {unlockedVisualTier} from '../../../packages/content/src/research';
import type {GameState,GameCommand} from '../../../packages/sim/src/index';
import {ProductIllustration} from './ProductIllustration';
import {RangeField} from './RangeField';
import {ProductCards} from './ProductCards';
export function DevicesPanel({state,send}:{state:GameState,send:(c:GameCommand)=>void}){
 const [kind,setKind]=useState<'pc'|'laptop'>('pc');
 const [name,setName]=useState('Polar Station');
 const [purpose,setPurpose]=useState<'gaming'|'office'|'server'>('gaming');
 const [appearance,setAppearance]=useState<'graphite'|'silver'|'teal'>('graphite');
 const [tier,setTier]=useState(0);
 const [price,setPrice]=useState(3000);
 const [osId,setOS]=useState('');
 const [parts,setParts]=useState({cpu:'v-cpu',gpu:'v-gpu',motherboard:'v-board',ram:'v-ram',storage:'v-storage'});
 const available=unlockedVisualTier(state.research.completed,kind);
 const visualTier=Math.min(tier,available);
 const competitorParts=state.rivals.filter(r=>!r.acquired).flatMap(r=>r.products.filter(p=>p.remaining===0&&p.launched).map(p=>({...p,supplier:r.name})));
 const estimate=(()=>{try{return evaluateDevice(state,parts,purpose,kind,osId||undefined);}catch{return null;}})();
 const range=estimate?priceRange({kind,unitCost:estimate.unitCost,performance:estimate.performance,reliability:estimate.reliability,visual:{tier:visualTier}}):{min:1,max:1000000};
 const currentPrice=Math.max(range.min,Math.min(range.max,price));
 return <PanelPages labels={['設計スタジオ','製品一覧']}><div className="workbench">
  <section className="card product-stage"><p className="eyebrow">PRODUCT STUDIO / {kind.toUpperCase()}</p><ProductIllustration kind={kind} color={appearance} tier={visualTier}/>
   <h2>{name}</h2><p>{purpose.toUpperCase()} · 外観グレード {visualTier}</p></section>
  <section className="card design-controls"><h2>完成PC・ノートPC設計</h2>
   <div className="form-grid"><label>端末<select value={kind} onChange={e=>{setKind(e.target.value as typeof kind);setTier(0);}}><option value="pc">完成PC</option><option value="laptop">ノートPC</option></select></label><label>製品名<input value={name} onChange={e=>setName(e.target.value)}/></label>
   <label>用途<select value={purpose} onChange={e=>setPurpose(e.target.value as typeof purpose)}><option value="gaming">ゲーミング</option><option value="office">業務</option><option value="server">サーバー</option></select></label>
   <label>外装カラー<select value={appearance} onChange={e=>setAppearance(e.target.value as typeof appearance)}><option value="graphite">グラファイト</option><option value="silver">シルバー</option><option value="teal">ティール</option></select></label>
   <label>外観グレード<select value={visualTier} onChange={e=>setTier(Number(e.target.value))}>{Array.from({length:available+1},(_,i)=><option value={i} key={i}>グレード {i}</option>)}</select></label>
   {Object.entries(parts).map(([k,id])=><label key={k}>{k.toUpperCase()}<select value={id} onChange={e=>setParts({...parts,[k]:e.target.value})}>{[...vendorParts,...state.products.filter(p=>p.remaining===0),...competitorParts].filter(p=>p.kind===k).map(p=><option key={p.id} value={p.id}>{'supplier' in p ? `${p.supplier} · ${p.name}（${yen(p.price)} / 在庫${p.inventory}）` : p.name}</option>)}</select></label>)}
   <label>OS<select value={osId} onChange={e=>setOS(e.target.value)}><option value="">OSなし</option>{state.products.filter(p=>p.kind==='os'&&p.launched).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label></div>
   <RangeField label="販売価格" min={range.min} max={range.max} step={1} value={currentPrice} onChange={setPrice} unit="円"/>
   <p>性能・品質に基づく販売価格範囲：{yen(range.min)}～{yen(range.max)}。競合部品は製造時に在庫を調達します。</p>
   {!estimate&&<p role="alert">部品のソケット、メモリ規格または供給元を確認してください。</p>}
   <button className="primary" disabled={!estimate||!state.research.completed.includes(`${kind}-compute-1`)} onClick={()=>send({type:'assemble',kind,name,parts,purpose,appearance,price:currentPrice,...(osId?{osId}:{}),visual:{tier:visualTier,color:appearance}})}>組立設計を開始</button>
  </section></div><section className="card product-list"><h2>端末ラインアップ</h2><ProductCards state={state} send={send} kinds={['pc','laptop','monitor']}/></section></PanelPages>;
}
