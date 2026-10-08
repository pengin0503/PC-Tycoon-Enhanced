import {useState} from 'react';
import type {GameState,GameCommand} from '../../../packages/sim/src/index';
import {Logo,logoIds} from './Logo';
import {ja} from './i18n';

const modeLabels={standard:'標準',tycoon:'タイクーン（簡易）',long:'長期',sandbox:'サンドボックス'} as const;
export function SettingsScreen({state,send,uiScale,setUIScale,list,slots,load,download,readFile,newGame}:{state:GameState,send:(c:GameCommand)=>boolean,uiScale:number,setUIScale:(n:number)=>void,
 list:()=>void,slots:{id:string,day:number,name:string}[],load:(id:string)=>void,download:()=>void,readFile:(f?:File)=>void,newGame:()=>void}){
 const [name,setName]=useState(state.company.name);
 const [cash,setCash]=useState(10_000_000);const [rp,setRP]=useState(10000);const [fans,setFans]=useState(100000);
 return <section className="screen settings-screen">
  <section className="card"><h2>セーブ・設定</h2>
   <div className="button-row"><button onClick={list}>{ja.load}</button><button onClick={download}>{ja.export}</button><button className="danger" onClick={newGame}>{ja.newGame}</button></div>
   <label className="file-label">{ja.import}<input type="file" accept="application/json,.json" onChange={e=>{readFile(e.target.files?.[0]);e.target.value='';}}/></label>
   {slots.map(s=><div className="slot" key={s.id}><span>{s.name} · {s.day}日</span><button onClick={()=>load(s.id)}>読み込む</button></div>)}
   <label className="ui-scale-setting">UIサイズ（50～150%）<input aria-label="UIサイズ" type="range" min={50} max={150} step={10} value={uiScale} onChange={e=>setUIScale(Number(e.target.value))}/><output>{uiScale}%</output></label>
   <p className="hint">モード：{modeLabels[state.mode]} · 難易度：{ja[state.difficulty]} · シード {state.initialSeed}</p>
  </section>
  <section className="card"><h2>会社</h2>
   <div className="form-grid"><label>新しい社名<input value={name} maxLength={80} onChange={e=>setName(e.target.value)}/></label></div>
   <button disabled={!name.trim()||name===state.company.name} onClick={()=>send({type:'rename',name})}>社名を変更</button>
   <h3>ロゴ</h3><div className="logo-grid" role="radiogroup" aria-label="ロゴ">{logoIds.map(id=><button key={id} role="radio" aria-checked={state.company.logo===id} aria-label={`ロゴ ${id+1}`} onClick={()=>send({type:'logo',logo:id})}><Logo id={id} size={36}/></button>)}</div>
  </section>
  {state.mode==='sandbox'&&<section className="card"><h2>サンドボックス</h2><div className="form-grid">
   <label>現金<input type="number" min={0} value={cash} onChange={e=>setCash(Number(e.target.value))}/></label>
   <label>研究ポイント<input type="number" min={0} value={rp} onChange={e=>setRP(Number(e.target.value))}/></label>
   <label>ファン<input type="number" min={0} value={fans} onChange={e=>setFans(Number(e.target.value))}/></label></div>
   <button onClick={()=>send({type:'sandbox',cash,researchPoints:rp,fans})}>値を反映</button></section>}
 </section>;
}
export {modeLabels};
