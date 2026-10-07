import {test,expect} from '@playwright/test';
test('research design manufacture and sell from mobile controls',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await page.getByRole('button',{name:'会社を設立'}).click();
 await page.getByRole('button',{name:'研究',exact:true}).click();await page.getByRole('button',{name:'CPU 基盤技術 1 を研究'}).click();
 for(let i=0;i<7;i++)await page.getByRole('button',{name:'1日進める'}).click();
 await page.getByRole('button',{name:'ハードウェア',exact:true}).click();await page.getByLabel('製品名').fill('Polar C1');await page.getByRole('button',{name:'設計を開始'}).click();
 await page.getByRole('button',{name:'30日進める'}).click();await page.getByRole('button',{name:'発売する'}).click();await page.getByRole('button',{name:'生産開始'}).click();await page.getByRole('button',{name:'30日進める'}).click();
 await expect(page.getByTestId('sold-p-1')).not.toHaveText('0');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
