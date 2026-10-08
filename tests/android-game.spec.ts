import {test,expect} from '@playwright/test';

test('landscape Android game shell exposes fixed controls and mutually exclusive product views',async({page})=>{
 await page.setViewportSize({width:844,height:390});await page.goto('/');
 await page.getByRole('button',{name:'会社を設立'}).click();
 await page.getByRole('button',{name:'ハードウェア',exact:true}).click();
 const game=page.locator('#game-main');
 await expect(game).toHaveAttribute('data-native-scene','true');
 await expect(page.getByRole('tab',{name:'設計スタジオ'})).toHaveAttribute('aria-selected','true');
 await expect(page.getByRole('slider',{name:'コア数'})).toBeVisible();
 await page.getByRole('tab',{name:'製品一覧'}).click();
 await expect(page.getByRole('slider',{name:'コア数'})).toHaveCount(0);
 await page.getByRole('tab',{name:'設計スタジオ'}).click();
 await expect(page.getByRole('slider',{name:'コア数'})).toBeVisible();
 await expect(page.locator('.screen-nav')).toBeInViewport();
 await expect(game).toHaveJSProperty('scrollTop',0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('research lists at most twelve technologies and presents paging without long screen scrolling',async({page})=>{
 await page.setViewportSize({width:960,height:540});await page.goto('/');
 await page.getByRole('button',{name:'会社を設立'}).click();
 await page.getByRole('button',{name:'研究',exact:true}).click();
 const cards=page.locator('[data-testid="research-card"]');
 await expect(cards.first()).toBeVisible();
 expect(await cards.count()).toBeLessThanOrEqual(12);
 await expect(page.getByRole('button',{name:'次の研究ページ'})).toBeVisible();
 await expect(page.locator('.screen-nav')).toBeInViewport();
});
test('large management and AI workspaces provide local subpage navigation without stacking sections',async({page})=>{
 await page.setViewportSize({width:844,height:390});await page.goto('/');
 await page.getByRole('button',{name:'会社を設立'}).click();
 await page.getByRole('button',{name:'経営・市場'}).click();
 await expect(page.getByRole('tab',{name:'設備'})).toHaveAttribute('aria-selected','true');
 await page.getByRole('tab',{name:'人材'}).click();
 await expect(page.getByRole('button',{name:'採用する'})).toBeVisible();
 await expect(page.getByRole('button',{name:'オフィスを拡張'})).toHaveCount(0);
 await page.getByRole('button',{name:'AI Lab'}).click();
 await expect(page.getByRole('tab',{name:'クラスタ'})).toHaveAttribute('aria-selected','true');
 await page.getByRole('tab',{name:'モデル開発'}).click();
 await expect(page.getByRole('button',{name:'学習を開始'})).toBeVisible();
 await expect(page.getByRole('button',{name:'クラスタを購入'})).toHaveCount(0);
});
test('native back event navigates to company without closing active game',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'会社を設立'}).click();
 await page.getByRole('button',{name:'ハードウェア',exact:true}).click();
 await page.evaluate(()=>window.dispatchEvent(new Event('pct:back')));
 await expect(page).toHaveURL(/#\/company$/);
 await expect(page.getByRole('heading',{name:'稼働状況'})).toBeVisible();
});
