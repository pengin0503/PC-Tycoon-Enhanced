import {test,expect} from '@playwright/test';
import {startCompany,nav,openDesigner,launchFirst,openProduct,closeDialog} from './ui-helpers';
test('research design launch with a presentation, review, manufacture and sell from mobile controls',async({page})=>{
 await page.setViewportSize({width:390,height:844});await startCompany(page);
 await nav(page,'研究');await page.getByRole('button',{name:'CPU 基盤技術 1 を研究'}).click();
 await openDesigner(page,'CPU');await page.getByRole('tab',{name:'販売'}).click();await page.getByLabel('製品名').fill('Polar C1');await page.getByRole('button',{name:'開発を開始'}).click();
 await page.getByRole('button',{name:'30日進める'}).click();
 await launchFirst(page,'オンライン配信');
 await expect(page.getByRole('button',{name:'Polar C1 の詳細'})).toBeVisible();await expect(page.getByRole('img',{name:/^★/}).first()).toBeVisible();
 await openProduct(page,'Polar C1');await page.getByRole('button',{name:'生産開始'}).click();await closeDialog(page);
 await page.getByRole('button',{name:'30日進める'}).click();
 await expect(page.getByTestId('sold-p-1')).not.toHaveText('0');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('editing a price keeps an empty draft until explicit application',async({page})=>{
 await startCompany(page);await openDesigner(page,'CPU');await page.getByRole('tab',{name:'販売'}).click();await page.getByLabel('製品名').fill('Draft CPU');await page.getByRole('button',{name:'開発を開始'}).click();
 await page.getByRole('button',{name:'30日進める'}).click();await launchFirst(page);await openProduct(page,'Draft CPU');
 const price=page.getByLabel('Draft CPU 価格');await price.fill('');await expect(page.getByRole('alert')).toHaveCount(0);await expect(price).toHaveValue('');await price.fill('300');await page.getByRole('button',{name:'価格を適用'}).click();await expect(price).toHaveValue('300');
});
