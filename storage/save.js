import {migrateGeneticsIds} from './geneticsMigration.js';
import {validateClock} from '../engine/gameClock.js';
import {validateCompetitionState} from '../engine/competition.js';
import {validateTrainingState} from '../engine/training.js';
import { validateExplorationState } from '../engine/exploration.js';
import { GAME_CONFIG } from '../config/game.js';
import { createGameState } from './state.js';
import { validateMarketState } from '../engine/market.js';
import { getBreed } from '../data/species/dog/breeds.js';

export const SAVE_KEY = 'dogbreedsim:save';
const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);

export function migrateSave(raw) {
    if (!object(raw)) throw Error('存档不是有效对象');
    if (!['0.2.0','0.3.0','0.4.0','0.5.0','0.6.0','0.7.0','0.8.0','0.9.0','0.10.0','1.0.0-rc.1','1.0.0',GAME_CONFIG.version].includes(raw.version)) throw Error('不支持的存档版本：'+raw.version);
    const s = migrateGeneticsIds(structuredClone(raw));
    if (!object(s.activeAnimals) || !object(s.pedigreeRecords)) throw Error('犬只或家谱档案损坏');
    if (typeof s.initialized !== 'boolean' || !Number.isFinite(s.money) || !Number.isSafeInteger(s.nextAnimalId) || s.nextAnimalId < 1 || !Number.isSafeInteger(s.nextEventId) || s.nextEventId < 1) throw Error('存档基础字段异常');
    const defaults = createGameState();
    for (const key of ['facilities','timestamps','inventory']) {
        if (s[key] === undefined) s[key] = defaults[key];
        if (!object(s[key])) throw Error('存档字段异常：'+key);
    }
    for (const [k,v] of Object.entries(defaults.facilities)) {
        if (s.facilities[k] === undefined) s.facilities[k] = v;
        const n = s.facilities[k]?.capacity;
        if (!Number.isInteger(n) || n < 1 || n > ({breeding:5,incubation:5,nursery:30,computer:180}[k])) throw Error('设施容量异常：'+k);
    }
    for (const key of ['breedingTasks','incubationTasks','explorationTasks','trainingTasks','competitionTasks','competitionRecords','events']) {
        if (s[key] === undefined) s[key] = [];
        if (!Array.isArray(s[key])) throw Error('存档列表异常：'+key);
    }
    if (s.breedingTasks.length) throw Error('存在未完成的旧繁育任务，请先备份并迁移');
    if (s.eggs !== undefined) {
        if (!Array.isArray(s.eggs)) throw Error('犬蛋列表异常');
        if (s.eggs.length && s.incubationTasks.length) throw Error('存在两份犬蛋列表，需手动核对');
        if (s.eggs.length) s.incubationTasks = s.eggs;
        delete s.eggs;
    }
    const ids = new Set();
    for (const [id,a] of Object.entries(s.activeAnimals)) {
        if (!object(a) || a.id !== id || !getBreed(a.breedId) || !object(a.timestamps) || !object(a.pedigree) || !object(s.pedigreeRecords[id])) throw Error('犬只记录异常：'+id);
        ids.add(id);
        if(a.witchChanges!==undefined&&(!object(a.witchChanges)||!Number.isInteger(a.witchChanges.iv)||a.witchChanges.iv<0||a.witchChanges.iv>3||!Number.isInteger(a.witchChanges.gene)||a.witchChanges.gene<0||a.witchChanges.gene>1))throw Error('女巫改造次数异常');
        for(const flag of ['luckyCharm','mutationPollen'])if(a[flag]!==undefined&&typeof a[flag]!=='boolean')throw Error('道具状态异常');
        if (a.breeding == null) a.breeding = {count:0,lastSuccessAt:null};
    }
    for (const e of s.incubationTasks) {
        if (!object(e) || typeof e.id !== 'string' || typeof e.offspringId !== 'string' || e.id===e.offspringId || ids.has(e.id) || ids.has(e.offspringId) || Object.hasOwn(s.pedigreeRecords,e.offspringId) || e.offspringData?.id!==e.offspringId || !Number.isFinite(e.createdAt) || !Number.isFinite(e.hatchAt) || e.hatchAt<=e.createdAt) throw Error('犬蛋数据异常，原存档未覆盖');
        ids.add(e.id);ids.add(e.offspringId);
    }
    if (s.market === undefined) s.market = defaults.market;
    if (s.marketClockOffsetMs === undefined) s.marketClockOffsetMs = 0;
    if (!Number.isSafeInteger(s.marketClockOffsetMs) || s.marketClockOffsetMs < 0) throw Error('市场时间偏移异常');
    validateMarketState(s.market,s.pedigreeRecords);
    s.rentalMarket ??= defaults.rentalMarket;
    validateMarketState(s.rentalMarket,s.pedigreeRecords,true);
    const rented=Object.values(s.activeAnimals).filter(a=>a.source==='rental'||a.location==='breeding');
    if(rented.length>s.facilities.breeding.capacity||rented.some(a=>a.source!=='rental'||a.location!=='breeding'||a.stage!=='adult'||a.breeding?.count!==0))throw Error('租借犬状态异常');
    validateExplorationState(s);
    validateTrainingState(s);
    s.gameClock ??= null; validateClock(s.gameClock); validateCompetitionState(s);
    s.version = GAME_CONFIG.version;
    return s;
}

// The whole document is stored under one key; refuse stale tabs rather than overwrite.
export function createSaveStore(storage, key=SAVE_KEY) {
    let expected = storage.getItem(key);
    return {
        load(){ return expected === null ? null : migrateSave(JSON.parse(expected)); },
        reset(){
            if (storage.getItem(key)!==expected) throw Error('存档已在其他页面修改，请刷新后重试');
            if(expected!==null) storage.setItem(key+':reset-backup',expected);
            const fresh=JSON.stringify(createGameState());
            storage.setItem(key,fresh);
            expected=fresh;
            return true;
        },
        save(candidate){
            if (storage.getItem(key)!==expected) throw Error('存档已在其他页面修改，请刷新后重试');
            const serialized = JSON.stringify(candidate);
            storage.setItem(key,serialized);
            expected=serialized;
            return true;
        }
    };
}
