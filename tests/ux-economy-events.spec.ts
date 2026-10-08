import {test,expect} from '@playwright/test';
import {createGame} from '../packages/sim/src/index';
import {exportSave} from '../packages/save/src/index';
test('UI size persists from 50 to 150 percent with accessible icon-led clock',async({page})=>{
 await page.setViewportSize({width:844,height:390});await page.goto('/');
 await page.getByRole('button',{name:'会社を設立'}).click();
 await expect(page.getByRole('button',{name:'一時停止'})).toHaveText('⏸');
 await expect(page.getByRole('button',{name:'1x'})).toHaveText('▶');
 await page.getByRole('button',{name:'UIサイズ設定'}).click();
 const scale=page.getByRole('slider',{name:'UIサイズ'});
 await scale.focus();await page.keyboard.press('Home');
 await expect(scale).toHaveValue('50');
 await page.keyboard.press('End');
 await expect(scale).toHaveValue('150');
 await expect(page.getByText('150%',{exact:true})).toBeVisible();
 await page.reload();
 await expect(page.getByRole('slider',{name:'UIサイズ'})).toHaveValue('150');
 await expect(page.getByRole('button',{name:'1日進める'})).toBeVisible();
});
test('research inner grid accepts wheel and touch-compatible scrolling in low landscape heights',async({page})=>{
 await page.setViewportSize({width:844,height:390});await page.goto('/');
 await page.getByRole('button',{name:'会社を設立'}).click();
 await page.getByRole('button',{name:'研究',exact:true}).click();
 const results=page.locator('.research-results');
 await expect(results).toBeVisible();
 expect(await results.evaluate(e=>e.scrollHeight>e.clientHeight)).toBe(true);
 await results.evaluate(e=>e.scrollTop=e.scrollHeight);
 expect(await results.evaluate(e=>e.scrollTop)).toBeGreaterThan(0);
});
test('technical definitions are disclosed on demand without editing hardware values',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'会社を設立'}).click();
 await page.getByRole('button',{name:'ハードウェア',exact:true}).click();
 const button=page.getByRole('button',{name:'IPC相当の解説'});
 await button.click();await expect(page.getByRole('note')).toContainText('1クロック');
 await expect(page.getByRole('slider',{name:'IPC相当'})).toHaveValue('1');
});
test('choice event uses full-screen modal and selected action changes company cash',async({page})=>{
 const s=createGame({id:'choice-ui',name:'イベント社',year:2026,difficulty:'normal',seed:7});
 s.pendingDecision={id:'supply-boost',title:'追加生産契約',description:'30日の生産能力を上げる',cost:2500};
 await page.goto('/');
 await page.getByLabel('JSON読み込み').setInputFiles({name:'event.json',mimeType:'application/json',buffer:Buffer.from(exportSave(s))});
 await expect(page.getByRole('dialog',{name:'追加生産契約'})).toBeVisible();
 await page.getByRole('button',{name:'投資する'}).click();
 await expect(page.getByRole('dialog')).toHaveCount(0);
 await expect(page.getByTestId('cash')).toHaveText('￥497,500');
});
