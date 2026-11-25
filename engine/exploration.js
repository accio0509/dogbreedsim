import {WITCH_RATES,awardWitchMaterials,tradeWitch} from './witch.js';
import {getPersonality} from '../data/species/dog/personalities.js';
import {gameNow} from './gameClock.js';
import {GAME_CONFIG as G} from '../config/game.js';
import {getExplorationMap,EXPLORATION_ITEMS,pickMapBreed} from '../config/exploration.js';
import {getAllBreeds,getBreed} from '../data/species/dog/breeds.js';
import {getRandomDogName} from '../data/species/dog/names.js';
import {createAnimal,formatAnimalId} from './animal.js';
import {hasMutation,validateGenotype} from './genetics.js';
import {validateIV,validateWeightGene} from './inheritance.js';
import {settleGrowth} from './growth.js';
import {getPlacement} from './breedingIntegration.js';
const EXTRA_NAMES={magic_crystal:'魔法水晶',moon_herb:'月影草',golden_biscuit:'黄金饼干',ancient_toy:'远古玩具',potential_fruit:'潜能果实',personality_flower:'性格花',moonstone:'月光石',recovery_water:'恢复泉水',lucky_charm:'幸运护符',mutation_pollen:'突变花粉'};
const H=3600000, fail=message=>({success:false,message});
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
export function explorationEligible(a){return !!a&&!a.retired&&a.source!=='rental'&&a.location==='nursery'&&a.activity==null;}
export function explorationReady(t,now=Date.now()){return now>=t.endsAt;}
// The ordinary growth loop always skips busy dogs. This separate clock is capped
// independently and cannot grant XP beyond the scheduled finish time.
export function settleExploration(state,now=Date.now()){
    let changed=false;
    for(const t of state.explorationTasks??[]){
        const a=state.activeAnimals[t.animalId], m=getExplorationMap(t.mapId);
        if(!a||!m||a.activity!=='exploration'||a.location!=='nursery')continue;
        const until=Math.min(now,t.endsAt);
        if(until<=t.lastSettledAt)continue;
        const elapsed=Math.min(until-t.lastSettledAt,G.growth.offlineMaxHours*H);
        const gain=a.retired?0:Math.min(Math.max(0,G.growth.adultExp-a.exp),elapsed/H*G.growth.expPerHour*m.multiplier*(getPersonality(a.personality)?.effects?.explorationEXP??1));
        a.exp+=gain;t.expEarned+=gain;
        a.stage=a.exp>=G.growth.adultExp?'adult':a.exp>=G.growth.juvenileExp?'juvenile':'puppy';
        t.lastSettledAt=until;changed=true;
    }
    return changed;
}
function rewardFor(m,at,rng,luck=1,charm=1){
    const money=m.money[0]+Math.floor(rng()*(m.money[1]-m.money[0]+1));
    const item=rng()<Math.min(1,m.itemChance*luck*charm)?m.item:null;
    let puppy=null;
    if(rng()<Math.min(1,m.puppyChance*luck*charm)){
        const breeds=getAllBreeds(), breed=pickMapBreed(m.id,breeds,rng);
        puppy=createAnimal({id:'DISCOVERY',breedId:breed.id,name:getRandomDogName(),stage:'puppy',source:'exploration'});
        puppy.breeding={count:0,lastSuccessAt:null};puppy.timestamps.createdAt=at;puppy.timestamps.hatchedAt=at;puppy.timestamps.lastGrowthAt=at;
    }
    const [w,c,h]=WITCH_RATES[m.id],extra=[];
    const witch=rng()<Math.min(1,w*luck);
    if(rng()<Math.min(1,c*luck))extra.push('magic_crystal');
    if(rng()<Math.min(1,h*luck))extra.push('moon_herb');
    // Separate exploration-only reward, in addition to the original map drop.
    const rare=['golden_biscuit','ancient_toy','potential_fruit','personality_flower','moonstone','recovery_water','lucky_charm','mutation_pollen'];
    const chance={park:.03,field:.06,wetland:.10,forest:.20,snow:.35}[m.id];
    if(rng()<Math.min(1,chance*luck*charm)){const roll=rng(),weights=[.30,.18,.13,.10,.10,.08,.08,.03];let sum=0;extra.push(rare[weights.findIndex((x,i)=>(sum+=x)>roll)]??rare.at(-1));}
    return {money,item,puppy,witch,extra,extraClaimed:false};
}
// Used only by the isolated developer panel. Other reward fields stay fixed.
export function forceExplorationPuppies(state,now=Date.now()){
    for(const t of state.explorationTasks)if(!t.reward.puppy)t.reward.puppy=rewardFor(getExplorationMap(t.mapId),now,()=>0).puppy;
}
export function validateExplorationState(s){
    const maps=new Set(), dogs=new Set();
    for(const t of s.explorationTasks){
        const a=s.activeAnimals[t?.animalId],m=getExplorationMap(t?.mapId),r=t?.reward;
        if(!obj(t)||!a||!m||maps.has(t.mapId)||dogs.has(t.animalId)||a.activity!=='exploration'||a.location!=='nursery'||a.retired||a.source==='rental')throw Error('探索任务或犬只状态异常');
        if(![t.startedAt,t.endsAt,t.lastSettledAt,t.expEarned].every(Number.isFinite)||t.endsAt-t.startedAt>m.hours*H||t.endsAt<=t.startedAt||t.lastSettledAt<t.startedAt||t.lastSettledAt>t.endsAt||t.expEarned<0||t.expEarned>G.growth.adultExp)throw Error('探索计时异常');
        if(!obj(r)||!Number.isSafeInteger(r.money)||r.money<m.money[0]||r.money>m.money[1]||!(r.item===null||r.item===m.item))throw Error('探索奖励异常');
        if((r.witch!==undefined&&typeof r.witch!=='boolean')||(r.extraClaimed!==undefined&&typeof r.extraClaimed!=='boolean')||(r.extra!==undefined&&(!Array.isArray(r.extra)||new Set(r.extra).size!==r.extra.length||r.extra.some(k=>!['magic_crystal','moon_herb','golden_biscuit','ancient_toy','potential_fruit','personality_flower','moonstone','recovery_water','lucky_charm','mutation_pollen'].includes(k))||r.extra.length>3)))throw Error('额外探索奖励异常');
        if(r.puppy!==null){const p=r.puppy;if(!obj(p)||p.id!=='DISCOVERY'||p.source!=='exploration'||p.stage!=='puppy'||!getBreed(p.breedId)||!['male','female'].includes(p.sex)||p.pedigree?.motherId!==null||p.pedigree?.fatherId!==null||p.pedigree?.generation!==1||hasMutation(p.genotype))throw Error('探索幼犬异常');validateGenotype(p.genotype);validateIV(p.iv);validateWeightGene(p.weightGene);}
        maps.add(t.mapId);dogs.add(t.animalId);
    }
    for(const a of Object.values(s.activeAnimals))if(a.activity==='exploration'&&!dogs.has(a.id))throw Error('犬只探索任务丢失');
    return true;
}
export function createExplorationService({state,persist,now=()=>gameNow(state),rng=Math.random}){
    let busy=false;
    function run(op){if(busy)return fail('探索操作处理中');if(!state.initialized)return fail('请先建立犬舍');busy=true;
        try{const d=structuredClone(state),at=now();settleGrowth(d,at);const r=op(d,at);if(!r.success)return r;validateExplorationState(d);d.timestamps.lastPlayedAt=at;if(persist(d)===false)return fail('存档失败，探索操作未生效');Object.assign(state,d);return r;}catch(e){return fail(e.message);}finally{busy=false;}}
    function event(d,at,message){d.events.unshift({id:d.nextEventId++,type:'exploration',message,timestamp:at});}
    function finish(d,t,at){const a=d.activeAnimals[t.animalId];a.activity=null;a.timestamps.lastGrowthAt=at;d.explorationTasks.splice(d.explorationTasks.indexOf(t),1);return a;}
    return {
        start(mapId,animalId){return run((d,at)=>{
            const m=getExplorationMap(mapId),a=d.activeAnimals[animalId];if(!m)return fail('地图不存在');if(d.explorationTasks.some(t=>t.mapId===mapId))return fail('该地图已有探索犬只');if(!explorationEligible(a))return fail('仅空闲、未退役的饲育屋自有犬只可探索');
            a.activity='exploration';a.timestamps.lastGrowthAt=at;
            d.explorationTasks.push({mapId,animalId,startedAt:at,endsAt:at+m.hours*H,lastSettledAt:at,expEarned:0,reward:rewardFor(m,at,rng,getPersonality(a.personality)?.effects?.rareDrop??1,a.luckyCharm?1.5:1)});delete a.luckyCharm;
            const message=`${a.name}前往${m.name}探索。`;event(d,at,message);return {success:true,message};
        });},
        cancel(mapId){return run((d,at)=>{const t=d.explorationTasks.find(x=>x.mapId===mapId);if(!t)return fail('探索任务不存在');if(explorationReady(t,at))return fail('探索已完成，请领取奖励');const a=finish(d,t,at),message=`${a.name}提前返回，保留已获经验，不领取探索奖励。`;event(d,at,message);return {success:true,message};});},
        openWitch(mapId){return run((d,at)=>{const t=d.explorationTasks.find(x=>x.mapId===mapId);if(!t||!explorationReady(t,at)||!t.reward.witch)return fail('未遇见女巫或探索尚未完成');if(t.reward.extraClaimed)return fail('小屋已开启，无需重复领取');awardWitchMaterials(d,t);return {success:true,message:'发现女巫小屋，获得契约及本次额外道具'};});},
        witchTrade(mapId,opts){return run((d,at)=>{const t=d.explorationTasks.find(x=>x.mapId===mapId);if(!t||!explorationReady(t,at))return fail('探索尚未完成');const r=tradeWitch(d,t,opts,rng);if(r.success)event(d,at,r.message);return r;});},
        claim(mapId,{adopt=false}={}){return run((d,at)=>{
            const t=d.explorationTasks.find(x=>x.mapId===mapId);if(!t)return fail('探索任务不存在或已领取');if(!explorationReady(t,at))return fail('探索尚未完成');
            const r=t.reward;let puppy=null;
            if(adopt&&r.puppy){const location=getPlacement({animals:Object.values(d.activeAnimals)},{nursery:d.facilities.nursery.capacity,computer:d.facilities.computer.capacity});if(location==='pending')return fail('饲育屋和电脑盒子均已满，可腾出空间后领取或选择不领养');
                const used=new Set([...Object.keys(d.activeAnimals),...Object.keys(d.pedigreeRecords),...d.incubationTasks.flatMap(e=>[e.id,e.offspringId])]);let id;do{if(!Number.isSafeInteger(d.nextAnimalId)||d.nextAnimalId>=Number.MAX_SAFE_INTEGER)throw Error('犬只编号已达上限');id=formatAnimalId(d.nextAnimalId++);}while(used.has(id));
                puppy=structuredClone(r.puppy);puppy.id=id;puppy.location=location;puppy.timestamps.createdAt=at;puppy.timestamps.hatchedAt=at;puppy.timestamps.lastGrowthAt=at;d.activeAnimals[id]=puppy;d.pedigreeRecords[id]=structuredClone(puppy);
            }
            if(!Number.isSafeInteger(d.money+r.money))return fail('金钱已达上限');d.money+=r.money;
            if(r.item){const n=(d.inventory[r.item]??0)+1;if(!Number.isSafeInteger(n))return fail('道具数量异常');d.inventory[r.item]=n;}
            const extraMessage=!r.extraClaimed?` ${r.extra?.length?'额外获得 '+r.extra.map(k=>EXTRA_NAMES[k]).join('、')+'。':''}${r.witch?'获得女巫契约×1。':''}`:'';awardWitchMaterials(d,t);const a=finish(d,t,at),message=`${a.name}探索归来，获得 ${r.money} 金钱${r.item?'、'+EXPLORATION_ITEMS[r.item]:''}${puppy?'，领养了'+puppy.name:r.puppy?'，未领养遇见的幼犬':''}。${extraMessage}`;event(d,at,message);return {success:true,message,puppy};
        });}
    };
}
