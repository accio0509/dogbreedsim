import {ITEMS} from './training.js';
import {gameNow} from './gameClock.js';
import { forceExplorationPuppies } from './exploration.js';
import { GAME_CONFIG } from '../config/game.js';
import { ensureMarketDraft } from './market.js';
import { settleGrowth } from './growth.js';
import { createAnimal, formatAnimalId } from './animal.js';
import { getPlacement } from './breedingIntegration.js';
import { createGameState } from '../storage/state.js';
import { migrateSave, SAVE_KEY } from '../storage/save.js';

export const DEV_SAVE_KEY = `${SAVE_KEY}:dev`;
export const HOUR = 3600000;
export function advanceTestTime(state, hours, now=gameNow(state)) {
    if (!Number.isFinite(hours) || hours<=0 || hours>168) throw Error('快进时间须大于0且不超过168小时');
    settleGrowth(state, now);
    const duration=hours*HOUR, end=now+duration;
    const chunk=GAME_CONFIG.growth.offlineMaxHours*HOUR;
    for(let at=now;at<end;) {at=Math.min(end,at+chunk);settleGrowth(state,at);}
    // Rebase timers to real time, so no permanent simulated clock is needed.
    for(const a of Object.values(state.activeAnimals)) {
        a.timestamps.lastGrowthAt=now;
        if(Number.isFinite(a.breeding?.lastSuccessAt)) a.breeding.lastSuccessAt-=duration;
    }
    for(const t of state.explorationTasks??[]) {t.startedAt-=duration;t.endsAt-=duration;t.lastSettledAt-=duration;}
    for(const t of [...(state.trainingTasks??[]),...(state.competitionTasks??[])]) {t.startedAt-=duration;t.endsAt-=duration;}
    for(const egg of state.incubationTasks) {egg.createdAt-=duration;egg.hatchAt-=duration;}
    state.marketClockOffsetMs=(state.marketClockOffsetMs??0)+Math.round(duration);
    ensureMarketDraft(state,state.gameClock?Date.now():now);
}

export function applyDevAction(state, action, {now=gameNow(state),hours,breedId}={}) {
    if(!state.initialized)throw Error('请先建立犬舍或复制正式存档');
    const dogs=Object.values(state.activeAnimals);
    if(action==='advance')advanceTestTime(state,hours,now);
    else if(action==='training-items') {for(const k of Object.keys(ITEMS)) {const n=(state.inventory[k]??0)+10;if(!Number.isSafeInteger(n))throw Error('道具数量已达上限');state.inventory[k]=n;}}
    else if(action==='exploration-witch') {for(const t of state.explorationTasks)if(!t.reward.extraClaimed)t.reward.witch=true;}
    else if(action==='exploration-puppies') forceExplorationPuppies(state,now);
    else if(action==='market-money') {
        if(!Number.isSafeInteger(state.money+1000))throw Error('金钱已达上限');state.money+=1000;
    } else if(action==='adult') {
        settleGrowth(state,now);
        for(const a of dogs)if(!a.retired&&a.activity==null){a.stage='adult';a.exp=GAME_CONFIG.growth.adultExp;a.timestamps.lastGrowthAt=now;}
    } else if(action==='hatch') {
        for(const e of state.incubationTasks)if(e.hatchAt>now){const delta=e.hatchAt-now;e.hatchAt-=delta;e.createdAt-=delta;}
    } else if(action==='cooldown'||action==='counts') {
        for(const a of dogs){a.breeding??={count:0,lastSuccessAt:null};if(action==='cooldown'){if(a.breeding.count>0)a.breeding.lastSuccessAt=Math.min(a.breeding.lastSuccessAt,now-GAME_CONFIG.breeding.cooldownHours*HOUR);}else {a.breeding.count=0;a.breeding.lastSuccessAt=null;delete a.breeding.cooldownReductionMs;}}
    } else if(action==='pair') {
        const used=new Set([...Object.keys(state.activeAnimals),...Object.keys(state.pedigreeRecords),...state.incubationTasks.flatMap(e=>[e.id,e.offspringId])]);
        for(const sex of ['female','male']) {
            let id;do{id=formatAnimalId(state.nextAnimalId++);}while(used.has(id));used.add(id);
            const a=createAnimal({id,breedId,sex,stage:'adult',name:sex==='female'?'测试母犬':'测试公犬',location:getPlacement({animals:Object.values(state.activeAnimals)},{nursery:state.facilities.nursery.capacity,computer:state.facilities.computer.capacity})});
            a.breeding={count:0,lastSuccessAt:null};a.timestamps.lastGrowthAt=now;
            state.activeAnimals[id]=a;state.pedigreeRecords[id]=structuredClone(a);
        }
    } else if(action!=='save')throw Error('未知开发操作');
    state.timestamps.lastPlayedAt=now;
}

// Persist before touching the live state; all callers use the isolated dev store.
export function commitDevState(state,persist,makeCandidate) {
    const candidate=migrateSave(makeCandidate(structuredClone(state)));
    if(persist(candidate)===false)throw Error('测试存档写入失败');
    for(const k of Object.keys(state))if(!Object.hasOwn(candidate,k))delete state[k];
    Object.assign(state,candidate);
    return candidate;
}
export const blankDevState=()=>createGameState();
