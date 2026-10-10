import {test,expect,type Page} from '@playwright/test';
import {createGame,command,type GameState} from '../packages/sim/src/index';
import {exportSave} from '../packages/save/src/index';
import {startCompany,nav,openDesigner,openProduct} from './ui-helpers';
import {withTestStaff} from './staff-fixture';
const cmd=(s:GameState,c:any)=>command(s,c);
async function load(page:Page,s:GameState){await page.goto('/');await page.getByLabel('JSON読み込み').setInputFiles({name:'s.json',mimeType:'application/json',buffer:Buffer.from(exportSave(s))});}
function withCPU(){
 let s=withTestStaff(createGame({id:'bf-ui',name:'部品社',difficulty:'normal',seed:9}));s.research.completed.push('cpu-compute-1','gpu-compute-1');
 s=cmd(s,{type:'design',kind:'cpu',name:'Polar C1',spec:{cores:1,clock:.8,ipc:1,process:180,l1Cache:.0625,l2Cache:.125,l3Cache:.0625,cooling:40,socket:'Atlas'},price:40000});
 s=cmd(s,{type:'design',kind:'gpu',name:'Polar G1',spec:{units:2,clock:.2,vram:.032,bandwidth:3,busWidth:64,process:180,cooling:20},price:30000});
 s=cmd(s,{type:'advance',days:45});s=cmd(s,{type:'launch',id:'p-1'});s=cmd(s,{type:'launch',id:'p-2'});
 s=cmd(s,{type:'line',id:'p-1',target:50});s=cmd(s,{type:'advance',days:2});
 // Keep random events out of the way of the screens under test.
 s.pendingDecision=null;s.pendingAttack=null;s.offers=[];return s;
}

test('landscape design screen keeps at least 70% of the height for the design and one-tap actions (#38)',async({page})=>{
 await page.setViewportSize({width:915,height:412});await startCompany(page);await openDesigner(page,'GPU');
 const start=page.getByRole('button',{name:'開発を開始'});await expect(start).toBeInViewport();
 const geometry=await page.evaluate(()=>{
  const top=document.querySelector('.hud')!.getBoundingClientRect().bottom;
  const bars=[document.querySelector('.action-bar')!,document.querySelector('nav[aria-label="ゲームメニュー"]')!].map(e=>e.getBoundingClientRect());
  return {top,bottom:Math.min(...bars.map(b=>b.top)),height:innerHeight,overlap:bars[0].left<bars[1].right&&bars[1].left<bars[0].right};
 });
 expect((geometry.bottom-geometry.top)/geometry.height).toBeGreaterThanOrEqual(.7);
 expect(geometry.overlap).toBe(false);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 // Dock buttons keep their names (labels are visually hidden, not removed) and still switch screens in one tap.
 await nav(page,'製品');await expect(page).toHaveURL(/#\/products$/);
});

test('product statistics can be filtered by product type with per-type totals',async({page})=>{
 await load(page,withCPU());await nav(page,'統計');await page.getByRole('tab',{name:'製品成績'}).click();
 const filter=page.getByRole('group',{name:'製品成績の種類'});
 await filter.getByRole('button',{name:'GPU'}).click();
 const rows=page.locator('.stats-screen tbody tr');
 await expect(rows.first()).toContainText('GPU');
 for(const row of await rows.all())await expect(row.locator('td').nth(1)).toHaveText('GPU');
 await expect(page.getByTestId('product-stats-summary')).toContainText('自社製品1 件');
 await filter.getByRole('button',{name:'すべて'}).click();
 await expect(page.locator('.stats-screen tbody tr',{hasText:'Polar C1'})).toHaveCount(1);
});

test('a product can be discontinued after confirmation, is marked as ended and can be hidden',async({page})=>{
 await load(page,withCPU());await openProduct(page,'Polar C1');
 const dialog=page.getByRole('dialog',{name:'Polar C1'});
 await dialog.getByRole('button',{name:'販売終了…'}).click();
 await dialog.getByRole('group',{name:'販売終了の確認'}).getByRole('button',{name:'販売終了する'}).click();
 await expect(dialog).toContainText('販売終了しました');
 await expect(dialog.getByRole('slider',{name:'Polar C1 在庫目標'})).toHaveCount(0);
 await dialog.getByRole('button',{name:'閉じる'}).first().click();
 const toggle=page.getByRole('button',{name:/^販売終了 1/});
 await expect(toggle).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.product-card.ended')).toContainText('販売終了');
 await toggle.click();
 await expect(page.getByRole('button',{name:'Polar C1 の詳細'})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Polar G1 の詳細'})).toBeVisible();
});

test('research is listed per specification branch with Japanese names',async({page})=>{
 await load(page,withCPU());await nav(page,'研究');
 await page.getByRole('group',{name:'研究分野'}).getByRole('button',{name:/^CPU/}).click();
 await page.getByLabel('系統').selectOption({label:'コア数'});
 const cards=page.getByTestId('research-card');
 await expect(cards.first()).toContainText('CPU コア数 第1段階');
 await expect(cards.first()).toContainText('コア数上限 2コア');
 for(const card of await cards.all())await expect(card.locator('h3')).toHaveText(/^CPU コア数 第\d+段階$/);
 await page.getByLabel('表示').selectOption('all');
 await expect(page.getByText('前提：CPU コア数 第1段階 / CPU 基盤技術')).toBeVisible();
 await expect(page.locator('body')).not.toContainText('cpu-');
});
