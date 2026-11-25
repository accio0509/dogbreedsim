import {gameNow} from './gameClock.js';
import { MARKET_CONFIG as C } from '../config/market.js';
import { GAME_CONFIG } from '../config/game.js';
import { getAllBreeds, getBreed, getBreedAppearance } from '../data/species/dog/breeds.js';
import { getRandomDogName } from '../data/species/dog/names.js';
import { createAnimal, formatAnimalId, getAnimalPhenotype } from './animal.js';
import { weightedChoice, randomChoice, getRareAlleles, validateGenotype, hasMutation } from './genetics.js';
import { validateIV, validateWeightGene } from './inheritance.js';
import { getPersonality } from '../data/species/dog/personalities.js';
import { settleGrowth } from './growth.js';

const fail=message=>({success:false,message});
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
export const MARKET_REFRESH_PRICE=100;
export const PAID_REFRESH_MS=4*3600000;
export function paidRefreshRemaining(state,rental=false,now=Date.now()){const last=state[rental?"rentalMarket":"market"]?.lastPaidAt;return last==null?0:Math.max(0,last+PAID_REFRESH_MS-marketTime(state,now));}
export const blankMarket=()=>({day:null,listings:[]});
export function localMarketDay(now=Date.now()){
    const d=new Date(now);
    if(!Number.isFinite(d.getTime()))throw Error('市场时间无效');
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
export function marketTime(state,now=Date.now()) {return now+(state.marketClockOffsetMs??0);}
export function nextMarketRefresh(state,now=Date.now()){
    const d=new Date(marketTime(state,now));
    d.setHours(24,0,0,0);
    return d.getTime()-(state.marketClockOffsetMs??0);
}
export function priceBreakdown(animal){
    const breed=getBreed(animal.breedId), pools=getBreedAppearance(animal.breedId);
    if(!breed||!pools)throw Error('未知犬种');
    const phenotype=getAnimalPhenotype(animal);
    const rareColors=GAME_CONFIG.genetics.colorLoci.filter(l=>
        (l!=='patternColor'||phenotype.patternVisible)&&getRareAlleles(pools[l],l).includes(phenotype[l].allele));
    const base=C.breedBasePrice[breed.rarity]??C.breedBasePrice.common;
    const stage=C.stageSurcharge[animal.stage];
    if(!Number.isSafeInteger(stage))throw Error('无效成长阶段');
    const iv=Object.values(animal.iv).reduce((a,b)=>a+b,0)*C.ivUnitPrice;
    const appearance=rareColors.length*C.rareVisibleColorPrice;
    return {base,stage,iv,appearance,rareColors,total:base+stage+iv+appearance};
}
export function rentalPrice(a){const half=Math.ceil(priceBreakdown(a).total/2);return a.sex==='male'?half:half*2;}
export function generateMarket(day,now=Date.now(), rental=false,serial=0){
    const breeds=getAllBreeds();
    if(!breeds.length)throw Error('市场没有可用犬种');
    const listings=Array.from({length:C.dailyCount},(_,i)=>{
        const id=`${rental?"RENT":"MKT"}-${day}-${serial?serial+"-":""}${i+1}`;
        const breed=randomChoice(breeds);
        const stage=rental?'adult':weightedChoice(Object.entries(C.stageWeights).map(([value,weight])=>({value,weight})));
        const animal=createAnimal({id,breedId:breed.id,name:getRandomDogName(),stage,source:'market'});
        animal.timestamps.createdAt=now;animal.timestamps.hatchedAt=now;animal.timestamps.lastGrowthAt=now;
        animal.breeding={count:0,lastSuccessAt:null};
        return {id,animal,price:rental?rentalPrice(animal):priceBreakdown(animal).total,purchasedAnimalId:null,purchasedAt:null};
    });
    return {day,listings,serial};
}
// Validate persisted inventory; never silently replace damaged stock.
export function validateMarketState(market,records={},rental=false){
    if(!obj(market)||!Array.isArray(market.listings))throw Error('市场存档异常');
    if(market.lastPaidAt!=null&&(!Number.isFinite(market.lastPaidAt)||market.lastPaidAt<0))throw Error('市场冷却时间异常');
    if(market.day===null){if(market.listings.length!==0)throw Error('空市场含商品');return true;}
    if(typeof market.day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(market.day)||market.listings.length!==C.dailyCount)throw Error('市场日期或商品数量异常');
    if(market.serial!==undefined&&(!Number.isSafeInteger(market.serial)||market.serial<0))throw Error('市场刷新序号异常');
    const ids=new Set(), purchased=new Set();
    for(const l of market.listings){
        const a=l?.animal;
        if(!obj(l)||typeof l.id!=='string'||!l.id.startsWith(`${rental?"RENT":"MKT"}-${market.day}-`)||ids.has(l.id)||!obj(a)||a.id!==l.id||!getBreed(a.breedId)||a.source!=='market'||!['puppy','juvenile','adult'].includes(a.stage)||!['female','male'].includes(a.sex)||typeof a.name!=='string'||!getPersonality(a.personality)||!Number.isSafeInteger(l.price)||l.price<=0)throw Error('市场商品数据异常');
        if(rental&&(a.stage!=='adult'||(l.legacyPrice!==true&&l.price!==rentalPrice(a))))throw Error('租借商品异常');
        validateGenotype(a.genotype);validateIV(a.iv);validateWeightGene(a.weightGene);
        if(hasMutation(a.genotype)||a.pedigree?.motherId!==null||a.pedigree?.fatherId!==null||a.pedigree?.generation!==1)throw Error('市场犬只基因或血统异常');
        if(l.purchasedAnimalId!==null){
            if(typeof l.purchasedAnimalId!=='string'||purchased.has(l.purchasedAnimalId)||!Object.hasOwn(records,l.purchasedAnimalId)||!Number.isFinite(l.purchasedAt))throw Error('市场购买记录异常');
            purchased.add(l.purchasedAnimalId);
        }else if(l.purchasedAt!==null)throw Error('市场购买时间异常');
        ids.add(l.id);
    }
    return true;
}
export function marketNeedsRefresh(state,now=Date.now(),rental=false){
    const today=localMarketDay(marketTime(state,now));
    // Never reroll an already generated day when system time moves backward.
    const m=rental?state.rentalMarket:state.market;return !m?.day||m.day<today;
}
export function ensureMarketDraft(state,now=Date.now()){
    let changed=false;
    for(const rental of [false,true]) if(marketNeedsRefresh(state,now,rental)){
        const k=rental?"rentalMarket":"market",last=state[k]?.lastPaidAt;state[k]=generateMarket(localMarketDay(marketTime(state,now)),now,rental);if(last!=null)state[k].lastPaidAt=last;changed=true;
    }
    return changed;
}
export function marketPlacement(state,rental=false){
    if(rental)return Object.values(state.activeAnimals).filter(a=>a.location==='breeding').length<state.facilities.breeding.capacity?'breeding':null;
    const dogs=Object.values(state.activeAnimals);
    for(const location of ['nursery','computer'])if(dogs.filter(a=>a.location===location).length<state.facilities[location].capacity)return location;
    return null;
}
export function createMarketService({state,persist,now=()=>Date.now()}){
    let busy=false;
    function run(operation){
        if(busy)return fail('市场操作处理中');
        if(!state.initialized)return fail('请先建立犬舍');
        busy=true;
        try{
            const draft=structuredClone(state), at=now();
            const result=operation(draft,at);
            if(!result.success||result.changed===false)return result;
            validateMarketState(draft.market,draft.pedigreeRecords);
            validateMarketState(draft.rentalMarket,draft.pedigreeRecords,true);
            draft.timestamps.lastPlayedAt=at;
            if(persist(draft)===false)return fail('存档失败，市场操作未生效');
            Object.assign(state,draft);
            return result;
        }catch(e){return fail(e.message);}finally{busy=false;}
    }
    return {
        refresh(){if(state.initialized&&!marketNeedsRefresh(state,now())&&!marketNeedsRefresh(state,now(),true))return {success:true,changed:false};return run((d,at)=>({success:true,changed:ensureMarketDraft(d,at),message:'市场已更新'}));},
        paidRefresh(rental=false){return run((d,at)=>{if(paidRefreshRemaining(d,rental,at)>0)return fail('付费刷新冷却中');if(d.money<MARKET_REFRESH_PRICE)return fail('金钱不足');ensureMarketDraft(d,at);const k=rental?'rentalMarket':'market',m=d[k];const serial=(m.serial??0)+1;if(!Number.isSafeInteger(serial))return fail('刷新次数已达上限');d[k]=generateMarket(m.day,at,rental,serial);d[k].lastPaidAt=marketTime(d,at);d.money-=MARKET_REFRESH_PRICE;const message=`${rental?'租借':'购买'}市场付费刷新，扣除${MARKET_REFRESH_PRICE} G`;d.events.unshift({id:d.nextEventId++,type:'market',message,timestamp:at});return {success:true,message};});},
        buy(listingId,rental=false){return run((d,at)=>{
            if(marketNeedsRefresh(d,at,rental))return fail('市场已跨日，请刷新商品后重新选择');
            const l=(rental?d.rentalMarket:d.market).listings.find(x=>x.id===listingId);
            if(!l)return fail('该商品不存在或已经下架');
            if(l.purchasedAnimalId!==null)return fail('该犬只已售出');
            if(!Number.isSafeInteger(l.price)||l.price<=0)return fail('商品价格异常');
            if(d.money<l.price)return fail('金钱不足');
            const location=marketPlacement(d,rental);
            if(!location)return fail(rental?'繁育室已满':'饲育屋与电脑盒子均已满，请先腾出空间');
            const gameAt=gameNow(d,at);settleGrowth(d,gameAt);
            const used=new Set([...Object.keys(d.activeAnimals),...Object.keys(d.pedigreeRecords),...d.incubationTasks.flatMap(e=>[e.id,e.offspringId])]);
            let id;do{if(!Number.isSafeInteger(d.nextAnimalId)||d.nextAnimalId>=Number.MAX_SAFE_INTEGER)throw Error('犬只编号已达上限');id=formatAnimalId(d.nextAnimalId++);}while(used.has(id));
            const animal=structuredClone(l.animal);
            animal.id=id;animal.location=location;
            if(rental){animal.source='rental';animal.birthNamingUsed=true;}
            animal.timestamps.createdAt=gameAt;animal.timestamps.hatchedAt=gameAt;animal.timestamps.lastGrowthAt=gameAt;
            d.activeAnimals[id]=animal;
            d.pedigreeRecords[id]=structuredClone(animal);
            d.money-=l.price;
            l.purchasedAnimalId=id;l.purchasedAt=at;
            const message=rental?`花费 ${l.price} 租借${animal.name}，已进入繁育室。`:`花费 ${l.price} 金钱购买了${animal.name}，已入住${location==='nursery'?'饲育屋':'电脑盒子'}。`;
            d.events.unshift({id:d.nextEventId++,type:'acquisition',message,timestamp:at});
            return {success:true,animal,price:l.price,message};
        });}
    };
}
