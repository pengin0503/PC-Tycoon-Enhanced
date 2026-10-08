import {test,expect} from '@playwright/test';
import {startCompany,nav,openDesigner} from './ui-helpers';

test('landscape Android game shell exposes fixed controls and mutually exclusive designer views',async({page})=>{
 await page.setViewportSize({width:844,height:390});await startCompany(page);
 await openDesigner(page,'CPU');
 const game=page.locator('#game-main');
 await expect(game).toHaveAttribute('data-native-scene','true');
 await expect(page.getByRole('tab',{name:'仕様'})).toHaveAttribute('aria-selected','true');
 await expect(page.getByRole('slider',{name:'コア数'})).toBeVisible();
 await page.getByRole('tab',{name:'デザイン'}).click();
 await expect(page.getByRole('slider',{name:'コア数'})).toHaveCount(0);
 await page.getByRole('tab',{name:'仕様'}).click();
 await expect(page.getByRole('slider',{name:'コア数'})).toBeVisible();
 await expect(page.locator('.screen-nav')).toBeInViewport();
 await expect(page.getByRole('button',{name:'開発を開始'})).toBeInViewport();
 await expect(game).toHaveJSProperty('scrollTop',0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('research lists at most twelve technologies and presents paging without long screen scrolling',async({page})=>{
 await page.setViewportSize({width:960,height:540});await startCompany(page);
 await nav(page,'研究');
 const cards=page.locator('[data-testid="research-card"]');
 await expect(cards.first()).toBeVisible();
 expect(await cards.count()).toBeLessThanOrEqual(12);
 await expect(page.getByRole('button',{name:'次の研究ページ'})).toBeVisible();
 await expect(page.locator('.screen-nav')).toBeInViewport();
});
test('upgrade and AI workspaces provide local subpage navigation without stacking sections',async({page})=>{
 await page.setViewportSize({width:844,height:390});await startCompany(page);
 await nav(page,'アップグレード');
 await expect(page.getByRole('tab',{name:'オフィス'})).toHaveAttribute('aria-selected','true');
 await page.getByRole('tab',{name:'工場'}).click();
 await expect(page.getByRole('button',{name:'工場を拡張'})).toBeVisible();
 await expect(page.getByRole('button',{name:'オフィスを拡張'})).toHaveCount(0);
 await nav(page,'AI Lab');
 await expect(page.getByRole('tab',{name:'開発'})).toHaveAttribute('aria-selected','true');
 await expect(page.getByRole('button',{name:'AIモデルを設計'})).toBeVisible();
 await page.getByRole('tab',{name:'クラスタ'}).click();
 await expect(page.getByText('クラスタがありません。')).toBeVisible();
 await expect(page.getByRole('button',{name:'AIモデルを設計'})).toHaveCount(0);
});
test('native back event navigates to the office without closing active game',async({page})=>{
 await startCompany(page);await nav(page,'開発');
 await page.evaluate(()=>window.dispatchEvent(new Event('pct:back')));
 await expect(page).toHaveURL(/#\/(home)?$/);
 await expect(page.getByRole('heading',{name:'稼働状況'})).toBeVisible();
});
