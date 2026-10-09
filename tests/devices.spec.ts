import {test,expect} from '@playwright/test';
import {startCompany,nav,openDesigner,launchFirst,openProduct,prepareTeam,advanceDays} from './ui-helpers';
test('OS virtual desktop installs, unlocks and runs selected game applications',async({page})=>{
 await startCompany(page);await prepareTeam(page);await nav(page,'研究');
 await page.getByRole('button',{name:'OS 基盤技術 1 を研究'}).click();
 await openDesigner(page,'OS');await page.getByRole('button',{name:'OS開発を開始'}).click();await advanceDays(page,30);
 await launchFirst(page);await openProduct(page,'Aurora');
 await page.getByRole('tab',{name:'製品・テスト'}).click();await page.getByRole('button',{name:'操作テスト'}).click();
 await page.getByRole('button',{name:'インストールをスキップ'}).click();await page.getByRole('button',{name:'ロック解除'}).click();
 await page.getByRole('navigation',{name:'タスクバー'}).getByRole('button',{name:'電卓'}).click();
 await page.getByLabel('左の数').fill('2');await page.getByLabel('右の数').fill('3');await page.getByRole('button',{name:'計算する'}).click();await expect(page.getByTestId('calculator-result')).toHaveText('5');
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
