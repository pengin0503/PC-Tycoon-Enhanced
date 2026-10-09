import {activeTechCatalog} from '../packages/content/src/research';
import {advanceDays} from './ui-helpers';
import {test,expect} from '@playwright/test';
test('all research is searchable paged and financial history is visible at 320px',async({page})=>{
 await page.setViewportSize({width:320,height:800});await page.goto('/');await page.getByRole('button',{name:'会社を設立'}).click();await page.getByRole('button',{name:'研究',exact:true}).click();
 await expect(page.getByTestId('tech-count')).toHaveText(String(activeTechCatalog.length));await page.getByLabel('表示').selectOption('all');await page.getByLabel('技術を検索').fill('第10世代');await expect(page.getByTestId('research-page')).toContainText('1');await page.getByRole('button',{name:'次の研究ページ'}).click();await expect(page.getByTestId('research-page')).toContainText('2');
 await advanceDays(page,30);await page.getByRole('button',{name:'統計',exact:true}).click();await expect(page.getByRole('img',{name:'月次現金推移'})).toBeVisible();await expect(page.getByTestId('finance-months')).toHaveText('1');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
