import {test,expect} from '@playwright/test';
test('operations expose real facility and hiring costs on mobile',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await page.getByRole('button',{name:'会社を設立'}).click();await page.getByRole('button',{name:'経営・市場'}).click();
 await page.getByRole('button',{name:'オフィスを拡張'}).click();await expect(page.getByTestId('office-level')).toHaveText('2 / 10');
 await page.getByRole('tab',{name:'人材'}).click();await page.getByRole('button',{name:'採用する'}).click();await expect(page.getByTestId('staff-count')).toHaveText('1');await page.getByRole('button',{name:'育成する'}).click();
 await page.getByRole('tab',{name:'資金'}).click();await page.getByLabel('週次広告予算').fill('3000');await page.getByRole('button',{name:'広告予算を設定'}).click();await page.getByRole('button',{name:'30日進める'}).click();
 await page.getByRole('tab',{name:'ライバル'}).click();await expect(page.getByTestId('competitor-count')).toHaveText('3');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
