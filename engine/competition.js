import {createAnimal,formatAnimalId} from './animal.js';
import {validateGenotype,hasMutation} from './genetics.js';
import {validateIV,validateWeightGene} from './inheritance.js';
import {getAllBreeds,getBreed} from '../data/species/dog/breeds.js';
import {getRandomDogName} from '../data/species/dog/names.js';
import {gameNow} from './gameClock.js';
import {calculateStats,STAT_KEYS} from './stats.js';
import {getPersonality} from '../data/species/dog/personalities.js';
import {GAME_CONFIG} from '../config/game.js';
import {settleGrowth} from './growth.js';
export const COMPETITIONS=[
 {id:'sprint',name:'竞速赛',stats:['SPD','AGI','STA']},
 {id:'obstacle',name:'障碍赛',stats:['AGI','SPD','INT']},
 {id:'obedience',name:'服从赛',stats:['INT','PER','AGI']},
 {id:'search',name:'搜寻赛',stats:['PER','STA','INT']},
 {id:'endurance',name:'耐力赛',stats:['STA','SPD','STR']},
 {id:'strength',name:'力量赛',stats:['STR','STA','SPD']},
 {id:'allround',name:'综合赛',stats:[...STAT_KEYS]}
];
export const COMPETITION_LEVELS=[{id:'beginner',name:'初级',min:65,max:95,money:1},{id:'intermediate',name:'中级',min:80,max:110,money:1.5},{id:'advanced',name:'高级',min:95,max:125,money:2}];
export const COMPETITION_HOURS=1;
export function competitionRange(eventId,level){if(eventId==='allround'){const ranges={beginner:[65,95],intermediate:[80,105],advanced:[90,115]};const r=ranges[level.id];if(r)return {min:r[0],max:r[1]};}return {min:level.min,max:level.max};}
function rewardData(rng){const breeds=getAllBreeds(),breed=breeds[Math.floor(rng()*breeds.length)];return createAnimal({id:'COMPETITION_REWARD',breedId:breed.id,name:getRandomDogName(),stage:'puppy',source:'competition'});}
export const RANK_PRIZES=[45,30,20,10,5,3];
const H=3600000, fail=message=>({success:false,message});
export const competitionEligible=a=>!!a&&['puppy','juvenile','adult'].includes(a.stage)&&!a.retired&&a.source!=='rental'&&a.location==='nursery'&&a.activity==null;
// Unlocks are derived from claimed wins, never mutable counters.
export function competitionUnlocked(state,animal,eventId,levelId){
 const level=COMPETITION_LEVELS.findIndex(l=>l.id===levelId);
 if(!animal||level<0||!COMPETITIONS.some(c=>c.id===eventId))return false;
 return COMPETITION_LEVELS.slice(0,level).every(l=>(state.competitionRecords??[]).some(r=>r.animalId===animal.id&&r.stage===animal.stage&&r.eventId===eventId&&r.levelId===l.id&&r.rank===1));
}
export function competitionHonors(state,id){const groups=new Map();for(const r of state.competitionRecords??[]){if(r.animalId!==id||r.rank!==1)continue;const key=[r.stage,r.eventId,r.levelId].join(':');if(!groups.has(key))groups.set(key,{stage:r.stage,eventId:r.eventId,levelId:r.levelId,count:0});groups.get(key).count++;}return [...groups.values()];}
export function competitionScore(a,c){const s=calculateStats(a);return Math.round(c.stats.length===3?s[c.stats[0]]*.5+s[c.stats[1]]*.3+s[c.stats[2]]*.2:c.stats.reduce((n,k)=>n+s[k],0)/c.stats.length);}
export function competitionPrize(a,level,rank){return Math.floor(RANK_PRIZES[rank-1]*level.money*(getPersonality(a.personality)?.effects?.competitionMoney??1)+1e-8);}
function validResult(t){return COMPETITIONS.some(c=>c.id===t.eventId)&&COMPETITION_LEVELS.some(l=>l.id===t.levelId)&&['puppy','juvenile','adult'].includes(t.stage)&&Number.isSafeInteger(t.startedAt)&&[H,4*H].includes(t.endsAt-t.startedAt)&&Number.isInteger(t.score)&&t.score>=0&&Number.isInteger(t.rank)&&t.rank>=1&&t.rank<=6&&Number.isSafeInteger(t.money)&&t.money>=0&&(t.opponents===undefined||(Array.isArray(t.opponents)&&t.opponents.length===5&&t.opponents.every(v=>Number.isSafeInteger(v)&&v>=0)&&t.rank===1+t.opponents.filter(v=>v>t.score).length));}
export function validateCompetitionState(s){const seen=new Set();for(const t of s.competitionTasks??[]){const a=s.activeAnimals[t?.animalId];if(!a||seen.has(a.id)||a.activity!=='competition'||a.stage!==t.stage||a.location!=='nursery'||a.retired||a.source==='rental'||!validResult(t))throw Error('比赛任务异常');if(t.eggReward!==undefined){const p=t.eggReward;if(t.levelId!=='advanced'||p?.id!=='COMPETITION_REWARD'||p.source!=='competition'||p.stage!=='puppy'||!getBreed(p.breedId)||!['male','female'].includes(p.sex)||typeof p.name!=='string'||!getPersonality(p.personality)||p.pedigree?.generation!==1||p.pedigree.motherId!==null||p.pedigree.fatherId!==null||hasMutation(p.genotype))throw Error('比赛奖励犬蛋数据异常');validateGenotype(p.genotype);validateIV(p.iv);validateWeightGene(p.weightGene);}seen.add(a.id);}for(const a of Object.values(s.activeAnimals))if(a.activity==='competition'&&!seen.has(a.id))throw Error('比赛任务丢失');for(const r of s.competitionRecords??[])if(!r||!validResult(r)||!s.pedigreeRecords[r.animalId]||typeof r.name!=='string'||!Number.isSafeInteger(r.claimedAt)||r.claimedAt<r.endsAt)throw Error('比赛记录异常');return true;}
export function createCompetitionService({state,persist,now=()=>gameNow(state),rng=Math.random}){let busy=false;function run(op){if(busy||!state.initialized)return fail('当前不可操作');busy=true;try{const d=structuredClone(state),at=now();settleGrowth(d,at);const r=op(d,at);if(!r.success)return r;validateCompetitionState(d);d.events.unshift({id:d.nextEventId++,type:'competition',message:r.message,timestamp:at});d.timestamps.lastPlayedAt=at;if(persist(d)===false)return fail('存档失败');Object.assign(state,d);return r;}catch(e){return fail(e.message);}finally{busy=false;}}
return {start(id,eventId,levelId='beginner'){return run((d,at)=>{const a=d.activeAnimals[id],c=COMPETITIONS.find(x=>x.id===eventId),level=COMPETITION_LEVELS.find(x=>x.id===levelId);if(!competitionEligible(a)||!c||!level)return fail('请选择空闲饲育屋自有犬及有效比赛项目和等级');if(!competitionUnlocked(d,a,eventId,levelId))return fail('尚未解锁：请先获得同年龄组、同项目的前置等级冠军');const scale=GAME_CONFIG.growth.stageMultiplier[a.stage],score=competitionScore(a,c)+Math.floor(rng()*11*scale),range=competitionRange(eventId,level),opponents=Array.from({length:5},()=>Math.round((range.min+Math.floor(rng()*(range.max-range.min+1)))*scale)),rank=1+opponents.filter(v=>v>score).length,money=competitionPrize(a,level,rank);a.activity='competition';a.timestamps.lastGrowthAt=at;d.competitionTasks.push({animalId:id,eventId,levelId,stage:a.stage,startedAt:at,endsAt:at+COMPETITION_HOURS*H,score,rank,money,opponents,...(levelId==='advanced'?{eggReward:rewardData(rng)}:{})});return {success:true,message:`${a.name}参加${level.name}${c.name}`};});},claim(id){return run((d,at)=>{const t=d.competitionTasks.find(t=>t.animalId===id),a=d.activeAnimals[id];if(!t||at<t.endsAt)return fail('比赛尚未完成或已领取');if(!Number.isSafeInteger(d.money+t.money))return fail('金钱已达上限');let reward=false;if(t.levelId==='advanced'){if(d.incubationTasks.length>=d.facilities.incubation.capacity)return fail('高级赛奖励犬蛋：孵化室已满，请先领取其他幼犬');const used=new Set([...Object.keys(d.activeAnimals),...Object.keys(d.pedigreeRecords),...d.incubationTasks.flatMap(e=>[e.id,e.offspringId])]);let id,eggId;do{if(!Number.isSafeInteger(d.nextAnimalId)||d.nextAnimalId>=Number.MAX_SAFE_INTEGER)throw Error('犬只编号已达上限');const n=d.nextAnimalId++;id=formatAnimalId(n);eggId='EGG'+String(n).padStart(5,'0');}while(used.has(id)||used.has(eggId));const offspringData={...structuredClone(t.eggReward??rewardData(rng)),id};d.incubationTasks.push({id:eggId,offspringId:id,species:'dog',breedId:offspringData.breedId,motherId:null,fatherId:null,source:'competition',createdAt:at,hatchAt:at+24*H,offspringData});reward=eggId;}d.money+=t.money;const {eggReward,...record}=t;d.competitionRecords.push({...record,name:a.name,claimedAt:at,...(reward?{rewardEggId:reward}:{})});a.activity=null;a.timestamps.lastGrowthAt=at;d.competitionTasks=d.competitionTasks.filter(x=>x!==t);return {success:true,message:`${a.name}获得第${t.rank}名，奖金${t.money} G${reward?"，获得奖励犬蛋":""}`};});}};}

export function competitionProgress(t,name,now){
 const p=Math.max(0,Math.min(1,(now-t.startedAt)/(t.endsAt-t.startedAt)));
 if(p>=1)return `${name}比赛结束，获得第${t.rank}名，等待领取奖金${t.levelId==='advanced'?"与犬蛋":""}。`;
 if(p<.15)return `${name}等待上场中。`;
 if(p<.3)return `${name}正在热身，原地转圈。`;
 const actions={sprint:'正在全力奔跑',obstacle:'正在跨越障碍',obedience:'正在完成指令',search:'正在嗅闻寻找目标',endurance:'正在保持跑步节奏',strength:'正在完成力量挑战',allround:'正在完成综合挑战'};
 if(p<.5)return `${name}${actions[t.eventId]??'正在比赛'}。`;
 if(p<.85){if(!Array.isArray(t.opponents))return `${name}正在等待阶段评分。`;const stageScore=Math.floor(t.score*p);const rank=1+t.opponents.filter(v=>Math.floor(v*p)>stageScore).length;return `${name}当前得分${stageScore}分，暂列第${rank}名。`;}
 return `${name}完成最后一项挑战，等待裁判确认成绩。`;
}
