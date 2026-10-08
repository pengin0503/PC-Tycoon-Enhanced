import {useState} from 'react';
export const hardwareExplanations:Record<string,string>={
 cores:'CPU内で命令を処理するコアの数。多いほど並列処理に有利ですが、消費電力と原価も増えます。',
 ipc:'IPC相当は1クロック当たりの処理効率を表すゲーム内の相対値です。実物のCPUのIPCを直接測定した値ではありません。',
 clock:'回路の動作速度を表すゲーム内の値。高いほど性能と発熱・電力が上がります。実際のGHzとは異なります。',
 process:'製造プロセスに相当する値。小さい値ほどゲーム内で電力効率が良くなります。実在のnm数そのものではありません。',
 socket:'CPUとマザーボードを取り付ける規格。組立時は両者のソケットが一致する必要があります。',
 units:'GPUの演算ユニットを表す相対数。増やすと計算能力と製造原価・電力が増えます。',
 vram:'GPU専用メモリの容量。AI学習や大きな描画データの取り扱いに影響します。',
 bandwidth:'GPUとVRAMの間でデータを転送できる帯域。演算能力に対して狭いと性能が頭打ちになります。',
 memoryGen:'メモリ規格の世代。RAMとマザーボードで同じ世代を選ぶ必要があります。',
 slots:'拡張カードや周辺機器を装着できるスロットの数。',
 features:'マザーボードに搭載する追加機能の数。性能指標と製造原価に影響します。',
 capacity:'保存領域またはメモリ容量。カテゴリに応じたゲーム内単位です。',
 speed:'メモリ速度またはストレージ転送速度を表す相対指標。カテゴリに応じて性能に影響します。',
 resolution:'モニターの解像度相当。映像の細かさと消費電力・原価に関係します。',
 refresh:'画面を1秒間に更新する回数に相当する値。高いほど動きを滑らかに表現できます。',
 gamut:'表示できる色の広さに相当するスコア。高いほど色表現の評価が上がります。',
 appearance:'製品外観の色や仕上げを選ぶ項目です。主に見た目に影響します。',
};
export function TermHelp({label,description}:{label:string,description?:string}){
 const [open,setOpen]=useState(false);
 if(!description)return null;
 return <span className="term-help"><button type="button" className="term-trigger" aria-expanded={open} aria-label={label+'の解説'} onClick={e=>{e.preventDefault();setOpen(v=>!v);}}>ⓘ</button>{open&&<span className="term-explanation" role="note">{description}</span>}</span>;
}
