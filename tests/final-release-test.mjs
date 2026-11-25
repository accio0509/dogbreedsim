import assert from 'node:assert/strict';
import {createGameState} from '../storage/state.js';
import {migrateSave,createSaveStore,SAVE_KEY} from '../storage/save.js';
const s=createGameState();s.version='1.0.0-rc.1';s.money=12345;s.inventory.cookie=7;
const raw=JSON.stringify(s);const migrated=migrateSave(s);assert.equal(migrated.version,'1.0.2');assert.equal(migrated.money,12345);assert.deepEqual(migrated.inventory,s.inventory);assert.equal(JSON.stringify(s),raw);assert.deepEqual(migrateSave(migrated),migrated);
const data=new Map([[SAVE_KEY,raw]]);const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};const a=createSaveStore(storage),b=createSaveStore(storage);assert.equal(a.load().version,'1.0.2');a.save(migrated);assert.throws(()=>b.save(migrated));assert.equal(JSON.parse(data.get(SAVE_KEY)).version,'1.0.2');assert.throws(()=>migrateSave({...s,activeAnimals:null}));console.log('Final release migration and storage checks passed');
