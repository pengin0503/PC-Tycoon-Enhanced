import {test,expect} from '@playwright/test';
async function skipDecision(page:import('@playwright/test').Page){
 const ignore=page.getByRole('button',{name:'見送る'});
 if(await ignore.isVisible())await ignore.click();
}
test('AI Lab requires manufactured player GPU before model training and deployment',async({page})=>{
 await page.setViewportSize({width:844,height:390});await page.goto('/');
 await page.getByRole('button',{name:'会社を設立'}).click();
 await page.getByRole('button',{name:'AI Lab'}).click();
 await expect(page.getByRole('button',{name:'クラスタを購入'})).toBeDisabled();
 await page.getByRole('button',{name:'研究',exact:true}).click();
 await page.getByRole('button',{name:'AI 基盤技術 1 を研究'}).click();
 await page.getByRole('button',{name:'30日進める'}).click();await skipDecision(page);
 await page.getByRole('button',{name:'GPU 基盤技術 1 を研究'}).click();
 await page.getByRole('button',{name:'30日進める'}).click();await skipDecision(page);
 await page.getByRole('button',{name:'ハードウェア',exact:true}).click();
 await page.getByLabel('製品カテゴリ').selectOption('gpu');
 await page.getByLabel('製品名').fill('Training GPU');
 await page.getByRole('slider',{name:'VRAM容量'}).focus();await page.keyboard.press('End');
 await page.getByRole('button',{name:'設計を開始'}).click();
 await page.getByRole('button',{name:'30日進める'}).click();await skipDecision(page);
 await page.getByRole('tab',{name:'製品一覧'}).click();
 await page.getByRole('button',{name:'発売する'}).click();
 await page.getByRole('button',{name:'生産開始'}).click();
 await page.getByRole('button',{name:'1日進める'}).click();
 await page.getByRole('button',{name:'AI Lab'}).click();
 await page.getByRole('button',{name:'クラスタを購入'}).click();
 await page.getByRole('tab',{name:'モデル開発'}).click();
 await page.getByRole('button',{name:'学習を開始'}).click();
 await page.getByRole('button',{name:'30日進める'}).click();await skipDecision(page);
 await page.getByRole('tab',{name:'モデル一覧'}).click();
 await expect(page.getByTestId('model-status-m-1')).toHaveText('評価完了');
 await page.getByRole('button',{name:'サービスを開始'}).click();
 await page.getByRole('button',{name:'30日進める'}).click();await skipDecision(page);
 await expect(page.getByTestId('ai-revenue-m-1')).not.toHaveText('￥0');
});
