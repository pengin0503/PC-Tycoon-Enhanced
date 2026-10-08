import {test,expect} from '@playwright/test';
import {startCompany,nav,openDesigner} from './ui-helpers';
test('landscape navigation swaps screens and browser Back restores prior screen without dashboard tail',async({page})=>{
 await page.setViewportSize({width:1024,height:600});await startCompany(page);
 await expect(page.getByRole('heading',{name:'稼働状況'})).toBeVisible();
 await nav(page,'開発');
 await expect(page).toHaveURL(/#\/develop$/);
 await expect(page.getByRole('heading',{name:'稼働状況'})).toHaveCount(0);
 await nav(page,'研究');
 await expect(page).toHaveURL(/#\/research$/);
 await page.goBack();await expect(page).toHaveURL(/#\/develop$/);
 await page.getByRole('button',{name:'セーブ・設定'}).click();
 await expect(page.getByRole('button',{name:'JSON書き出し'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('hardware numeric specs use keyboard-accessible bounded sliders and render an interactive preview',async({page})=>{
 await page.setViewportSize({width:844,height:390});await startCompany(page);
 await openDesigner(page,'CPU');
 const core=page.getByRole('slider',{name:'コア数'});
 await expect(core).toHaveValue('4');await core.focus();await page.keyboard.press('ArrowRight');await expect(core).toHaveValue('5');
 await expect(page.getByRole('img',{name:/CPU/}).first()).toBeVisible();
 await expect(page.getByLabel('評価予測')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
