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
 // Games start in 2000: one core, up to 1GHz. Without research the sliders stop at the current limit and the locked
 // headroom (year-2200 technology) is shown next to them as a link to its research.
 const core=page.getByRole('slider',{name:'コア数'});
 await expect(core).toHaveAttribute('aria-valuetext','1コア');
 await expect(page.locator('.range-field',{has:core}).locator('.research-lock')).toContainText('研究で16,384コアまで');
 const clock=page.getByRole('slider',{name:'クロック'});
 await expect(clock).toHaveValue('0.8');await expect(clock).toHaveAttribute('max','1');
 await clock.focus();await page.keyboard.press('End');await page.keyboard.press('ArrowRight');await expect(clock).toHaveValue('1');
 await page.keyboard.press('ArrowLeft');await expect(clock).toHaveValue('0.9');await expect(clock).toHaveAttribute('aria-valuetext','0.9GHz');
 await expect(page.getByTestId('tech-year')).toHaveText('技術水準 2000年相当');
 await expect(page.getByRole('img',{name:/CPU/}).first()).toBeVisible();
 await expect(page.getByLabel('評価予測')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
