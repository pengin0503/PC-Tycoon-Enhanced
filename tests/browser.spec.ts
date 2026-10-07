import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
test('company shell saves resumes and imports safely',async({page})=>{
 await page.goto('/');await page.getByLabel('社名').fill('北極テック');await page.getByRole('button',{name:'会社を設立'}).click();
 await expect(page.getByRole('heading',{name:'北極テック'})).toBeVisible();
 await page.getByRole('button',{name:'30日進める'}).click();await expect(page.getByTestId('day')).toHaveText('30');await expect(page.getByTestId('cash')).toHaveText('￥488,000');
 await page.getByRole('button',{name:'保存',exact:true}).click();await expect(page.getByRole('status')).toContainText('保存しました');
 await page.reload();await expect(page.getByTestId('day')).toHaveText('30');
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'JSON書き出し'}).click();const exported=await download;expect(exported.suggestedFilename()).toContain('.json');
 const buffer=await readFile((await exported.path())!);await page.getByRole('button',{name:'1日進める'}).click();
 await page.getByLabel('JSON読み込み').setInputFiles({name:'good.json',mimeType:'application/json',buffer});await expect(page.getByTestId('day')).toHaveText('30');
 await page.getByLabel('JSON読み込み').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{')});
 await expect(page.getByRole('alert')).toBeVisible();await expect(page.getByTestId('cash')).toHaveText('￥488,000');
});
test('hidden page never accumulates real time and visible speed is bounded',async({page})=>{
 await page.clock.install();await page.goto('/');await page.getByRole('button',{name:'会社を設立'}).click();
 await page.getByRole('button',{name:'1x',exact:true}).click();
 await page.evaluate(()=>Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true}));
 await page.clock.fastForward(5000);await expect(page.getByTestId('day')).toHaveText('0');
 await page.evaluate(()=>Object.defineProperty(document,'visibilityState',{value:'visible',configurable:true}));
 await page.clock.fastForward(1000);await expect(page.getByTestId('day')).toHaveText('1');
});
test('mobile forms fit and keyboard activates time controls',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await page.getByRole('button',{name:'会社を設立'}).click();
 await page.getByRole('button',{name:'1日進める'}).focus();await page.keyboard.press('Enter');await expect(page.getByTestId('day')).toHaveText('1');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
