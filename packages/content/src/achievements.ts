// Achievement thresholds are scaled to this game's economy (start capital 500,000), not the original game's numbers.
export type TieredMetric='earned'|'cash'|'sold'|'fans'|'yearRevenue'|'companyValue'|'research';
export const tieredAchievements:{metric:TieredMetric,label:string,unit:string,tiers:number[]}[]=[
 {metric:'earned',label:'累計売上',unit:'円',tiers:[1e6,1e7,1e8,1e9,1e10,1e11]},
 {metric:'cash',label:'現金残高',unit:'円',tiers:[1e6,1e7,1e8,1e9,1e10]},
 {metric:'sold',label:'累計販売台数',unit:'台',tiers:[1e3,1e4,1e5,1e6,1e7]},
 {metric:'fans',label:'ファン数',unit:'人',tiers:[1e3,1e4,1e5,1e6,1e7]},
 {metric:'yearRevenue',label:'年間売上',unit:'円',tiers:[1e6,1e7,1e8,1e9,1e10]},
 {metric:'companyValue',label:'企業価値',unit:'円',tiers:[1e6,1e7,1e8,1e9,1e10]},
 {metric:'research',label:'研究完了数',unit:'件',tiers:[10,100,500,1000,3345]},
];
export const milestoneAchievements=[
 {id:'first-launch',label:'初めての製品',description:'製品を1つ発売する'},
 {id:'five-stars',label:'満点評価',description:'レビューで★5.0を獲得する'},
 {id:'all-kinds',label:'総合メーカー',description:'全カテゴリの製品を発売する'},
 {id:'office-max',label:'未来産業拠点',description:'オフィスを最大段階にする'},
 {id:'factory-max',label:'巨大工場',description:'工場を最大段階にする'},
 {id:'distribution-max',label:'世界直販体制',description:'販売網を最大段階にする'},
 {id:'all-companies',label:'業界統一',description:'すべての競合を買収する'},
 {id:'mass-production',label:'量産体制',description:'1製品で1,000台以上を生産する'},
 {id:'ai-model',label:'AI参入',description:'AIモデルの評価を完了する'},
 {id:'hard-mode',label:'逆境の覇者',description:'高難度で企業価値10億円に到達する'},
] as const;
export const achievementLabelMap:Record<string,string>={
 ...Object.fromEntries(tieredAchievements.flatMap(t=>t.tiers.map((v,i)=>[`${t.metric}-${i+1}`,`${t.label} ${v.toLocaleString('ja-JP')}${t.unit}`]))),
 ...Object.fromEntries(milestoneAchievements.map(m=>[m.id,m.label])),
};
export const hardModeGoal=1e9;
export const logoCount=24;
