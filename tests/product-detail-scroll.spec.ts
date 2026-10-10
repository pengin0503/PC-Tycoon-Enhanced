import {test,expect} from '@playwright/test';
import {createGame,command,type GameState} from '../packages/sim/src/index';
import {exportSave} from '../packages/save/src/index';
import {withTestStaff} from './staff-fixture';
import {openProduct} from './ui-helpers';

function launchedCpu():GameState{
 let s=withTestStaff(createGame({id:'scroll-regression',name:'部品社',difficulty:'normal',seed:9}));
 s.research.completed.push('cpu-compute-1');
 s=command(s,{type:'design',kind:'cpu',name:'Polar C1',spec:{cores:1,clock:.8,ipc:1,process:180,l1Cache:.0625,l2Cache:.125,l3Cache:.0625,cooling:40,socket:'Atlas'},price:40000});
 s=command(s,{type:'advance',days:14});
 s=command(s,{type:'launch',id:'p-1'});
 s=command(s,{type:'line',id:'p-1',target:50});
 return s;
}

test('product details keep their tabs and scroll all controls into view on landscape Android',async({page})=>{
 await page.setViewportSize({width:844,height:390});
 await page.goto('/');
 await page.getByLabel('JSON読み込み').setInputFiles({name:'product.json',mimeType:'application/json',buffer:Buffer.from(exportSave(launchedCpu()))});
 await openProduct(page,'Polar C1');
 const dialog=page.getByRole('dialog',{name:'Polar C1'});
 const scroller=dialog.locator('.workspace-content');
 await expect(dialog.getByRole('tab',{name:'概要'})).toBeVisible();
 const geometry=await scroller.evaluate(el=>{
  const pane=el.getBoundingClientRect();
  const dialog=el.closest('[role="dialog"]')!.getBoundingClientRect();
  return {paneBottom:pane.bottom,dialogBottom:dialog.bottom,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight};
 });
 // The scroller must end inside the visible dialog, not underneath the clipped bottom edge.
 expect(geometry.paneBottom).toBeLessThanOrEqual(geometry.dialogBottom-8);
 expect(geometry.scrollHeight).toBeGreaterThan(geometry.clientHeight);
 await scroller.hover();
 await page.mouse.wheel(0,1500);
 await expect.poll(()=>scroller.evaluate(el=>el.scrollTop)).toBeGreaterThan(0);
 await expect(dialog.getByRole('spinbutton',{name:'Polar C1 価格'})).toBeInViewport();
 await expect(dialog.getByRole('slider',{name:'Polar C1 在庫目標'})).toBeInViewport();
 await expect(dialog.getByRole('button',{name:'閉じる'})).toBeInViewport();
 await dialog.getByRole('tab',{name:'仕様'}).click();
 await expect(scroller).toContainText('コア');
 await dialog.getByRole('tab',{name:'概要'}).click();
 expect(await scroller.evaluate(el=>el.scrollTop)).toBe(0);
});
