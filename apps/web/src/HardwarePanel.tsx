import {PanelPages} from './PanelPages';
import {useState} from 'react';
import {hardwareKinds,unlockedVisualTier,techEffect,type HardwareKind} from '../../../packages/content/src/research';
import {defaultSpec,hardwareCatalog,type Spec} from '../../../packages/content/src/hardware';
import {evaluateHardware} from '../../../packages/sim/src/hardware';
import {visualFinishCost,type VisualChoice} from '../../../packages/sim/src/visual';
import type {GameState,GameCommand} from '../../../packages/sim/src/index';
import {yen} from './i18n';
import {ProductCards} from './ProductCards';
import {ProductIllustration} from './ProductIllustration';
import {RangeField} from './RangeField';

export function HardwarePanel({state,send}:{state:GameState,send:(c:GameCommand)=>void}){
 const [kind,setKind]=useState<HardwareKind>('cpu');
 const [spec,setSpec]=useState<Spec>(defaultSpec('cpu'));
 const [name,setName]=useState('新製品');
 const [price,setPrice]=useState(400);
 const [visual,setVisual]=useState<VisualChoice>({tier:0,color:'graphite'});
 const definition=hardwareCatalog[kind];
 const available=unlockedVisualTier(state.research.completed,kind);
 const tier=Math.min(visual.tier,available);
 const ready=state.research.completed.includes(`${kind}-compute-1`);
 const preview=evaluateHardware(kind,spec,[...state.research.completed,`${kind}-compute-1`]);
 function choose(next:HardwareKind){setKind(next);setSpec(defaultSpec(next));setVisual({tier:0,color:'graphite'});}
 return <PanelPages labels={['設計スタジオ','製品一覧']}><div className="workbench">
  <section className="card product-stage"><p className="eyebrow">DESIGN STUDIO / {kind.toUpperCase()}</p>
   <ProductIllustration kind={kind} tier={tier} color={visual.color} spec={spec}/>
   <h2>{name||definition.label}</h2><p>設計プレビュー · 外観グレード {tier}</p>
   <div className="preview-metrics"><span>性能 <strong>{preview.performance.toLocaleString('ja-JP')}</strong></span>
    <span>消費電力 <strong>{preview.power}</strong></span><span>製造原価 <strong>{yen(preview.unitCost+visualFinishCost(tier))}</strong></span></div>
  </section>
  <section className="card design-controls"><h2>部品を設計する</h2>
   <div className="form-grid"><label>製品カテゴリ<select value={kind} onChange={e=>choose(e.target.value as HardwareKind)}>{hardwareKinds.map(k=><option key={k} value={k}>{hardwareCatalog[k].label}</option>)}</select></label>
   <label>製品名<input maxLength={80} value={name} onChange={e=>setName(e.target.value)}/></label></div>
   <div className="range-grid">{Object.entries(definition.fields).map(([key,field])=>{
    if(field.options)return <label key={key}>{field.label}<select value={spec[key]} onChange={e=>setSpec({...spec,[key]:e.target.value})}>{field.options.map(v=><option key={v} value={v}>{v}</option>)}</select></label>;
    const capacity=['cores','units','vram','slots','capacity','resolution'].includes(key)?techEffect(state.research.completed,kind,'capacity'):0;
    const max=Number(field.max)*(1+capacity);
    const step=field.step??1;const aligned=Math.floor((max-Number(field.min))/step)*step+Number(field.min);
    return <RangeField key={key} label={field.label} min={Number(field.min)} max={Number(aligned.toFixed(5))} step={step} value={Number(spec[key])} onChange={v=>setSpec({...spec,[key]:v})}/>;
   })}</div>
   <div className="visual-editor"><label>外観グレード<select value={tier} onChange={e=>setVisual({...visual,tier:Number(e.target.value)})}>{Array.from({length:available+1},(_,i)=><option value={i} key={i}>グレード {i}{i===0?' · 標準':''}</option>)}</select></label>
   <div className="swatch-row" role="group" aria-label="外装カラー">{(['graphite','silver','teal'] as const).map(color=><button key={color} type="button" className={visual.color===color?'selected':''} aria-pressed={visual.color===color} onClick={()=>setVisual({...visual,color})}>{({graphite:'グラファイト',silver:'シルバー',teal:'ティール'})[color]}</button>)}</div>
   {available===0&&<p>「{kind.toUpperCase()} 外観」研究で追加の形状が解放されます。</p>}</div>
   <RangeField label="販売価格" min={100} max={20000} step={25} value={price} onChange={setPrice} unit="円"/>
   <button className="primary" disabled={!ready||!name.trim()} onClick={()=>send({type:'design',kind,name,spec,price,visual:{...visual,tier}})}>設計を開始</button>
  </section>
 </div><section className="card product-list"><h2>製品ラインアップ</h2><ProductCards state={state} send={send} kinds={[...hardwareKinds]}/></section></PanelPages>;
}
