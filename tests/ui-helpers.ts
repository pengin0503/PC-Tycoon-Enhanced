import type {Page} from '@playwright/test';
/** Shared browser-test steps for the PC Tycoon 2-style flow (develop → launch presentation → review). */
export async function startCompany(page:Page){await page.goto('/');await page.getByRole('button',{name:'会社を設立'}).click();}
export async function nav(page:Page,name:string){await page.getByRole('navigation',{name:'ゲームメニュー'}).getByRole('button',{name,exact:true}).click();}
export async function openDesigner(page:Page,category:string){
 await nav(page,'開発');
 const unlock=page.getByRole('button',{name:`${category}を解放`});
 if(await unlock.isVisible())await unlock.click();
 await page.getByRole('button',{name:`${category}を設計`}).click();
}
export async function skipDecision(page:Page){const ignore=page.getByRole('button',{name:'見送る'});if(await ignore.isVisible())await ignore.click();}
/** Launches the first waiting product with the given presentation and dismisses the review. */
export async function launchFirst(page:Page,presentation='なし'){
 await nav(page,'製品');
 await page.getByRole('button',{name:'発売する'}).first().click();
 await page.getByRole('radio',{name:new RegExp('^'+presentation)}).click();
 await page.getByRole('button',{name:'この内容で発売'}).click();
 const skip=page.getByRole('button',{name:'スキップ'});
 if(await skip.isVisible())await skip.click();
 await page.getByRole('dialog',{name:'レビュー結果'}).getByRole('button',{name:'閉じる'}).last().click();
}
export async function openProduct(page:Page,name:string){await nav(page,'製品');await page.getByRole('button',{name:`${name} の詳細`}).click();}
export async function closeDialog(page:Page){await page.getByRole('dialog').getByRole('button',{name:'閉じる'}).first().click();}
