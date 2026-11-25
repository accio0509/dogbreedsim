import {createGameState} from '../storage/state.js';
import {createAnimal} from '../engine/animal.js';
import {calculateInbreedingCoefficient,applyInbreedingPenalty} from '../engine/kinship.js';
import {createCompetitionService,competitionProgress} from '../engine/competition.js';
import {upgradeFacility,buyItem,collection,predictLocus} from '../engine/management.js';
import {createFormalBreeding} from '../engine/formalBreeding.js';
import {checkBreedingPair} from '../engine/breeding.js';
import {migrateSave} from '../storage/save.js';
const T=1700000000000,H=3600000;
export function runV090Checks(){const out=[];function test(name,fn){try{out.push({name,success:!!fn()});}catch(e){out.push({name,success:false,message:e.message});}}function dog(id,breedId,sex){return createAnimal({id,breedId,sex,stage:'adult'});}function setup(){const s=createGameState();s.initialized=true;const a=dog('A','chihuahua','male');s.activeAnimals.A=a;s.pedigreeRecords.A=structuredClone(a);return s;}
const a=dog('A','chihuahua','male'),b=dog('B','corgi','female'),c=dog('C','corgi','female'),d=dog('D','chihuahua','male'),f=dog('F','chihuahua','female');c.pedigree={...c.pedigree,motherId:'B',fatherId:'A'};d.pedigree={...d.pedigree,motherId:'F',fatherId:'A'};const records={A:a,B:b,C:c,D:d,F:f};
test('跨犬种父女 F=25%',()=>calculateInbreedingCoefficient(c,a,records)===.25);
test('跨犬种半同胞 F=12.5%',()=>calculateInbreedingCoefficient(c,d,records)===.125);
test('跨犬种父女繁育预览与真实犬蛋近交一致',()=>{const s=createGameState();s.initialized=true;s.activeAnimals={A:structuredClone(a),C:structuredClone(c)};s.pedigreeRecords=structuredClone(records);const q=checkBreedingPair(s.activeAnimals.C,s.activeAnimals.A,s.pedigreeRecords,T);if(!q.success||q.inbreedingCoefficient!==.25||q.inbreedingPenalty!==.1)return false;const r=createFormalBreeding({state:s,persist:()=>true,now:()=>T}).breed('C','A');return r.success&&r.egg.offspringData.pedigree.inbreedingCoefficient===.25&&r.egg.offspringData.inheritance.inbreeding.penalty===.1;});
test('无亲缘跨犬种 F=0',()=>calculateInbreedingCoefficient(b,a,records)===0);
test('跨犬种近交惩罚逐项向下取整',()=>applyInbreedingPenalty({STR:9,SPD:9,STA:9,AGI:9,INT:9,PER:9},calculateInbreedingCoefficient(c,a,records)).iv.STR===8);
test('新比赛恰好一小时领取',()=>{const s=setup();let now=T;const x=createCompetitionService({state:s,persist:()=>true,now:()=>now});if(!x.start('A','sprint').success)return false;now+=H-1;if(x.claim('A').success)return false;now++;return x.claim('A').success;});
test('比赛文字按时间变化，最终成绩一致',()=>{const s=setup();createCompetitionService({state:s,persist:()=>true,now:()=>T}).start('A','sprint');const t=s.competitionTasks[0];return competitionProgress(t,'球球',T).includes('等待上场')&&competitionProgress(t,'球球',T+H*.2).includes('转圈')&&competitionProgress(t,'球球',T+H*.6).includes('暂列')&&competitionProgress(t,'球球',T+H).includes(`第${t.rank}名`);});
test('旧四小时任务及记录仍兼容',()=>{const s=setup();let now=T;const x=createCompetitionService({state:s,persist:()=>true,now:()=>now});x.start('A','sprint');s.version='0.8.0';s.competitionTasks[0].endsAt=T+4*H;delete s.competitionTasks[0].opponents;const migrated=migrateSave(s);now+=4*H;Object.assign(s,migrated);return x.claim('A').success&&migrateSave(s).competitionRecords.length===1;});
test('设施升级扣款且迁移保留',()=>{const s=setup();return upgradeFacility(s,'nursery').success&&s.money===500&&migrateSave(s).facilities.nursery.capacity===15;});
test('设施满级拒绝',()=>{const s=setup();s.facilities.breeding.capacity=5;return !upgradeFacility(s,'breeding').success&&s.money===1000;});
test('道具购买及余额',()=>{const s=setup();return buyItem(s,'dog_biscuit',2).success&&s.money===940&&s.inventory.dog_biscuit===2&&!buyItem(s,'bad').success;});
test('图鉴来自永久档案',()=>{const s=setup();delete s.activeAnimals.A;const c=collection(s);return c.breeds.has('chihuahua')&&c.genes.size===5;});
test('跨犬种遗传预测各位点概率之和为1',()=>Object.keys(b.genotype).every(l=>Math.abs(predictLocus(b,a,l).reduce((n,x)=>n+x.p,0)-1)<1e-9));
return out;}
