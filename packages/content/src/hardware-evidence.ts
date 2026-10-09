import type {HardwareKind} from './research';

/** Published device examples, not a survey, universal release-year ceiling, or a player technology lock.
 * The value/units below are physical manufacturer claims. Game IPC/compute-unit/score values are fictional.
 * Source table: docs/dev/HISTORICAL_HARDWARE_CALIBRATION.md.
 */
export type HardwareEvidence={
 kind:HardwareKind;year:number;product:string;metric:string;value:number|string;unit:string;
 source:string;note:string;referenceField?:string;
};
export const verifiedHardwareAnchors:readonly HardwareEvidence[]=[
 {kind:'cpu',year:2000,product:'Intel Pentium III 1GHz',metric:'clock',value:1,unit:'GHz',referenceField:'clock',
  source:'https://www.intel.com/pressroom/archive/releases/2000/sp030800.htm',note:'最高級PC用モデルの公表クロック。ゲームのIPC相当との互換性はない'},
 {kind:'cpu',year:2002,product:'Intel Pentium 4 3.06GHz HT',metric:'clock',value:3.06,unit:'GHz',referenceField:'clock',
  source:'https://www.intel.com/pressroom/archive/releases/2002/20021114comp.htm',note:'製造元の発表。ゲームのシミュレーション性能値は非対応'},
 {kind:'cpu',year:2025,product:'AMD Ryzen 9 9950X3D',metric:'cores',value:16,unit:'cores',referenceField:'cores',
  source:'https://www.amd.com/en/products/processors/desktops/ryzen.html',note:'一般向け高級モデル。サーバー192コアを代表値として扱わない'},
 {kind:'gpu',year:2000,product:'NVIDIA GeForce2 GTS',metric:'vram',value:.064,unit:'GB',referenceField:'vram',
  source:'https://pc.watch.impress.co.jp/docs/article/20000426/winhec05.htm',note:'同時代の製品発表記事。64MBモデルをGB換算、ゲーム演算ユニットとは非対応'},
 {kind:'gpu',year:2025,product:'NVIDIA GeForce RTX 5090',metric:'vram',value:32,unit:'GB',referenceField:'vram',
  source:'https://www.nvidia.com/ja-jp/geforce/news/rtx-50-series-graphics-cards-gpu-laptop-announcements/',note:'ハイエンドの物理VRAM容量、一般的な購買水準ではない'},
 {kind:'gpu',year:2025,product:'NVIDIA GeForce RTX 5090',metric:'bandwidth',value:1792,unit:'GB/s',referenceField:'bandwidth',
  source:'https://www.nvidia.com/ja-jp/geforce/news/rtx-50-series-graphics-cards-gpu-laptop-announcements/',note:'公式ピーク帯域。ゲーム演算ユニットやベンチマーク得点は非互換'},
 {kind:'motherboard',year:2025,product:'ASUS ROG Crosshair X870E Hero',metric:'memory technology',value:'DDR5',unit:'DDR generation',
  source:'https://rog.asus.com/jp/motherboards/rog-crosshair/rog-crosshair-x870e-hero/spec/',note:'DDR5/PCIe5対応例。ゲームの仮想チップセット帯域と非対応'},
 {kind:'ram',year:2025,product:'G.SKILL Trident Z5 F5-8000J4048F24GX2-TZ5K',metric:'speed',value:8000,unit:'MT/s',referenceField:'speed',
  source:'https://www.gskill.com/specification/165/371/1716256240/F5-8000J4048F24GX2-TZ5K-Specification',note:'XMP時のOC速度（非標準定格）。単体容量24GB、2枚48GBキット'},
 {kind:'storage',year:2025,product:'Samsung 9100 PRO 4TB SSD',metric:'sequential read',value:14800,unit:'MB/s',referenceField:'speed',
  source:'https://news.samsung.com/us/samsung-announces-9100-pro-series-ssds-with-breakthrough-pcie-5-0-performance/',note:'4TB製品の最大シーケンシャル読込、ゲームの読み書き統合指標とは非対応'},
 {kind:'psu',year:2025,product:'Corsair HX1500i',metric:'rated output',value:1500,unit:'W',referenceField:'wattage',
  source:'https://www.corsair.com/jp/ja/p/psu/cp-9020309-jp/hx1500i-fully-modular-ultra-low-noise-platinum-atx-1500-watt-pc-power-supply-jp-cp-9020309-jp',note:'連続出力の表示。シミュレーション変換効率は別途仮定'},
 {kind:'monitor',year:2025,product:'ASUS ROG Swift Pro PG248QP',metric:'refresh',value:540,unit:'Hz',referenceField:'refresh',
  source:'https://rog.asus.com/jp/monitors/23-to-24-5-inches/rog-swift-pro-pg248qp/spec/',note:'オーバークロック最大値であり通常パネル代表値ではない'},
];
