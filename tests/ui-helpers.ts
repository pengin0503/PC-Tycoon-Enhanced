import type {Page} from '@playwright/test';
/** Shared browser-test steps for the PC Tycoon 2-style flow (develop → launch presentation → review). */
const newGames=new WeakSet<Page>(),teamReady=new WeakSet<Page>(),clocks=new WeakSet<Page>();
export async function startCompany(page:Page){await page.goto('/');await page.getByRole('button',{name:'会社を設立'}).click();newGames.add(page);}
export async function prepareTeam(page:Page){
 if(teamReady.has(page))return;
 await nav(page,'人事');
 for(const role of ['研究','開発','マーケティング'])
  await page.getByRole('button',{name:new RegExp('^'+role+'担当を採用')}).click();
 teamReady.add(page);
}
/** Drives the same pause/play clock a player uses; retired +1/+30 controls are not reintroduced. */
export async function advanceDays(page:Page,days:number){
 if(!clocks.has(page)){try{await page.clock.install();}catch{/* Test may already have installed the clock. */}clocks.add(page);}
 await page.getByRole('button',{name:'1x',exact:true}).click();
 await page.clock.runFor(1000*days);
 await page.getByRole('button',{name:'一時停止'}).click();
}
export async function nav(page:Page,name:string){await page.getByRole('navigation',{name:'ゲームメニュー'}).getByRole('button',{name,exact:true}).click();}
export async function openDesigner(page:Page,category:string){
 if(newGames.has(page))await prepareTeam(page);
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
