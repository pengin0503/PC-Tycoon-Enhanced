import {test,expect} from '@playwright/test';
import {createGame} from '../packages/sim/src/index';
import {exportSave} from '../packages/save/src/index';
import {startCompany,openDesigner} from './ui-helpers';
test('UI size persists from 50 to 150 percent with accessible icon-led clock',async({page})=>{
 await page.setViewportSize({width:844,height:390});await page.goto('/');
 await page.getByRole('button',{name:'会社を設立'}).click();
 await expect(page.getByRole('button',{name:'一時停止'})).toHaveText('⏸');
 await expect(page.getByRole('button',{name:'1x'})).toHaveText('▶');
 await page.getByRole('button',{name:'セーブ・設定'}).click();
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
 await startCompany(page);await openDesigner(page,'CPU');
 const button=page.getByRole('button',{name:'IPC相当の解説'});
 await button.click();await expect(page.getByRole('note')).toContainText('1クロック');
 await expect(page.getByRole('slider',{name:'IPC相当'})).toHaveValue('1');
 // The definition never lingers: any other interaction closes it.
 await page.getByRole('heading',{level:2}).first().click();await expect(page.getByRole('note')).toHaveCount(0);
 await button.click();await expect(page.getByRole('note')).toBeVisible();
 await page.getByRole('slider',{name:'クロック'}).focus();await page.keyboard.press('ArrowLeft');await expect(page.getByRole('note')).toHaveCount(0);
 await button.click();await expect(page.getByRole('note')).toBeVisible();
 await page.getByRole('tab',{name:'デザイン'}).click();await expect(page.getByRole('note')).toHaveCount(0);
 await page.getByRole('tab',{name:'仕様'}).click();
 await button.click();await button.click();await expect(page.getByRole('note')).toHaveCount(0);
});
test('the game behaves as an app: no text selection, context menu or page zoom outside text fields',async({page})=>{
 await startCompany(page);
 expect(await page.evaluate(()=>getComputedStyle(document.body).userSelect)).toBe('none');
 const blocked=await page.evaluate(()=>{
  const fire=(target:EventTarget,e:Event)=>{target.dispatchEvent(e);return e.defaultPrevented;};
  const heading=document.querySelector('h2')!;
  return{
   wheelZoom:fire(heading,new WheelEvent('wheel',{ctrlKey:true,deltaY:-100,bubbles:true,cancelable:true})),
   plainWheel:fire(heading,new WheelEvent('wheel',{deltaY:100,bubbles:true,cancelable:true})),
   keyZoom:fire(document.body,new KeyboardEvent('keydown',{key:'+',ctrlKey:true,bubbles:true,cancelable:true})),
   menu:fire(heading,new MouseEvent('contextmenu',{bubbles:true,cancelable:true})),
   select:fire(heading,new Event('selectstart',{bubbles:true,cancelable:true})),
  };
 });
 expect(blocked).toEqual({wheelZoom:true,plainWheel:false,keyZoom:true,menu:true,select:true});
 expect(await page.locator('meta[name=viewport]').getAttribute('content')).toContain('user-scalable=no');
 await page.getByRole('button',{name:'セーブ・設定'}).click();
 const field=page.getByRole('textbox').first();
 expect(await field.evaluate(e=>getComputedStyle(e).userSelect)).toBe('text');
 expect(await field.evaluate(e=>{const ev=new Event('selectstart',{bubbles:true,cancelable:true});e.dispatchEvent(ev);return ev.defaultPrevented;})).toBe(false);
});
test('choice event uses full-screen modal and selected action changes company cash',async({page})=>{
 const s=createGame({id:'choice-ui',name:'イベント社',difficulty:'normal',seed:7});
 s.pendingDecision={id:'supply-boost',title:'追加生産契約',description:'30日の生産能力を上げる',cost:250000};
 await page.goto('/');
 await page.getByLabel('JSON読み込み').setInputFiles({name:'event.json',mimeType:'application/json',buffer:Buffer.from(exportSave(s))});
 await expect(page.getByRole('dialog',{name:'追加生産契約'})).toBeVisible();
 await page.getByRole('button',{name:'投資する'}).click();
 await expect(page.getByRole('dialog')).toHaveCount(0);
 await expect(page.getByTestId('cash')).toHaveText('￥49,750,000');
});
