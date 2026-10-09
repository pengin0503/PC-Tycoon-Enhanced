import {test,expect} from '@playwright/test';
import {startCompany,openDesigner,nav,prepareTeam} from './ui-helpers';

test('design selling price has precise numeric keyboard entry on narrow screens (#26)',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await startCompany(page);await openDesigner(page,'CPU');
 await page.getByRole('tab',{name:'販売'}).click();
 const price=page.getByRole('spinbutton',{name:'販売価格を直接入力'});
 await expect(price).toBeVisible();
 await price.fill('45001');
 await expect(page.getByRole('slider',{name:'販売価格'})).toHaveAttribute('aria-valuetext',/45,001円/);
});
test('portrait notifications do not cover two-row HUD controls (#27)',async({page})=>{
 await page.setViewportSize({width:390,height:844});await startCompany(page);
 await prepareTeam(page);await nav(page,'研究');
 await page.getByRole('button',{name:/CPU 基盤技術 1 を研究/}).click();
 const notice=page.locator('.notice');
 await expect(notice).not.toBeEmpty();
 const position=await page.evaluate(()=>{
  const toast=document.querySelector('.notice')!.getBoundingClientRect();
  const hud=document.querySelector('.hud')!.getBoundingClientRect();
  return {toastTop:toast.top,hudBottom:hud.bottom};
 });
 expect(position.toastTop).toBeGreaterThanOrEqual(position.hudBottom);
});
