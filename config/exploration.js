// All regions are permanently open. Values are provisional balance parameters.
export const EXPLORATION_MAPS = [
    {id:'park',name:'城镇公园',hours:4,multiplier:1.2,money:[20,40],puppyChance:0.08,item:'dog_biscuit',itemChance:0.50},
    {id:'field',name:'乡村田野',hours:8,multiplier:1.4,money:[40,80],puppyChance:0.12,item:'dog_biscuit',itemChance:0.65},
    {id:'wetland',name:'湖畔湿地',hours:12,multiplier:1.6,money:[60,120],puppyChance:0.16,item:'chew_toy',itemChance:0.55},
    {id:'forest',name:'山地森林',hours:24,multiplier:1.8,money:[120,220],puppyChance:0.22,item:'chew_toy',itemChance:0.75},
    {id:'snow',name:'雪原',hours:48,multiplier:2,money:[240,400],puppyChance:0.30,item:'energy_snack',itemChance:0.85}
];
export const EXPLORATION_ITEMS={dog_biscuit:'狗狗饼干',chew_toy:'耐咬玩具',energy_snack:'能量零食'};
export const getExplorationMap=id=>EXPLORATION_MAPS.find(m=>m.id===id);
