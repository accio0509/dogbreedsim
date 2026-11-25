// Headless management simulation with actual game services. All dates and money
// are simulated; no localStorage, real save, or developer grant is used.
// Optional baseline argument: a directory containing the previous version.
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const root=process.argv[2]?path.resolve(process.argv[2]):fileURLToPath(new URL('..',import.meta.url));
const mod=p=>import(pathToFileURL(path.join(root,p)).href);
const [{createGameState},{migrateSave},{createAnimal,formatAnimalId},{gameNow},{settleGrowth},marketModule,competitionModule,trainingModule,{createExplorationService,explorationEligible},{createFormalBreeding},{checkBreedingPair},management,{getAllBreeds},{STAT_KEYS},maps]=await Promise.all(['storage/state.js','storage/save.js','engine/animal.js','engine/gameClock.js','engine/growth.js','engine/market.js','engine/competition.js','engine/training.js','engine/exploration.js','engine/formalBreeding.js','engine/breeding.js','engine/management.js','data/species/dog/breeds.js','engine/stats.js','config/exploration.js'].map(mod));
const {createMarketService}=marketModule,{createCompetitionService,competitionEligible,competitionUnlocked,competitionScore,COMPETITIONS,COMPETITION_LEVELS}=competitionModule,{createTrainingService,trainingEligible,trainingGain}=trainingModule;
const {FACILITIES,upgradeFacility}=management;
const revised=typeof management.retireAnimal==='function';
const H=3600000, T=Date.parse('2026-01-01T00:00:00Z');
const options=[
 {name:'休闲',logins:2,speed:1,limit:6,maps:['wetland','forest'],comp:0,train:0,market:'weekly'},
 {name:'活跃',logins:8,speed:1,limit:10,maps:['park','field'],comp:3,train:100,market:'weekly'},
 {name:'繁育',logins:2,speed:1,limit:16,maps:['wetland','forest','snow'],comp:1,train:0,breed:true,market:'weekly'},
 {name:'竞技',logins:8,speed:1,limit:6,maps:['park'],comp:4,train:300,market:'weekly'},
 {name:'收集',logins:2,speed:1,limit:28,maps:['field','wetland','forest','snow','park'],comp:0,train:0,market:'collector'},
 {name:'高倍速',logins:8,speed:10,limit:10,maps:['park','field'],comp:3,train:100,market:'weekly'}
];
const seed=Number(process.env.SIM_SEED??20261125),days=Number(process.env.SIM_DAYS??365);
function rngFor(n){let x=n>>>0;return ()=>{x=(Math.imul(1664525,x)+1013904223)>>>0;return x/4294967296;};}
function iv(a){return Object.values(a.iv).reduce((n,x)=>n+x,0);}function ev(a){return Object.values(a.ev).reduce((n,x)=>n+x,0);}
function bestEvent(a){return COMPETITIONS.reduce((c,x)=>competitionScore(a,x)>competitionScore(a,c)?x:c);}
function dogs(s){return Object.values(s.activeAnimals).filter(a=>a.source!=='rental');}
function countLocation(s,k){return dogs(s).filter(a=>a.location===k).length;}
function compactSimulationLogs(s){
 // Only first win of each unlock key is needed for future simulation decisions.
 // Count every completed result and event separately; never compact production saves.
 const wins=new Map();for(const r of s.competitionRecords){if(r.rank===1){const k=[r.animalId,r.stage,r.eventId,r.levelId].join(':');if(!wins.has(k))wins.set(k,r);}}
 s.competitionRecords=[...wins.values()];s.events=s.events.slice(0,8);
}
function simulate(o){
 const oldRandom=Math.random;Math.random=rngFor(seed);const s=createGameState();s.initialized=true;s.kennelName='模拟犬舍';s.gameClock={gameAt:T,realAt:T,speed:o.speed};s.timestamps={createdAt:T,lastPlayedAt:T};
 let real=T;const now=()=>gameNow(s,real),persist=()=>true;
 for(const sex of ['female','male']){const id=formatAnimalId(s.nextAnimalId++),a=createAnimal({id,breedId:'corgi',sex,name:'初始'+sex,stage:'puppy',source:'starter'});a.timestamps.createdAt=a.timestamps.hatchedAt=a.timestamps.lastGrowthAt=T;a.breeding={count:0,lastSuccessAt:null};s.activeAnimals[id]=a;s.pedigreeRecords[id]=structuredClone(a);}
 const market=createMarketService({state:s,persist,now:()=>real}),cmp=createCompetitionService({state:s,persist,now}),training=createTrainingService({state:s,persist,now}),explore=createExplorationService({state:s,persist,now}),breed=createFormalBreeding({state:s,persist,now});
 const M={income:0,competitionIncome:0,explorationIncome:0,upgrades:0,purchases:0,refreshes:0,purchased:0,adopted:0,bred:0,advancedEggs:0,hatched:0,retired:0,matches:0,wins:0,advancedMatches:0,advancedWins:0,blockedEggClaims:0,trainingClaims:0,peakDogs:2,maxDay:null,firstRetire:null};let snapshots=[];
 function action(fn,category){const before=s.money,r=fn();if(r?.success){const diff=s.money-before;if(diff>0){M.income+=diff;if(category==='competition')M.competitionIncome+=diff;else if(category==='explore')M.explorationIncome+=diff;}else if(diff<0){if(category==='upgrade')M.upgrades-=diff;else if(category==='buy')M.purchases-=diff;else if(category==='refresh')M.refreshes-=diff;}}return r;}
 function trim(day){if(!revised)return;while(dogs(s).length>o.limit){const all=dogs(s),freq=new Map();for(const a of all)freq.set(a.breedId,(freq.get(a.breedId)??0)+1);const candidates=all.filter(a=>a.activity==null).sort((a,b)=>Number((freq.get(b.breedId)??0)>1)-Number((freq.get(a.breedId)??0)>1)||Number(a.stage==='adult')-Number(b.stage==='adult')||ev(a)-ev(b)||iv(a)-iv(b));if(!candidates.length)break;const r=management.retireAnimal(s,candidates[0].id,now());if(!r.success)break;M.retired++;M.firstRetire??=day;}}
 function buy(day){if(o.market==='weekly'&&(day-1)%7!==0)return;const all=dogs(s),seen=new Set(Object.values(s.pedigreeRecords).map(a=>a.breedId));if(o.market==='weekly'&&all.length>=o.limit)return;if(o.market==='collector'&&seen.size>=getAllBreeds().length)return;
   function candidates(){return s.market.listings.filter(l=>l.purchasedAnimalId==null&&l.price+250<=s.money&&(o.market!=='collector'||!seen.has(l.animal.breedId))).sort((a,b)=>o.market==='collector'?a.price-b.price:iv(b.animal)-iv(a.animal)||a.price-b.price);}
   let list=candidates();if(!list.length&&o.market==='collector'&&market.paidRefresh&&s.money>=650){if(action(()=>market.paidRefresh(),'refresh').success)list=candidates();}if(list.length&&action(()=>market.buy(list[0].id),'buy').success)M.purchased++;
 }
 function upgrade(day){const keys=(o.breed||o.comp>=4)?['incubation','nursery','computer','breeding']:['nursery','computer','incubation','breeding'];for(const k of keys){const f=FACILITIES[k];if(s.facilities[k].capacity>=f.max)continue;const p=management.facilityPrice?management.facilityPrice(s,k):f.price;if(s.money>=p+300){action(()=>upgradeFacility(s,k),'upgrade');break;}}
   if(M.maxDay===null&&Object.entries(FACILITIES).every(([k,f])=>s.facilities[k].capacity>=f.max))M.maxDay=day;
 }
 function breedIdle(){if(!o.breed)return;while(s.incubationTasks.length<s.facilities.incubation.capacity){const all=dogs(s).filter(a=>a.stage==='adult'&&a.activity==null&&['nursery','computer'].includes(a.location)).sort((a,b)=>iv(b)-iv(a));let pair;for(const m of all.filter(a=>a.sex==='female')){for(const f of all.filter(a=>a.sex==='male')){const c=checkBreedingPair(m,f,s.pedigreeRecords,now());if(c.success&&c.inbreedingCoefficient<=.0625){pair=[m.id,f.id];break;}}if(pair)break;}if(!pair)break;const r=breed.breed(...pair);if(!r.success)break;M.bred++;}}
 function promote(){let n=countLocation(s,'nursery');for(const a of dogs(s).filter(a=>a.activity==null&&['computer','pending'].includes(a.location)).sort((a,b)=>Number(b.stage==='adult')-Number(a.stage==='adult')||ev(b)-ev(a))){if(n>=s.facilities.nursery.capacity)break;a.location='nursery';a.timestamps.lastGrowthAt=now();n++;}}
 function assign(){let eligible=dogs(s).filter(explorationEligible);for(const mapId of o.maps){if(s.explorationTasks.some(t=>t.mapId===mapId))continue;const a=eligible.sort((a,b)=>Number(a.stage==='adult')-Number(b.stage==='adult')||ev(a)-ev(b))[0];if(a&&explore.start(mapId,a.id).success)eligible=eligible.filter(x=>x.id!==a.id);}
   let slots=Math.max(0,o.comp-s.competitionTasks.length-s.trainingTasks.length);if(!slots)return;
   const adult=dogs(s).filter(a=>a.stage==='adult'&&competitionEligible(a)).sort((a,b)=>ev(b)-ev(a)||competitionScore(b,bestEvent(b))-competitionScore(a,bestEvent(a)));
   for(const a of adult){if(slots<=0)break;const c=bestEvent(a);if(o.train&&ev(a)<o.train&&trainingEligible(a)){const key=c.stats.find(k=>trainingGain(a,k)>0)??STAT_KEYS.find(k=>trainingGain(a,k)>0);if(key&&training.start(a.id,key).success){slots--;continue;}}
     const pending=s.competitionTasks.filter(t=>t.levelId==='advanced').length;const advancedRoom=!revised||s.incubationTasks.length+pending<s.facilities.incubation.capacity;const levels=[...COMPETITION_LEVELS].reverse().filter(l=>(l.id!=='advanced'||advancedRoom)&&competitionUnlocked(s,a,c.id,l.id));if(levels.length&&cmp.start(a.id,c.id,levels[0].id).success)slots--;
   }
 }
 try{for(let day=1;day<=days;day++){for(let session=0;session<o.logins;session++){
   real=T+(day-1)*24*H+session*(24*H/o.logins);settleGrowth(s,now());
   if(session===0)market.refresh();
   for(const e of [...s.incubationTasks])if(now()>=e.hatchAt){const r=breed.claim(e.id,'');if(r.success)M.hatched++;}
   for(const t of [...s.trainingTasks])if(now()>=t.endsAt){if(training.claim(t.animalId).success)M.trainingClaims++;}
   for(const t of [...s.competitionTasks])if(now()>=t.endsAt){const before=s.incubationTasks.length,r=action(()=>cmp.claim(t.animalId),'competition');if(r.success){M.matches++;M.wins+=Number(t.rank===1);if(t.levelId==='advanced'){M.advancedMatches++;M.advancedWins+=Number(t.rank===1);}M.advancedEggs+=s.incubationTasks.length-before;}else if(r.message.includes('孵化室已满'))M.blockedEggClaims++;else throw Error(r.message);}
   for(const t of [...s.explorationTasks])if(now()>=t.endsAt){const all=dogs(s),seen=new Set(Object.values(s.pedigreeRecords).map(a=>a.breedId));const adopt=!!t.reward.puppy&&(o.market==='collector'?!seen.has(t.reward.puppy.breedId)||all.length<6:all.length<o.limit);let r=action(()=>explore.claim(t.mapId,{adopt}),'explore');if(!r.success&&adopt)r=action(()=>explore.claim(t.mapId,{adopt:false}),'explore');if(!r.success)throw Error(r.message);if(r.puppy)M.adopted++;}
   M.peakDogs=Math.max(M.peakDogs,dogs(s).length);trim(day);promote();
   if(session===0){buy(day);upgrade(day);trim(day);promote();}
   breedIdle();assign();compactSimulationLogs(s);
 }
 if([30,90,365,days].includes(day)){migrateSave(s);const records=Object.values(s.pedigreeRecords);snapshots.push({day,money:s.money,active:dogs(s).length,retired:records.filter(a=>a.retired).length,breeds:new Set(records.map(a=>a.breedId)).size,ivMax:Math.max(...records.map(iv)),facilities:Object.fromEntries(Object.entries(s.facilities).map(([k,v])=>[k,v.capacity])),pending:countLocation(s,'pending'),...M});}}
 return {strategy:o.name,logins:o.logins,speed:o.speed,snapshots};
 }finally{Math.random=oldRandom;}
}
const results=[];for(const o of options.filter(x=>!process.env.SIM_ONLY||process.env.SIM_ONLY===x.name)){const r=simulate(o);results.push(r);console.error(`${revised?'新版':'旧版'} ${o.name} ${days}天：${JSON.stringify(r.snapshots.at(-1))}`);}
console.log(JSON.stringify({version:revised?'balance':'baseline',seed,days,assumptions:'实际引擎；每次登录领取已完成任务并按固定策略安排下一任务；只对模拟事件日志和重复赛事记录做压缩，保留解锁所需冠军记录；生产游戏不压缩；单种随机种子。',results},null,2));
