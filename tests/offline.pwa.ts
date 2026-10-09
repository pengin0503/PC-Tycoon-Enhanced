import {advanceDays} from './ui-helpers';
import {test,expect} from '@playwright/test';
test('production shell starts saves and transfers games offline on mobile',async({page,context,request})=>{
 await request.post('/__revision?value=initial');await page.setViewportSize({width:390,height:844});await page.goto('/');
 const manifest=await request.get('/manifest.webmanifest');expect(manifest.ok()).toBe(true);
 const data=await manifest.json();expect(data.display).toBe('standalone');expect(data.start_url).toBe('./');
 for(const icon of data.icons){const response=await request.get('/'+icon.src);expect(response.ok()).toBe(true);
  const size=await page.evaluate(async(src:string)=>{const image=new Image();image.src='/'+src;await image.decode();return image.naturalWidth;},icon.src);expect(size).toBe(Number(icon.sizes.split('x')[0]));
 }
 await page.evaluate(async()=>{await navigator.serviceWorker.ready});
 await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
 await context.setOffline(true);await page.reload();
 await page.getByLabel('社名').fill('オフライン企業');await page.getByRole('button',{name:'会社を設立'}).click();
 await advanceDays(page,30);await expect(page.getByTestId('day')).toHaveText('30');
 await page.getByRole('button',{name:'保存',exact:true}).click();await expect(page.getByRole('status')).toContainText('保存');
 await page.reload();await expect(page.getByRole('heading',{name:'オフライン企業'})).toBeVisible();await expect(page.getByTestId('day')).toHaveText('30');
 const fonts=await page.evaluate(async()=>{await document.fonts.ready;return Array.from(document.fonts).some(f=>f.family.includes('Noto Sans JP')&&f.status==='loaded')});expect(fonts).toBe(true);
 await page.getByRole('button',{name:'セーブ・設定'}).click();
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'JSON書き出し'}).click();const file=await download;const path=await file.path();expect(path).toBeTruthy();
 await advanceDays(page,1);await expect(page.getByTestId('day')).toHaveText('31');
 await page.getByLabel('JSON読み込み').setInputFiles(path!);await expect(page.getByTestId('day')).toHaveText('30');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('partial update retains working shell; successful update preserves IndexedDB saves',async({page,context,request})=>{
 await request.post('/__revision?value=baseline');await page.goto('/');await page.evaluate(()=>navigator.serviceWorker.ready);
 await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
 await page.getByLabel('社名').fill('更新企業');await page.getByRole('button',{name:'会社を設立'}).click();await advanceDays(page,1);await page.getByRole('button',{name:'保存',exact:true}).click();await expect(page.getByRole('status')).toContainText('保存');
 await request.post('/__revision?value=broken&fail=1');
 await page.evaluate(async()=>{const registration=(await navigator.serviceWorker.getRegistration())!;await registration.update();await new Promise<void>(resolve=>{const worker=registration.installing;if(!worker)return resolve();worker.addEventListener('statechange',()=>{if(worker.state==='redundant'||worker.state==='installed')resolve()})})});
 expect(await page.evaluate(()=>caches.keys())).toContain('pt-shell-baseline');expect(await page.evaluate(()=>caches.keys())).not.toContain('pt-shell-broken');
 await context.setOffline(true);await page.reload();await expect(page.getByRole('heading',{name:'更新企業'})).toBeVisible();await expect(page.getByTestId('day')).toHaveText('1');
 await context.setOffline(false);await request.post('/__revision?value=updated');
 await page.evaluate(async()=>{const registration=(await navigator.serviceWorker.getRegistration())!;await registration.update();await new Promise<void>(resolve=>{const worker=registration.installing;if(!worker)return resolve();worker.addEventListener('statechange',()=>{if(worker.state==='installed')resolve()})})});
 await page.close();const next=await context.newPage();await next.goto('/');
 await expect.poll(()=>next.evaluate(()=>caches.keys())).toEqual(['pt-shell-updated']);
 await context.setOffline(true);await next.reload();await expect(next.getByRole('heading',{name:'更新企業'})).toBeVisible();await expect(next.getByTestId('day')).toHaveText('1');
 expect(await next.locator('meta[name=test-revision]').getAttribute('content')).toBe('updated');
});
