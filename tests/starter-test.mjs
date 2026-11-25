import assert from 'node:assert/strict';
import {DOG_NAMES,getStarterDogNames} from '../data/species/dog/names.js';
import {getAllBreeds,SIZE_CLASSES} from '../data/species/dog/breeds.js';
import {gameState,initializeGame,createGameState,renameAnimal} from '../storage/state.js';
import {migrateSave} from '../storage/save.js';
import {readFileSync} from 'node:fs';
assert.equal(new Set(DOG_NAMES).size,DOG_NAMES.length);
assert.ok(DOG_NAMES.some(n=>n.length===1)&&DOG_NAMES.some(n=>n.length>3));
for(let i=0;i<1000;i++){const [a,b]=getStarterDogNames();assert.ok(DOG_NAMES.includes(a)&&DOG_NAMES.includes(b)&&a!==b);}
for(const size of Object.keys(SIZE_CLASSES))assert.equal(getAllBreeds().filter(b=>b.size===size).length,6);
assert.equal(initializeGame('测试','chihuahua',[' ','公犬']).success,false);assert.equal(gameState.initialized,false);
assert.equal(initializeGame('测试','chihuahua',[' 小馄饨 ','狗主任']).success,true);
const dogs=Object.values(gameState.activeAnimals);assert.equal(dogs.length,2);
for(const dog of dogs){assert.equal(dog.name,dog.sex==='female'?'小馄饨':'狗主任');assert.equal(gameState.pedigreeRecords[dog.id].name,dog.name);assert.equal(renameAnimal(dog.id,'新名字').success,false);}
const migrated=migrateSave(gameState);for(const dog of dogs){assert.equal(migrated.activeAnimals[dog.id].name,dog.name);assert.equal(migrated.activeAnimals[dog.id].birthNamingUsed,true);assert.deepEqual(migrated.activeAnimals[dog.id].genotype,dog.genotype);}
Object.assign(gameState,createGameState());assert.equal(initializeGame('测试','corgi').success,true);assert.equal(new Set(Object.values(gameState.activeAnimals).map(d=>d.name)).size,2);
const ui=readFileSync(new URL('../ui/main.js',import.meta.url),'utf8');const setup=ui.slice(ui.indexOf('function renderNewGame()'),ui.indexOf('// 设施容量显示'));assert.ok(!setup.includes('weightRange')&&setup.includes('SIZE_CLASSES')&&setup.includes('starter-random'));
console.log(`Starter checks passed; ${DOG_NAMES.length} names, 1000 random pairs`);

const {createSaveStore,SAVE_KEY}=await import('../storage/save.js');
const old=createGameState();old.version='1.0.0';old.money=9999;
const devKey='dogbreedsim:dev-save';const data=new Map([[SAVE_KEY,JSON.stringify(old)],[devKey,'untouched']]);
const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
const store=createSaveStore(storage), stale=createSaveStore(storage);
assert.equal(store.load().version,'1.0.2');store.reset();
assert.equal(data.get(SAVE_KEY+':reset-backup'),JSON.stringify(old));assert.equal(data.get(devKey),'untouched');
assert.equal(store.load().initialized,false);assert.equal(store.load().money,createGameState().money);assert.throws(()=>stale.reset());
assert.throws(()=>stale.save(old));
const failing=createSaveStore({getItem:k=>data.get(k)??null,setItem(){throw Error('quota')}});assert.throws(()=>failing.reset());assert.equal(store.load().initialized,false);
assert.ok(ui.includes('data-action="reset-game"')&&ui.includes('store.reset()'));
console.log('Reset, backup, stale-tab and V1.0.0 migration checks passed');
