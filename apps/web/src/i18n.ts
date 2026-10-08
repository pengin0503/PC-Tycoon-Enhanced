import {messages} from './strings.generated';
export function t(key:keyof typeof messages):string{return messages[key];}
export const ja={
  start:'会社を設立',name:'社名',year:'開始年',seed:'シード',difficulty:'難易度',normal:'通常',hard:'高難度',
  day:'経過日',cash:'現金',debt:'未払債務',revenue:'売上累計',expenses:'営業費累計',capital:'設備投資累計',
  pause:'一時停止',one:'1日進める',month:'30日進める',save:'保存',load:'保存一覧',export:'JSON書き出し',import:'JSON読み込み',newGame:'新規ゲーム',
  daily:'日次更新',weekly:'週次更新',monthly:'月次決算',insolvency:'支払不足・債務発生',expense:'支出',
  researchStarted:'研究開始',researchComplete:'研究完了',designStarted:'設計開始',designComplete:'設計完了',launched:'発売',sales:'製品販売',
  officeUpgrade:'オフィス拡張',hired:'採用',marketingStopped:'広告停止',acquired:'企業買収',
  clusterPurchased:'クラスタ購入',trainingStarted:'学習開始',trainingComplete:'モデル評価完了',trainingFailed:'学習失敗',serviceStopped:'AIサービス停止',
  marketEvent:'市況イベント',
} as const;
export function eventLabel(kind:string){return kind in ja ? ja[kind as keyof typeof ja]:kind;}
export function yen(n:number){return new Intl.NumberFormat('ja-JP',{style:'currency',currency:'JPY'}).format(n);}
