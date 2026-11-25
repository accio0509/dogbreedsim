import {createGameState} from '../storage/state.js';
import {migrateSave} from '../storage/save.js';
import {createAnimal} from '../engine/animal.js';
import {createExplorationService,explorationEligible,validateExplorationState} from '../engine/exploration.js';
import {settleGrowth} from '../engine/growth.js';
import {applyDevAction} from '../engine/devTools.js';
import {getAllBreeds} from '../data/species/dog/breeds.js';
import {hasMutation} from '../engine/genetics.js';
import {checkBreedingPair} from '../engine/breeding.js';
import {EXPLORATION_MAPS} from '../config/exploration.js';
const H=3600000;
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function runExplorationChecks(){
    const out=[];function test(name,fn){try{out.push({name,success:!!fn()});}catch(e){out.push({name,success:false,message:e.message});}}
    function setup({rng=()=>0,persist=()=>true}={}){const s=createGameState(),time={now:Date.now()};s.initialized=true;const add=(id,location='nursery',stage='puppy',sex='male')=>{const a=createAnimal({id,breedId:getAllBreeds()[0].id,location,stage,sex});a.personality='calm';a.timestamps.lastGrowthAt=time.now;a.breeding={count:0,lastSuccessAt:null};s.activeAnimals[id]=a;s.pedigreeRecords[id]=structuredClone(a);return a;};add('A');add('B');const svc=createExplorationService({state:s,persist,now:()=>time.now,rng});return {s,time,svc,add};}
    test('五地图常驻开放且可并行',()=>{const {s,svc,add}=setup();for(let i=2;i<5;i++)add('X'+i);return EXPLORATION_MAPS.every((m,i)=>svc.start(m.id,Object.keys(s.activeAnimals)[i]).success)&&s.explorationTasks.length===5;});
    test('每地图最多一只',()=>{const {s,svc}=setup();svc.start('park','A');const before=structuredClone(s);return !svc.start('park','B').success&&same(s,before);});
    test('同犬不能多地图',()=>{const {s,svc}=setup();svc.start('park','A');const before=structuredClone(s);return !svc.start('field','A').success&&same(s,before);});
    test('电脑盒子犬不能出发',()=>{const {s,svc}=setup();s.activeAnimals.A.location='computer';return !svc.start('park','A').success;});
    test('忙碌、退役、租借犬均不可探索',()=>{const {s}=setup();const a=s.activeAnimals.A;return !explorationEligible({...a,activity:'training'})&&!explorationEligible({...a,retired:true})&&!explorationEligible({...a,source:'rental'});});
    test('探索保留饲育屋容量且标记忙碌',()=>{const {s,svc}=setup();return svc.start('park','A').success&&s.activeAnimals.A.location==='nursery'&&s.activeAnimals.A.activity==='exploration';});
    test('成年探索犬不可配种',()=>{const {s,svc,add,time}=setup();add('M','nursery','adult','male');add('F','nursery','adult','female');svc.start('park','M');return !checkBreedingPair(s.activeAnimals.F,s.activeAnimals.M,s.pedigreeRecords,time.now).success;});
    test('探索独立经验，不叠加自然经验',()=>{const {s,svc,time}=setup();svc.start('park','A');settleGrowth(s,time.now+2*H);return s.activeAnimals.A.exp===72&&s.activeAnimals.B.exp===60&&s.explorationTasks[0].expEarned===72;});
    test('重复结算不增加经验',()=>{const {s,svc,time}=setup();svc.start('park','A');settleGrowth(s,time.now+H);const before=structuredClone(s);settleGrowth(s,time.now+H);return same(s,before);});
    test('结束后等待领取期间不增长',()=>{const {s,svc,time}=setup();svc.start('park','A');settleGrowth(s,time.now+24*H);return s.activeAnimals.A.exp===144&&s.activeAnimals.A.activity==='exploration';});
    test('离线48小时上限与成年封顶',()=>{const {s,svc,time}=setup();svc.start('snow','A');settleGrowth(s,time.now+100*H);return s.activeAnimals.A.exp===720&&s.activeAnimals.A.stage==='adult'&&s.activeAnimals.B.exp===720;});
    test('提前领取拒绝且不改变存档',()=>{const {s,svc,time}=setup();svc.start('park','A');time.now+=H;const before=structuredClone(s);return !svc.claim('park').success&&same(s,before);});
    test('提前返回保留经验而无奖励',()=>{const {s,svc,time}=setup();svc.start('park','A');time.now+=2*H;const money=s.money;return svc.cancel('park').success&&s.activeAnimals.A.exp===72&&s.money===money&&s.activeAnimals.A.activity===null&&!s.explorationTasks.length;});
    test('完成后不得取消',()=>{const {svc,time}=setup();svc.start('park','A');time.now+=4*H;return !svc.cancel('park').success;});
    test('领取奖励后释放地图并恢复自然成长',()=>{const {s,svc,time}=setup();svc.start('park','A');time.now+=4*H;const money=s.money;const r=svc.claim('park');settleGrowth(s,time.now+H);return r.success&&s.money===money+20&&s.inventory.dog_biscuit===1&&s.activeAnimals.A.exp===174&&!s.explorationTasks.length;});
    test('重复领取拒绝',()=>{const {s,svc,time}=setup();svc.start('park','A');time.now+=4*H;svc.claim('park');const before=structuredClone(s);return !svc.claim('park').success&&same(s,before);});
    test('遇见幼犬遗传属性预锁定、入库不重抽',()=>{const {s,svc,time}=setup();svc.start('park','A');const p=structuredClone(s.explorationTasks[0].reward.puppy);time.now+=4*H;const r=svc.claim('park',{adopt:true});return r.success&&r.puppy.stage==='puppy'&&r.puppy.source==='exploration'&&r.puppy.id!=='DISCOVERY'&&same(p.genotype,r.puppy.genotype)&&same(p.iv,r.puppy.iv)&&!hasMutation(r.puppy.genotype)&&s.pedigreeRecords[r.puppy.id].pedigree.generation===1;});
    test('不领养仍可领取金钱道具',()=>{const {s,svc,time}=setup();svc.start('park','A');time.now+=4*H;return svc.claim('park',{adopt:false}).success&&Object.keys(s.activeAnimals).length===2&&s.money===1020;});
    test('设施满员不强制领养，可拒绝并领取',()=>{const {s,svc,time}=setup();s.facilities.nursery.capacity=2;s.facilities.computer.capacity=1;s.activeAnimals.B.location='computer';s.facilities.nursery.capacity=1;svc.start('park','A');time.now+=4*H;const before=structuredClone(s);return !svc.claim('park',{adopt:true}).success&&same(s,before)&&svc.claim('park').success;});
    test('饲育屋满后领养进入电脑盒子',()=>{const {s,svc,time}=setup();s.facilities.nursery.capacity=2;svc.start('park','A');time.now+=4*H;return svc.claim('park',{adopt:true}).puppy.location==='computer';});
    test('随机未遇见幼犬仍正常结算',()=>{const {s,svc,time}=setup({rng:()=>0.999});svc.start('park','A');time.now+=4*H;return s.explorationTasks[0].reward.puppy===null&&svc.claim('park').success&&s.money===1040;});
    test('任务和奖励随存档持久化',()=>{const {s,svc}=setup();svc.start('park','A');const d=migrateSave(s);return same(d.explorationTasks,s.explorationTasks)&&d.activeAnimals.A.activity==='exploration';});
    test('损坏或重复探索任务拒绝迁移',()=>{const {s,svc}=setup();svc.start('park','A');s.explorationTasks.push(structuredClone(s.explorationTasks[0]));try{migrateSave(s);}catch{return true;}return false;});
    test('旧0.5.0存档无损迁移',()=>{const {s}=setup();s.version='0.5.0';delete s.explorationTasks;const d=migrateSave(s);return d.version==='1.0.1'&&!d.explorationTasks.length&&same(s.activeAnimals,d.activeAnimals);});
    test('开始探索写盘失败完整回滚',()=>{const {s,svc}=setup({persist:()=>false});const before=structuredClone(s);return !svc.start('park','A').success&&same(s,before);});
    test('领取奖励写盘失败完整回滚',()=>{const {s,svc,time}=setup();svc.start('park','A');time.now+=4*H;const bad=createExplorationService({state:s,persist:()=>false,now:()=>time.now});const before=structuredClone(s);return !bad.claim('park',{adopt:true}).success&&same(s,before);});
    test('快进12小时同步探索且不可重复结算',()=>{const {s,svc,time}=setup();svc.start('wetland','A');applyDevAction(s,'advance',{hours:12,now:time.now});const exp=s.activeAnimals.A.exp;settleGrowth(s,time.now);return exp===576&&s.activeAnimals.A.exp===exp&&svc.claim('wetland').success;});
    test('快进7天不会自动重复探索',()=>{const {s,svc,time}=setup();svc.start('park','A');applyDevAction(s,'advance',{hours:168,now:time.now});return s.explorationTasks.length===1&&s.activeAnimals.A.exp===144&&validateExplorationState(s)&&svc.claim('park').success;});
    test('系统时钟倒退不重复结算',()=>{const {s,svc,time}=setup();svc.start('park','A');settleGrowth(s,time.now+2*H);settleGrowth(s,time.now+H);settleGrowth(s,time.now+2*H);return s.activeAnimals.A.exp===72;});
    test('开发模式强制遇见幼犬不修改金钱道具',()=>{const {s,svc,time}=setup({rng:()=>0.999});svc.start('park','A');const r=s.explorationTasks[0].reward;applyDevAction(s,'exploration-puppies',{now:time.now});return r.puppy?.stage==='puppy'&&r.money===40&&r.item===null&&validateExplorationState(s);});
    return out;
}
