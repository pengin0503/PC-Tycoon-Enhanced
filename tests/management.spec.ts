import {test,expect} from '@playwright/test';
import {startCompany,nav,advanceDays} from './ui-helpers';
test('upgrades, hiring, marketing and rivals expose real costs on mobile',async({page})=>{
 await page.setViewportSize({width:390,height:844});await startCompany(page);
 await nav(page,'アップグレード');await page.getByRole('button',{name:'オフィスを拡張'}).click();await expect(page.getByTestId('office-level')).toHaveText('2 / 10');
 await nav(page,'人事');await page.getByRole('button',{name:'採用する'}).first().click();await expect(page.getByTestId('staff-count')).toHaveText('1');
 await page.getByRole('tab',{name:'社員'}).click();await page.getByRole('button',{name:/^育成する/}).click();
 await nav(page,'アップグレード');await page.getByRole('tab',{name:'マーケティング'}).click();await page.getByLabel('週次広告予算').fill('3000');await page.getByRole('button',{name:'広告予算を設定'}).click();await advanceDays(page,30);
 await nav(page,'企業');await expect(page.getByTestId('competitor-count')).toHaveText('9');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
