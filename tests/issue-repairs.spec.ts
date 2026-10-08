import {test,expect} from '@playwright/test';
import {createGame,command} from '../packages/sim/src/index';
import {exportSave} from '../packages/save/src/index';

function hackerDefenseSave(){
 let state=createGame({id:'hacker-pause',name:'防御試験社',year:2026,difficulty:'normal',seed:12});
 state.research.completed.push('os-compute-1','cpu-compute-1','ai-compute-1');
 state=command(state,{type:'developOS',name:'Shield OS',version:1,features:['files','calculator','browser'],quality:.8,compatibility:.8,support:.7,price:50});
 state=command(state,{type:'advance',days:14});
 state=command(state,{type:'launch',id:'p-1'});
 state.pendingAttack={osId:'p-1',day:state.day,deadlineDay:state.day+14,targets:6};
 return exportSave(state);
}

async function loadHackerDefense(page:import('@playwright/test').Page,startDefense=true){
 await page.goto('/');
 await page.evaluate(async(json)=>{
  const db=await new Promise<IDBDatabase>((resolve,reject)=>{
   const request=indexedDB.open('pc-tycoon-enhanced',1);
   request.onupgradeneeded=()=>{request.result.createObjectStore('saves',{keyPath:'id'});request.result.createObjectStore('meta');};
   request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
  });
  await new Promise<void>((resolve,reject)=>{
   const tx=db.transaction(['saves','meta'],'readwrite');
   tx.objectStore('saves').clear();
   tx.objectStore('saves').put({id:'hacker-pause',json,order:1});
   tx.objectStore('meta').put(1,'counter');
   tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
  });
  db.close();
 },hackerDefenseSave());
 await page.reload();
 const modal=page.getByRole('dialog',{name:'不正アクセス警報'});
 await expect(modal).toBeVisible();
 if(startDefense)await modal.getByRole('button',{name:'防御を開始'}).click();
 return modal;
}
test('notification inbox categorizes and acknowledges durable notices',async({page})=>{
 await page.setViewportSize({width:844,height:390});
 await page.goto('/');await page.getByRole('button',{name:'会社を設立'}).click();
 await page.getByRole('button',{name:'研究',exact:true}).click();
 await page.getByRole('button',{name:'CPU 基盤技術 1 を研究'}).click();
 await page.getByRole('button',{name:'30日進める'}).click();
 const bell=page.getByRole('button',{name:/^通知センター（未読/});
 await expect(bell).toHaveAccessibleName(/未読[1-9][0-9]*件/);
 await bell.click();
 const center=page.getByRole('region',{name:'通知センター'});
 await expect(center).toBeVisible();
 await center.getByRole('button',{name:'研究',exact:true}).click();
 await expect(center).toContainText('CPU');
 await center.getByRole('button',{name:'すべて既読'}).click();
 await expect(page.getByRole('button',{name:'通知センター（未読0件）'})).toBeVisible();
 await center.getByRole('button',{name:'通知センターを閉じる'}).click();
 await page.getByRole('button',{name:'保存',exact:true}).click();
 await expect(page.getByRole('status')).toContainText('保存しました');
 await page.reload();
 await expect(page.getByRole('button',{name:'通知センター（未読0件）'})).toBeVisible();
});

test('hacker defense exposes intrusions that can be blocked',async({page})=>{
 await page.clock.install();
 const modal=await loadHackerDefense(page);
 await page.clock.fastForward(800);
 await expect(modal.locator('.intrusion.active')).toHaveCount(1);
 await modal.locator('.intrusion.active').first().click();
 await expect(modal.locator('.intrusion.blocked')).toHaveCount(1);
});

test('Android Back closes one nested layer before changing screens and preserves mandatory decisions',async({page})=>{
 await page.setViewportSize({width:844,height:390});
 const modal=await loadHackerDefense(page,false);
 await page.evaluate(()=>window.dispatchEvent(new Event('pct:back')));
 await expect(modal).toBeVisible();
 await modal.getByRole('button',{name:'対応しない'}).click();

 const nav=page.getByRole('navigation',{name:'ゲームメニュー'});
 await nav.getByRole('button',{name:'製品'}).click();
 await page.getByRole('button',{name:'Shield OS の詳細'}).click();
 const detail=page.getByRole('dialog',{name:'Shield OS'});
 await expect(detail).toBeVisible();
 await detail.getByRole('tab',{name:'製品・テスト'}).click();
 await detail.getByRole('button',{name:'操作テスト'}).click();
 await expect(detail.getByRole('region',{name:'Shield OS 仮想デスクトップ'})).toBeVisible();
 await page.evaluate(()=>window.dispatchEvent(new Event('pct:back')));
 await expect(detail.getByRole('region',{name:'Shield OS 仮想デスクトップ'})).toHaveCount(0);
 await expect(detail).toBeVisible();
 await page.evaluate(()=>window.dispatchEvent(new Event('pct:back')));
 await expect(detail).toHaveCount(0);
 await expect(page).toHaveURL(/#\/products$/);

 await nav.getByRole('button',{name:'オフィス'}).click();
 await page.getByRole('button',{name:/^通知センター/}).click();
 await expect(page.getByRole('region',{name:'通知センター'})).toBeVisible();
 await page.evaluate(()=>window.dispatchEvent(new Event('pct:back')));
 await expect(page.getByRole('region',{name:'通知センター'})).toHaveCount(0);
 await expect(page).toHaveURL(/#\/home$/);

 await nav.getByRole('button',{name:'開発'}).click();
 await page.getByRole('button',{name:'CPUを設計'}).click();
 await expect(page.getByRole('heading',{name:'新製品を開発'})).toHaveCount(0);
 await page.evaluate(()=>window.dispatchEvent(new Event('pct:back')));
 await expect(page.getByRole('heading',{name:'新製品を開発'})).toBeVisible();

 await nav.getByRole('button',{name:'AI Lab'}).click();
 await page.getByRole('button',{name:'クラスタを構築'}).click();
 await expect(page.getByRole('heading',{name:/クラスタ c-/})).toBeVisible();
 await page.evaluate(()=>window.dispatchEvent(new Event('pct:back')));
 await expect(page.getByRole('button',{name:'クラスタを構築'})).toBeVisible();

 await page.getByRole('button',{name:'セーブ・設定'}).click();
 const name=page.getByLabel('新しい社名');
 await name.focus();
 await page.evaluate(()=>window.dispatchEvent(new Event('pct:back')));
 await expect(name).not.toBeFocused();
 await expect(page).toHaveURL(/#\/settings$/);
});

