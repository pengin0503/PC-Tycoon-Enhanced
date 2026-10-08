import {test,expect} from '@playwright/test';
test('landscape navigation swaps screens and browser Back restores prior screen without dashboard tail',async({page})=>{
 await page.setViewportSize({width:1024,height:600});await page.goto('/');await page.getByRole('button',{name:'会社を設立'}).click();
 await expect(page.getByRole('heading',{name:'稼働状況'})).toBeVisible();
 await page.getByRole('button',{name:'ハードウェア',exact:true}).click();
 await expect(page).toHaveURL(/#\/hardware$/);
 await expect(page.getByRole('heading',{name:'稼働状況'})).toHaveCount(0);
 await page.getByRole('button',{name:'研究',exact:true}).click();
 await expect(page).toHaveURL(/#\/research$/);
 await page.goBack();await expect(page).toHaveURL(/#\/hardware$/);
 await page.getByRole('button',{name:'セーブ・設定'}).click();
 await expect(page.getByRole('button',{name:'JSON書き出し'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('hardware numeric specs use keyboard-accessible bounded sliders and render an interactive preview',async({page})=>{
 await page.setViewportSize({width:844,height:390});await page.goto('/');await page.getByRole('button',{name:'会社を設立'}).click();
 await page.getByRole('button',{name:'ハードウェア',exact:true}).click();
 const core=page.getByRole('slider',{name:'コア数'});
 await expect(core).toHaveValue('4');await core.focus();await page.keyboard.press('ArrowRight');await expect(core).toHaveValue('5');
 await expect(page.getByRole('img',{name:/CPU/}).first()).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
