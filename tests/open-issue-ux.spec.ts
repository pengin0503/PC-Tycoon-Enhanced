import {test,expect} from '@playwright/test';
import {startCompany,openDesigner,nav,prepareTeam,advanceDays,launchFirst,openProduct,closeDialog} from './ui-helpers';

test('design selling price has precise numeric keyboard entry on narrow screens (#26)',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await startCompany(page);await openDesigner(page,'CPU');
 await page.getByRole('tab',{name:'販売'}).click();
 const price=page.getByRole('spinbutton',{name:'販売価格を直接入力'});
 await expect(price).toBeVisible();
 await price.fill('');await price.pressSequentially('45001');
 await expect(price).toHaveValue('45001');
 await expect(page.getByRole('slider',{name:'販売価格'})).toHaveAttribute('aria-valuetext',/45,001円/);
});
test('portrait notifications do not cover two-row HUD controls (#27)',async({page})=>{
 await page.setViewportSize({width:390,height:844});await startCompany(page);
 await prepareTeam(page);await nav(page,'研究');
 await page.getByRole('button',{name:/CPU 基盤技術 1 を研究/}).click();
 const notice=page.locator('.notice');
 await expect(notice).not.toBeEmpty();
 const position=await page.evaluate(()=>{
  const toast=document.querySelector('.notice')!.getBoundingClientRect();
  const hud=document.querySelector('.hud')!.getBoundingClientRect();
  return {toastTop:toast.top,hudBottom:hud.bottom};
 });
 expect(position.toastTop).toBeGreaterThanOrEqual(position.hudBottom);
});

test('market share filter reports no data instead of falsely showing zero percent (#31)',async({page})=>{
 await startCompany(page);await nav(page,'企業');
 await expect(page.getByTestId('player-market-share')).toHaveText('データなし');
 await page.getByRole('combobox',{name:'シェア集計期間'}).selectOption('30');
 await page.getByRole('combobox',{name:'シェア製品カテゴリ'}).selectOption('cpu');
 await expect(page.getByText(/世界市場のシェアではありません/)).toBeVisible();
 await expect(page.locator('.rival-grid .share').first()).toContainText('データなし');
});

test('product stock allocations persist through the product detail editor (#32)',async({page})=>{
 await startCompany(page);await openDesigner(page,'CPU');
 await page.getByRole('tab',{name:'販売'}).click();
 await page.getByRole('button',{name:'開発を開始'}).click();
 await advanceDays(page,30);
 await launchFirst(page);
 await openProduct(page,'CPU 1');
 await page.getByRole('tab',{name:'在庫配分'}).click();
 const reserved=page.getByRole('spinbutton',{name:'CPU 1 PC組立用引当'});
 await reserved.fill('5');
 await page.getByRole('button',{name:'引当設定を保存'}).click();
 await closeDialog(page);
 await openProduct(page,'CPU 1');
 await page.getByRole('tab',{name:'在庫配分'}).click();
 await expect(page.getByRole('spinbutton',{name:'CPU 1 PC組立用引当'})).toHaveValue('5');
});
