import {test,expect} from '@playwright/test';
import {createGame,command} from '../packages/sim/src/index';
import {exportSave} from '../packages/save/src/index';
import {nav,openDesigner,launchFirst,openProduct,closeDialog,skipDecision,advanceDays} from './ui-helpers';
import {withTestStaff} from './staff-fixture';
import {researchTo,frontierSpec} from './research-helpers';
import {evaluateHardware} from '../packages/sim/src/hardware';
/** Designs the best GPU the research allows (language models need GPUs from around the 2030s). */
function frontierGPU(s:any,name:string){
 const spec=frontierSpec('gpu',s.research.completed);
 while(evaluateHardware('gpu',spec,s.research.completed,{stored:true}).power>Number(spec.cooling)&&Number(spec.units)>1)
  spec.units=Number(spec.units)/2;
 return command(s,{type:'design',kind:'gpu',name,spec,price:evaluateHardware('gpu',spec,s.research.completed).unitCost*2} as any);
}
test('switching a slimmed MoE design back to Dense refits the model shape',async({page})=>{
 let s:any=withTestStaff(createGame({id:'moe',name:'AI社',difficulty:'normal',seed:3}),true);s.company.cash=100_000_000_000;
 s.day=100*360;s.year=2100;s.research.completed.push('ai-compute-1','ai-architecture-1');researchTo(s,'gpu',.6);
 s=frontierGPU(s,'Big');
 s=command(s,{type:'advance',days:14});s=command(s,{type:'launch',id:'p-1'});s=command(s,{type:'line',id:'p-1',target:50});s=command(s,{type:'advance',days:2});
 s=command(s,{type:'buyCluster',gpuId:'p-1',serverId:'vendor',gpus:2,network:.8,cooling:.9});
 await page.setViewportSize({width:844,height:390});await page.goto('/');
 await page.getByLabel('JSON読み込み').setInputFiles({name:'s.json',mimeType:'application/json',buffer:Buffer.from(exportSave(s))});
 await nav(page,'AI Lab');await page.getByRole('button',{name:'AIモデルを設計'}).click();
 await page.getByRole('slider',{name:'総パラメータ'}).focus();await page.keyboard.press('End');
 await page.getByLabel('アーキテクチャ').selectOption('moe');
 await page.getByRole('slider',{name:'稼働パラメータ'}).focus();for(let i=0;i<3;i++)await page.keyboard.press('ArrowLeft');
 await expect(page.getByRole('slider',{name:'稼働パラメータ'})).toHaveAttribute('aria-valuetext','1B');
 await page.getByLabel('アーキテクチャ').selectOption('dense');
 await expect(page.getByRole('alert')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'学習を開始'})).toBeEnabled();
});
test('a service context length saved outside the slider list is shown as saved',async({page})=>{
 let s:any=withTestStaff(createGame({id:'ctx',name:'AI社',difficulty:'normal',seed:3}),true);s.company.cash=100_000_000_000;
 s.day=35*360;s.year=2035;s.research.completed.push('ai-compute-1');researchTo(s,'gpu',.35);
 s=frontierGPU(s,'G');
 s=command(s,{type:'advance',days:14});s=command(s,{type:'launch',id:'p-1'});s=command(s,{type:'line',id:'p-1',target:50});s=command(s,{type:'advance',days:2});
 s=command(s,{type:'buyCluster',gpuId:'p-1',serverId:'vendor',gpus:1,network:.8,cooling:.9});
 const design={architecture:'dense',total:1e9,active:1e9,layers:24,hidden:2048,attention:'standard',context:4096,tokens:1e9,quality:.8,diversity:.8};
 s=command(s,{type:'trainModel',name:'Legacy',design,clusterId:'c-1',budget:1e9} as any);s=command(s,{type:'advance',days:7});
 s=command(s,{type:'deployModel',id:'m-1',clusterId:'c-1',bits:16,context:3000,batch:1,mode:'api',apiPrice:1000,subscriptionPrice:500} as any);
 await page.setViewportSize({width:844,height:390});await page.goto('/');
 await page.getByLabel('JSON読み込み').setInputFiles({name:'s.json',mimeType:'application/json',buffer:Buffer.from(exportSave(s))});
 await nav(page,'AI Lab');await page.getByRole('tab',{name:'モデル'}).click();await page.getByRole('button',{name:'サービスを変更'}).click();
 const context=page.getByRole('slider',{name:'推論コンテキスト長'});
 await expect(context).toHaveAttribute('aria-valuetext','3,000トークン');
 await context.focus();await page.keyboard.press('ArrowRight');await expect(context).toHaveAttribute('aria-valuetext','4Kトークン');
});
test('AI Lab requires manufactured player GPU before model training and deployment',async({page})=>{
 // Year-2000 GPUs are far too small for language models: start from a company whose GPU research reached the 2030s.
 const s=researchTo(withTestStaff(createGame({id:'lab',name:'AI社',difficulty:'normal',seed:3})),'gpu',.35);
 s.company.cash=100_000_000_000;s.company.researchPoints=100_000;
  // The UI must honor the release-year gate for Transformer research.
  s.day=17*360;s.year=2017;
 await page.setViewportSize({width:844,height:390});await page.goto('/');
 await page.getByLabel('JSON読み込み').setInputFiles({name:'s.json',mimeType:'application/json',buffer:Buffer.from(exportSave(s))});
 await nav(page,'AI Lab');
 await expect(page.getByRole('button',{name:'AI Labを解放'})).toBeVisible();
 await expect(page.getByRole('button',{name:'AIモデルを設計'})).toBeDisabled();
 await nav(page,'研究');
 await page.getByRole('button',{name:'AI Transformer 基盤技術 を研究'}).click();
 await advanceDays(page,30);await skipDecision(page);
 // Without a manufactured GPU the cluster builder explains what is missing instead of buying.
 await nav(page,'人事');await page.getByRole('button',{name:/^AI担当を採用/}).click();
 await nav(page,'AI Lab');await page.getByRole('button',{name:'クラスタを構築'}).click();
 await expect(page.getByRole('alert')).toContainText('製造中の自社GPUがありません');
 await expect(page.getByRole('button',{name:'クラスタを購入'})).toBeDisabled();
 await openDesigner(page,'GPU');
 for(const name of ['クロック','VRAM容量','メモリ帯域','冷却性能']){await page.getByRole('slider',{name}).focus();await page.keyboard.press('End');}
 // Keep units moderate so the physically simulated power does not exceed cooling capacity.
 const units=page.getByRole('slider',{name:'演算ユニット'});await units.focus();await page.keyboard.press('Home');for(let i=0;i<5;i++)await page.keyboard.press('ArrowRight');
 await page.getByRole('slider',{name:'製造プロセス'}).focus();await page.keyboard.press('Home');
 await page.getByRole('tab',{name:'販売'}).click();await page.getByLabel('製品名').fill('Training GPU');
 await page.getByRole('button',{name:'開発を開始'}).click();
 await advanceDays(page,30);await skipDecision(page);
 await launchFirst(page);
 await openProduct(page,'Training GPU');await page.getByRole('button',{name:'生産開始'}).click();await closeDialog(page);
 await advanceDays(page,1);
 await advanceDays(page,1); // first day may be weekly sale; next day restores physical inventory
 await nav(page,'AI Lab');
 await page.getByRole('button',{name:'クラスタを構築'}).click();
 // A second GPU leaves headroom for training memory.
 await page.getByRole('slider',{name:'GPU枚数'}).focus();await page.keyboard.press('ArrowRight');
 await page.getByRole('button',{name:'クラスタを購入'}).click();
 await page.getByRole('button',{name:'AIモデルを設計'}).click();
 await expect(page.getByRole('alert')).toHaveCount(0);
 await page.getByRole('button',{name:'学習を開始'}).click();
 // Decisions can pause the clock before the requested 30 days have elapsed.
 for(let attempt=0;attempt<8;attempt++){
  await advanceDays(page,30);await skipDecision(page);
  await page.getByRole('tab',{name:'モデル'}).click();
  if((await page.getByTestId('model-status-m-1').textContent())==='評価完了')break;
 }
 await expect(page.getByTestId('model-status-m-1')).toHaveText('評価完了');
 await page.getByRole('button',{name:'サービスを設定'}).click();
 await page.getByRole('button',{name:'サービスを開始'}).click();
 await advanceDays(page,30);await skipDecision(page);
 await page.getByRole('tab',{name:'モデル'}).click();
 await expect(page.getByTestId('ai-revenue-m-1')).not.toHaveText('￥0');
});
