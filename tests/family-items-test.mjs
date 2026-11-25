import assert from 'node:assert/strict';
import {buildFamilyGraph} from '../engine/familyGraph.js';
import {createGameState} from '../storage/state.js';
import {createAnimal} from '../engine/animal.js';
import {createTrainingService,ITEMS} from '../engine/training.js';
import {buyItem,ITEM_PRICES} from '../engine/management.js';
import {getCooldownEnd} from '../engine/breeding.js';
import {migrateSave} from '../storage/save.js';
const H=3600000,T=1700000000000;
let passed=0;function test(name,fn){fn();passed++;console.log('PASS',name);}
function setup(){const s=createGameState();s.initialized=true;s.money=10000;const a=createAnimal({id:'A',breedId:'chihuahua',stage:'adult',location:'nursery',personality:'brave'});a.timestamps.lastGrowthAt=T;a.breeding={count:1,lastSuccessAt:T};s.activeAnimals.A=a;s.pedigreeRecords.A=structuredClone(a);for(const k of Object.keys(ITEMS))s.inventory[k]=4;return {s,service:createTrainingService({state:s,persist:()=>true,now:()=>T})};}
const records={};function dog(id,fatherId=null,motherId=null){records[id]={id,name:id,breedId:'chihuahua',pedigree:{fatherId,motherId}};}
dog('great');dog('grand','great');dog('father','grand');dog('mother');dog('focus','father','mother');dog('sibling','father','mother');dog('halfMother');dog('half','father','halfMother');dog('mate');dog('child','focus','mate');dog('grandchild','child');dog('g3','grandchild');dog('g4','g3');dog('g5','g4');dog('unrelated');dog('pendingMate');
test('四代直系，不显示旁系或配偶',()=>{const g=buildFamilyGraph(records,'focus');const ids=g.nodes.map(n=>n.id);for(const id of ['great','grand','father','mother','focus','child','grandchild','g3','g4'])assert(ids.includes(id));for(const id of ['sibling','half','mate','g5','unrelated'])assert(!ids.includes(id));});
test('完整版包括多代、半同胞及配种亲本，不含无关犬',()=>{const g=buildFamilyGraph(records,'focus',true,[{fatherId:'focus',motherId:'pendingMate'}]);const ids=g.nodes.map(n=>n.id);assert(ids.includes('g5')&&ids.includes('half')&&ids.includes('sibling')&&ids.includes('mate')&&ids.includes('pendingMate'));assert(!ids.includes('unrelated'));assert(g.pairs.some(p=>p.father==='focus'&&p.mother==='pendingMate'&&p.pending===1));});
test('所有正常亲本节点在子女上方，切换中心不丢失家谱',()=>{const g=buildFamilyGraph(records,'child',true);const map=new Map(g.nodes.map(n=>[n.id,n]));assert(!g.cycle);assert(g.edges.every(e=>map.get(e.parent).y<map.get(e.child).y));assert.equal(g.nodes.length,new Set(g.nodes.map(n=>n.id)).size);assert(map.has('half'));});
test('循环异常不会无限展开',()=>{const g=buildFamilyGraph({a:{id:'a',pedigree:{fatherId:'b'}},b:{id:'b',pedigree:{fatherId:'a'}}},'a',true);assert(g.cycle);assert.equal(g.nodes.length,2);});
test('道具购买价格一致',()=>{const {s}=setup();for(const [k,p] of Object.entries(ITEM_PRICES)){const before=s.money,n=s.inventory[k];assert(buyItem(s,k).success);assert.equal(s.money,before-p);assert.equal(s.inventory[k],n+1);}});
test('营养剂限制单项及总EV',()=>{const {s,service}=setup();s.activeAnimals.A.ev.STR=95;assert(service.useItem('A','ev_boost','STR').success);assert.equal(s.activeAnimals.A.ev.STR,100);assert(!service.useItem('A','ev_boost','STR').success);assert.equal(s.inventory.ev_boost,3);Object.assign(s.activeAnimals.A.ev,{SPD:100,STA:95});assert(service.useItem('A','ev_boost','INT').success);assert.equal(s.activeAnimals.A.ev.INT,5);});
test('单项重置不影响其他属性',()=>{const {s,service}=setup();Object.assign(s.activeAnimals.A.ev,{STR:35,SPD:20});assert(service.useItem('A','ev_single_reset','STR').success);assert.equal(s.activeAnimals.A.ev.STR,0);assert.equal(s.activeAnimals.A.ev.SPD,20);assert(!service.useItem('A','ev_single_reset','STR').success);});
test('性格卡保留基因和IV',()=>{const {s,service}=setup();const a=structuredClone(s.activeAnimals.A);assert(service.useItem('A','calm_card').success);assert.equal(s.activeAnimals.A.personality,'calm');assert.deepEqual(s.activeAnimals.A.genotype,a.genotype);assert.deepEqual(s.activeAnimals.A.iv,a.iv);assert(!service.useItem('A','calm_card').success);});
test('恢复剂缩短冷却，保留实际繁育时间和次数，存档兼容',()=>{const {s,service}=setup();for(let i=0;i<4;i++)assert(service.useItem('A','cooldown_tonic').success);assert.equal(getCooldownEnd(s.activeAnimals.A),T);assert.equal(s.activeAnimals.A.breeding.lastSuccessAt,T);assert.equal(s.activeAnimals.A.breeding.count,1);assert(!service.useItem('A','cooldown_tonic').success);assert.equal(getCooldownEnd(migrateSave(s).activeAnimals.A),T);});
test('道具写盘失败完整回滚',()=>{const {s}=setup();const before=structuredClone(s),service=createTrainingService({state:s,persist:()=>false,now:()=>T});assert(!service.useItem('A','ev_boost','STR').success);assert.deepEqual(s,before);});
console.log(`${passed}/10 family and item checks passed`);
