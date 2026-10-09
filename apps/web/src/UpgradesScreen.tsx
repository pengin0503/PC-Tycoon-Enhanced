import {useState} from 'react';
import {offices,managementBalance,distributionBalance,distributionLabels,researchPointBalance} from '../../../packages/content/src/management';
import {hardwareBalance} from '../../../packages/content/src/hardware';
import {distributionCost} from '../../../packages/sim/src/business';
import type {GameState,GameCommand} from '../../../packages/sim/src/index';
import {PanelPages} from './PanelPages';
import {yen} from './i18n';

type Send=(c:GameCommand)=>void;
function Ladder({current,max,label}:{current:number,max:number,label:(i:number)=>string}){
 return <ol className="ladder" aria-label="段階">{Array.from({length:max},(_,i)=><li key={i} className={i+1<current?'past':i+1===current?'current':'future'} title={label(i+1)}><span>{i+1}</span></li>)}</ol>;
}
const factoryCost=(level:number)=>Math.round(managementBalance.factoryUpgrade*level**managementBalance.factoryExponent);

export function UpgradesScreen({state,send}:{state:GameState,send:Send}){
 const office=offices[state.officeLevel-1],nextOffice=offices[state.officeLevel];
 const nextFactory=state.factoryLevel<managementBalance.maxFactoryLevel?state.factoryLevel+1:null;
 const nextStore=state.distributionLevel<distributionBalance.maxLevel?state.distributionLevel+1:null;
 const [budget,setBudget]=useState(state.advertising);
 const capacity=(level:number)=>hardwareBalance.baseFactoryCapacity*level;
 return <section className="screen upgrades-screen"><PanelPages labels={['オフィス','工場','販売店','マーケティング']}>
  <div className="upgrade-panel">
   <header><h2>{office.label}</h2><p>オフィス段階 <b data-testid="office-level">{state.officeLevel} / {offices.length}</b></p></header>
   <Ladder current={state.officeLevel} max={offices.length} label={i=>offices[i-1].label}/>
   <div className="compare-grid"><article><h3>現在</h3><dl><dt>社員枠</dt><dd>{office.staffCapacity}名</dd><dt>研究ポイント</dt><dd>×{(1+researchPointBalance.officeBonus*(state.officeLevel-1)).toFixed(1)}</dd><dt>月額費用</dt><dd>{yen(office.monthlyCost)}</dd></dl></article>
    {nextOffice?<article className="next"><h3>次：{nextOffice.label}</h3><dl><dt>社員枠</dt><dd>{nextOffice.staffCapacity}名</dd><dt>研究ポイント</dt><dd>×{(1+researchPointBalance.officeBonus*state.officeLevel).toFixed(1)}</dd><dt>月額費用</dt><dd>{yen(nextOffice.monthlyCost)}</dd></dl>
     <button className="primary" disabled={state.company.cash<nextOffice.upgradeCost} onClick={()=>send({type:'office',level:state.officeLevel+1})}>オフィスを拡張</button><small>費用 {yen(nextOffice.upgradeCost)}</small></article>
     :<article className="next"><h3>最大段階です</h3></article>}</div>
  </div>
  <div className="upgrade-panel">
   <header><h2>工場</h2><p>工場段階 <b data-testid="factory-level">{state.factoryLevel} / {managementBalance.maxFactoryLevel}</b></p></header>
   <Ladder current={state.factoryLevel} max={managementBalance.maxFactoryLevel} label={i=>`工場 ${i}`}/>
   <div className="compare-grid"><article><h3>現在</h3><dl><dt>生産能力</dt><dd>{capacity(state.factoryLevel)}台/日</dd><dt>維持費</dt><dd>{yen((state.factoryLevel-1)*managementBalance.factoryMonthly)}/月</dd></dl></article>
    {nextFactory?<article className="next"><h3>次：工場 {nextFactory}</h3><dl><dt>生産能力</dt><dd>{capacity(nextFactory)}台/日</dd><dt>維持費</dt><dd>{yen((nextFactory-1)*managementBalance.factoryMonthly)}/月</dd></dl>
     <button className="primary" disabled={state.company.cash<factoryCost(nextFactory)} onClick={()=>send({type:'factory',level:nextFactory})}>工場を拡張</button><small>費用 {yen(factoryCost(nextFactory))}</small></article>
     :<article className="next"><h3>最大段階です</h3></article>}</div>
  </div>
  <div className="upgrade-panel">
   <header><h2>{distributionLabels[state.distributionLevel]}</h2><p>販売網 <b data-testid="distribution-level">{state.distributionLevel} / {distributionBalance.maxLevel}</b></p></header>
   <Ladder current={state.distributionLevel} max={distributionBalance.maxLevel} label={i=>distributionLabels[i]}/>
   <div className="compare-grid"><article><h3>現在</h3><dl><dt>需要</dt><dd>+{Math.round(distributionBalance.demandPerLevel*state.distributionLevel*100)}%</dd><dt>ファン獲得</dt><dd>+{distributionBalance.fansPerLevel*state.distributionLevel}/週</dd><dt>維持費</dt><dd>{yen(distributionBalance.monthlyCost*state.distributionLevel)}/月</dd></dl></article>
    {nextStore?<article className="next"><h3>次：{distributionLabels[nextStore]}</h3><dl><dt>需要</dt><dd>+{Math.round(distributionBalance.demandPerLevel*nextStore*100)}%</dd><dt>ファン獲得</dt><dd>+{distributionBalance.fansPerLevel*nextStore}/週</dd><dt>維持費</dt><dd>{yen(distributionBalance.monthlyCost*nextStore)}/月</dd></dl>
     <button className="primary" disabled={state.company.cash<distributionCost(nextStore)} onClick={()=>send({type:'distribution',level:nextStore})}>販売網を拡大</button><small>費用 {yen(distributionCost(nextStore))}</small></article>
     :<article className="next"><h3>最大段階です</h3></article>}</div>
  </div>
  <div className="upgrade-panel">
   <header><h2>マーケティング</h2><p>認知度 {state.company.awareness.toFixed(0)} / 100 · 評判 {state.company.reputation.toFixed(0)} / 100 · ファン {state.company.fans.toLocaleString('ja-JP')}人</p></header>
   <div className="form-grid"><label>週次広告予算<input type="number" min={0} max={100000000} value={budget} onChange={e=>setBudget(Number(e.target.value))}/></label></div>
   <div className="button-row">{[0,1000000,5000000,20000000].map(v=><button key={v} onClick={()=>setBudget(v)}>{v?yen(v):'停止'}</button>)}<button className="primary" onClick={()=>send({type:'marketing',budget})}>広告予算を設定</button></div>
   <p className="hint">広告は毎週支払われ、認知度・評判・ファンを高めます。マーケティング担当者（カリスマは2倍）が効果を伸ばします。現在の設定：{yen(state.advertising)}/週</p>
  </div>
 </PanelPages></section>;
}
