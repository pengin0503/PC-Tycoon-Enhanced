import {test,expect,type Page} from '@playwright/test';
import {createGame,command,type GameState} from '../packages/sim/src/index';
import {exportSave} from '../packages/save/src/index';
import {startCompany,nav,openDesigner} from './ui-helpers';
const cmd=(s:GameState,c:any)=>command(s,c);
async function load(page:Page,s:GameState){await page.goto('/');await page.getByLabel('JSON読み込み').setInputFiles({name:'s.json',mimeType:'application/json',buffer:Buffer.from(exportSave(s))});}
function withOS(){
 let s=createGame({id:'ui-os',name:'OS社',year:2026,difficulty:'normal',seed:9});s.research.completed.push('os-compute-1');
 s=cmd(s,{type:'developOS',name:'Aurora',version:1,features:['files','calculator','browser'],quality:.9,compatibility:.9,support:.8,price:50});
 s=cmd(s,{type:'advance',days:21});return cmd(s,{type:'launch',id:'p-1'});
}
function withCPU(){
 let s=createGame({id:'ui-cpu',name:'部品社',year:2026,difficulty:'normal',seed:9});s.research.completed.push('cpu-compute-1');
 s=cmd(s,{type:'design',kind:'cpu',name:'Polar C1',spec:{cores:4,clock:3,ipc:1,process:14,cache:8,socket:'Atlas'},price:400});
 s=cmd(s,{type:'advance',days:14});s=cmd(s,{type:'launch',id:'p-1'});s=cmd(s,{type:'line',id:'p-1',target:50});return cmd(s,{type:'advance',days:2});
}

test('hacker attack pauses time and the defence minigame resolves it',async({page})=>{
 const s=withOS();s.pendingAttack={osId:'p-1',day:s.day,deadlineDay:s.day+7,targets:12};
 await page.setViewportSize({width:844,height:390});await load(page,s);
 const dialog=page.getByRole('dialog',{name:'不正アクセス警報'});await expect(dialog).toBeVisible();
 await expect(page.getByRole('button',{name:'1x',exact:true})).toBeDisabled();
 await dialog.getByRole('button',{name:'防御を開始'}).click();
 for(let i=1;i<=12;i++){const node=dialog.getByRole('button',{name:`侵入 ${i} を遮断`});await expect(node).toBeEnabled({timeout:4000});await node.click();}
 await expect(dialog.getByRole('status')).toContainText('遮断 12 / 12');
 await dialog.getByRole('button',{name:'結果を確定'}).click();
 await expect(page.getByRole('dialog')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'1x',exact:true})).toBeEnabled();
});

test('bulk offer can be accepted from the companies screen',async({page})=>{
 const s=withCPU();s.offerSeq=1;s.offers=[{id:1,productId:'p-1',buyer:'Helix 物流',quantity:10,unitPrice:350,expiresDay:s.day+14}];
 await load(page,s);await nav(page,'企業');await page.getByRole('tab',{name:/^取引/}).click();
 await expect(page.getByText('Helix 物流')).toBeVisible();await page.getByRole('button',{name:'承諾'}).click();
 await expect(page.getByText('現在、大口取引の打診はありません。',{exact:false})).toBeVisible();
 await expect(page.getByTestId('cash')).toHaveText(new Intl.NumberFormat('ja-JP',{style:'currency',currency:'JPY'}).format(s.company.cash+3500));
});

test('acquisition negotiation shows odds and completes at full valuation',async({page})=>{
 const s=createGame({id:'ui-buy',name:'買収社',year:2026,difficulty:'normal',seed:3});s.company.cash=5_000_000;
 await load(page,s);await nav(page,'企業');
 await page.getByRole('button',{name:'買収交渉'}).first().click();
 const dialog=page.getByRole('dialog',{name:/買収交渉/});
 const offer=dialog.getByRole('slider',{name:'提示額'});await offer.focus();await page.keyboard.press('End');
 await expect(dialog).toContainText('100%');await dialog.getByRole('button',{name:/を提示$/}).click();
 await expect(dialog).toContainText('買収が成立しました');await dialog.getByRole('button',{name:'閉じる'}).last().click();
 await expect(page.getByTestId('competitor-count')).toHaveText('2');
});

test('hard-mode bankruptcy shows the game over screen and allows a new game',async({page})=>{
 const s=createGame({id:'ui-over',name:'倒産社',year:2026,difficulty:'hard',seed:3});s.company.cash=10;
 await load(page,s);await page.getByRole('button',{name:'30日進める'}).click();
 const dialog=page.getByRole('dialog',{name:'ゲームオーバー'});await expect(dialog).toBeVisible();
 await dialog.getByRole('button',{name:'新しいゲーム'}).click();await expect(page.getByRole('button',{name:'会社を設立'})).toBeVisible();
});

test('staff search, distribution upgrade and achievements are reachable',async({page})=>{
 await page.setViewportSize({width:844,height:390});await startCompany(page);
 await nav(page,'人事');await page.getByRole('tab',{name:'人材探し'}).click();await page.getByRole('button',{name:'￥20,000で探す'}).click();
 await page.getByRole('tab',{name:'候補者'}).click();await expect(page.getByRole('button',{name:'採用する'})).toHaveCount(3);
 await nav(page,'アップグレード');await page.getByRole('tab',{name:'販売店'}).click();await page.getByRole('button',{name:'販売網を拡大'}).click();
 await expect(page.getByTestId('distribution-level')).toHaveText('1 / 10');
 await nav(page,'統計');await page.getByRole('tab',{name:'実績'}).click();await expect(page.getByText('獲得実績')).toBeVisible();
});

test('PC builder accepts an explicit PSU and shows game benchmarks',async({page})=>{
 await page.setViewportSize({width:1280,height:720});await startCompany(page);
 await openDesigner(page,'完成PC');
 await page.getByLabel('電源').selectOption('v-psu');
 await expect(page.getByText('ゲーム性能（高設定）')).toBeVisible();
 await page.getByRole('button',{name:'組立設計を開始'}).click();
 await expect(page.getByRole('button',{name:'Polar Station の詳細'})).toBeVisible();
});

test('company rename and logo change from settings',async({page})=>{
 await startCompany(page);await page.getByRole('button',{name:'セーブ・設定'}).click();
 await page.getByLabel('新しい社名').fill('ペンギン電子');await page.getByRole('button',{name:'社名を変更'}).click();
 await expect(page.getByRole('heading',{name:'ペンギン電子'})).toBeVisible();
 await page.getByRole('radio',{name:'ロゴ 8'}).click();await expect(page.getByRole('radio',{name:'ロゴ 8'})).toHaveAttribute('aria-checked','true');
});
