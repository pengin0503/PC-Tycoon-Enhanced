export const screens=[
 {id:'company',label:'会社概要'},{id:'hardware',label:'ハードウェア'},{id:'research',label:'研究'},
 {id:'devices',label:'PCビルダー'},{id:'os',label:'OS'},{id:'management',label:'経営・市場'},
 {id:'ai',label:'AI Lab'},{id:'finance',label:'財務・統計'},{id:'save',label:'セーブ・設定'}
] as const;
export type Screen=typeof screens[number]['id'];
export function screenFromHash(hash:string=location.hash):Screen{
 const name=hash.replace(/^#\/?/,'').split('?')[0];
 return screens.find(s=>s.id===name)?.id??'company';
}
