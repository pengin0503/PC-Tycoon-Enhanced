import {test,expect} from '@playwright/test';
test('OS virtual desktop runs selected game applications',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'会社を設立'}).click();await page.getByRole('button',{name:'研究',exact:true}).click();
 await page.getByRole('button',{name:'OS 基盤技術 1 を研究'}).click();await page.getByRole('button',{name:'30日進める'}).click();
 await page.getByRole('button',{name:'OS',exact:true}).click();await page.getByRole('button',{name:'OS開発を開始'}).click();await page.getByRole('button',{name:'30日進める'}).click();
 await page.getByRole('button',{name:'発売する'}).click();await page.getByRole('button',{name:'操作テスト'}).click();await page.getByRole('button',{name:'電卓'}).click();
 await page.getByLabel('左の数').fill('2');await page.getByLabel('右の数').fill('3');await page.getByRole('button',{name:'計算する'}).click();await expect(page.getByTestId('calculator-result')).toHaveText('5');
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
