export const screens=[
 {id:'home',label:'オフィス'},{id:'develop',label:'開発'},{id:'products',label:'製品'},
 {id:'research',label:'研究'},{id:'upgrades',label:'アップグレード'},{id:'staff',label:'人事'},
 {id:'companies',label:'企業'},{id:'ai',label:'AI Lab'},{id:'stats',label:'統計'},{id:'settings',label:'セーブ・設定'}
] as const;
export type Screen=typeof screens[number]['id'];
/** Routes shown in the bottom bar; settings is reached from the HUD gear. */
export const navScreens=screens.filter(s=>s.id!=='settings');
export function screenFromHash(hash:string=location.hash):Screen{
 const name=hash.replace(/^#\/?/,'').split('?')[0];
 return screens.find(s=>s.id===name)?.id??'home';
}
