import {test,expect} from '@playwright/test';
test('AI Lab trains and commercializes a fictional model on mobile',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await page.getByRole('button',{name:'会社を設立'}).click();await page.getByRole('button',{name:'研究',exact:true}).click();await page.getByRole('button',{name:'AI 基盤技術 1 を研究'}).click();await page.getByRole('button',{name:'30日進める'}).click();
 await page.getByRole('button',{name:'AI Lab'}).click();await page.getByRole('button',{name:'クラスタを購入'}).click();await page.getByRole('tab',{name:'モデル開発'}).click();await page.getByRole('button',{name:'学習を開始'}).click();await page.getByRole('button',{name:'30日進める'}).click();
 await page.getByRole('tab',{name:'モデル一覧'}).click();await expect(page.getByTestId('model-status-m-1')).toHaveText('評価完了');await page.getByRole('button',{name:'サービスを開始'}).click();await page.getByRole('button',{name:'30日進める'}).click();await expect(page.getByTestId('ai-revenue-m-1')).not.toHaveText('￥0');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
