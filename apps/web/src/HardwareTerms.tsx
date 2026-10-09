import {useEffect,useRef,useState} from 'react';
export const hardwareExplanations:Record<string,string>={
 cores:'CPU内で命令を処理するコアの数。多いほど並列処理に有利ですが、消費電力と原価も増えます。',
 ipc:'IPC相当は1クロック当たりの処理効率を表すゲーム内の相対値（標準=1倍）です。実物のCPUのIPCを直接測定した値ではありません。',
 clock:'回路の動作周波数（GHz）。高いほど性能が上がりますが、消費電力は周波数の2乗で増えます。',
 process:'製造プロセスの線幅（nm）。小さいほど同じ性能でも消費電力が下がります。省電力設計の研究で微細化できます。',
 cache:'旧世代のセーブデータで用いる総キャッシュ容量。新規設計ではL1・L2・L3を個別設定します。',
 l1Cache:'CPUコアに近い最速のキャッシュ。大容量化は設計コストがかかります。',
 l2Cache:'L1より大きい中間キャッシュ。処理性能と製造原価に影響します。',
 l3Cache:'複数コア間で共有する大容量キャッシュ。ゲーム内では合計容量が性能に影響します。',
 smt:'1コアで複数スレッドを処理する方式。ゲーム内では性能が約18%上がり、消費電力も増えます。',
 memoryChannels:'CPUとRAMを接続する独立チャネル数。多いほどメモリ処理能力が上がります。',
 cooling:'製品が放熱できる電力（W）。消費電力を下回ると製造できません。消費電力に対して余裕があるほど品質が上がりますが、原価も増えます。',
 socket:'CPUとマザーボードを取り付ける規格。組立時は両者のソケットが一致する必要があります。',
 units:'GPUの演算ユニットの数。増やすと計算能力と製造原価・電力が増えます。',
 vram:'GPU専用メモリの容量（GB）。AI学習や大きな描画データの取り扱いに影響します。',
 bandwidth:'GPUとVRAMの間でデータを転送できる帯域（GB/s）。演算能力に対して狭いと性能が頭打ちになります。',
 busWidth:'GPUのメモリバス幅（bit）。メモリ転送経路の広さを表します。',
 memoryGen:'メモリ規格の世代。RAMとマザーボードで同じ世代を選ぶ必要があります。',
 slots:'拡張カードや周辺機器を装着できるスロットの数。',
 features:'マザーボードに搭載する追加機能の数。性能指標と製造原価に影響します。',
 capacity:'RAMやストレージの記憶容量（GB）。',
 speed:'RAMの転送レート（MT/s）またはストレージの転送速度（MB/s）。高いほど性能が上がります。',
 latency:'メモリへのアクセスにかかる遅延。短いほど処理効率が上がります。',
 iops:'ストレージの1秒あたりのランダム入出力回数。アプリの応答性能に影響します。',
 wattage:'電源が供給できる最大電力（W）。組み立てるPCの消費電力の1.2倍以上が必要です。',
 efficiency:'電力の変換効率（%）。高いほど電源自身の損失（発熱）が減り、組み込んだPCの品質が上がります。',
 modular:'ケーブルの着脱方式。モジュラー式ほど評価が上がり、原価も増えます。',
 resolution:'モニターの縦方向の解像度（p）。映像の細かさと消費電力・原価に関係します。',
 refresh:'画面を1秒間に更新する回数（Hz）。高いほど動きを滑らかに表現できます。',
 gamut:'表示できる色の範囲のカバー率（%）。高いほど色表現の評価が上がります。',
 appearance:'製品外観の色や仕上げを選ぶ項目です。主に見た目に影響します。',
};
/**
 * On-demand definition bubble. It closes on any other interaction (a tap elsewhere, a key, scrolling or a value change),
 * so it never lingers over the controls after the player has moved on.
 */
export function TermHelp({label,description}:{label:string,description?:string}){
 const [open,setOpen]=useState(false);
 const trigger=useRef<HTMLButtonElement>(null);
 useEffect(()=>{
  if(!open)return;
  const close=(e:Event)=>{if(e.target instanceof Node&&trigger.current?.contains(e.target))return;setOpen(false);};
  const opts={capture:true};
  // User-driven scrolling only: focus moves can scroll the panel programmatically right after opening.
  const events=['pointerdown','keydown','wheel','touchmove','input','change'] as const;
  for(const name of events)document.addEventListener(name,close,opts);
  return()=>{for(const name of events)document.removeEventListener(name,close,opts);};
 },[open]);
 if(!description)return null;
 return <span className="term-help"><button ref={trigger} type="button" className="term-trigger" aria-expanded={open} aria-label={label+'の解説'} onClick={e=>{e.preventDefault();setOpen(v=>!v);}}>ⓘ</button>{open&&<span className="term-explanation" role="note">{description}</span>}</span>;
}
