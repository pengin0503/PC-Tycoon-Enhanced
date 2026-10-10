import {test,expect,type Page} from '@playwright/test';
import {createGame,command,type GameState} from '../packages/sim/src/index';
import {exportSave} from '../packages/save/src/index';
import {defaultSpec} from '../packages/content/src/hardware';
import {nav,openDesigner} from './ui-helpers';
import {withTestStaff} from './staff-fixture';
import {unlockBranch} from './research-helpers';

async function load(page:Page,s:GameState){await page.goto('/');await page.getByLabel('JSON読み込み').setInputFiles({name:'s.json',mimeType:'application/json',buffer:Buffer.from(exportSave(s))});}
function lab(){
 const s=withTestStaff(createGame({id:'adv-ui',name:'先端社',difficulty:'normal',seed:4}));
 s.research.completed.push('cpu-compute-1','motherboard-compute-1');s.company.researchPoints=2_000_000;s.company.cash=5_000_000_000;
 s.pendingDecision=null;s.pendingAttack=null;s.offers=[];return s;
}

test('a researched company designs its own CPU socket and then uses it for CPUs',async({page})=>{
 const s=lab();
 for(const [axis,level] of [['cooling',30],['memoryChannels',20]] as const)unlockBranch(s,'cpu',axis,level);
 await load(page,s);await nav(page,'開発');
 // The socket tile starts locked behind its research.
 await page.getByRole('button',{name:'CPUソケットを解放'}).click();
 await page.getByRole('button',{name:'CPUソケットを設計'}).click();
 await expect(page.getByText('SOCKET LAB / CPUソケット')).toBeVisible();
 const name=page.getByLabel('ソケット名');
 await name.fill('atlas');await expect(page.getByRole('alert')).toContainText('すでにあります');
 await expect(page.getByRole('button',{name:/ソケット開発を開始/})).toBeDisabled();
 await name.fill('Helios');
 await page.getByRole('button',{name:/ソケット開発を開始/}).click();
 await expect(name).toHaveValue('Socket 2');
 await page.getByRole('tab',{name:'一覧'}).click();
 await expect(page.locator('table',{hasText:'ソケット一覧'}).locator('tr',{hasText:'Helios'})).toContainText('開発中');
 // Once engineers finish it, CPU designs can pick it.
 await page.getByRole('button',{name:'1x',exact:true}).click();
 await expect(page.locator('table',{hasText:'ソケット一覧'}).locator('tr',{hasText:'Helios'})).toContainText('自社',{timeout:30_000});
 await page.getByRole('button',{name:'一時停止'}).click();
 await page.getByRole('button',{name:'← カテゴリ選択'}).click();
 await expect(page.getByRole('button',{name:'CPUソケットを設計'})).toBeVisible();
 await openDesigner(page,'CPU');
 await expect(page.locator('select').filter({has:page.locator('option',{hasText:'Atlas'})}).locator('option',{hasText:'Helios'})).toHaveCount(1);
});

test('a slider limit links to its research branch, which can be researched several stages at once',async({page})=>{
 await load(page,lab());await openDesigner(page,'CPU');
 await page.getByRole('link',{name:/^コア数の研究を開く/}).click();
 await expect(page).toHaveURL(/#\/research\?category=cpu&axis=cores$/);
 const bulk=page.locator('.bulk-research');
 await expect(bulk).toContainText(/まとめて\d+段階/);
 const count=Number((await page.getByTestId('tech-count').textContent())!.replace(/\D/g,''));
 expect(count).toBeGreaterThan(0);
 const before=await page.getByTestId('rp-balance').textContent();
 await bulk.click();
 await expect(page.getByTestId('rp-balance')).not.toHaveText(before!);
 await expect(page.getByRole('combobox',{name:'系統'})).toHaveValue('cores');
 await expect(bulk).toHaveText(/RP不足|研究完了|まとめて\d+段階/);
});

test('the newest design at its limits is recommended on the research screen',async({page})=>{
 let s=lab();
 s=command(s,{type:'design',kind:'cpu',name:'Polar C1',spec:defaultSpec('cpu'),price:40000});
 await load(page,s);await nav(page,'研究');
 const row=page.getByRole('group',{name:'おすすめの研究'});
 await expect(row.getByRole('button').first()).toContainText('Polar C1');
 await row.getByRole('button').first().click();
 await expect(row.getByRole('button').first()).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.bulk-research')).toBeVisible();
});

test('statistics show monthly sales per kind, unit costs, margins and discontinuation hints',async({page})=>{
 let s=lab();
 s=command(s,{type:'design',kind:'cpu',name:'Polar C1',spec:defaultSpec('cpu'),price:40000});
 s=command(s,{type:'advance',days:35});s=command(s,{type:'launch',id:'p-1'});s=command(s,{type:'line',id:'p-1',target:200});
 s=command(s,{type:'advance',days:95});s.pendingDecision=null;s.pendingAttack=null;s.offers=[];
 // A product sold below its cost is flagged.
 s.products[0].price=s.products[0].unitCost-1;
 await load(page,s);await nav(page,'統計');await page.getByRole('tab',{name:'製品成績'}).click();
 await expect(page.getByTestId('kind-chart')).toBeVisible();
 await expect(page.locator('.stats-screen thead')).toContainText('製造原価');
 await expect(page.locator('.stats-screen thead')).toContainText('粗利率');
 await expect(page.getByTestId('discontinue-hint')).toContainText('原価割れ');
 await page.getByRole('group',{name:'製品成績の種類'}).getByRole('button',{name:'GPU'}).click();
 await expect(page.getByTestId('kind-chart')).toBeVisible();
});
