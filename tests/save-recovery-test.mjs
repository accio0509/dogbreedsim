import assert from 'node:assert/strict';
import {createSaveStore,SAVE_KEY} from '../storage/save.js';
import {DEV_SAVE_KEY} from '../engine/devTools.js';
import {readFileSync} from 'node:fs';
const data=new Map();const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
for(const raw of ['{broken',JSON.stringify({version:'unsupported'}),JSON.stringify({version:'1.0.4',activeAnimals:null})]){
 data.set(SAVE_KEY,raw);data.set(DEV_SAVE_KEY,'dev untouched');
 const store=createSaveStore(storage);assert.throws(()=>store.load());assert.equal(data.get(SAVE_KEY),raw);
 assert(store.reset());assert.equal(data.get(SAVE_KEY+':reset-backup'),raw);assert.equal(store.load().initialized,false);assert.equal(data.get(DEV_SAVE_KEY),'dev untouched');
}
data.set(DEV_SAVE_KEY,'bad dev');const main=data.get(SAVE_KEY);const dev=createSaveStore(storage,DEV_SAVE_KEY);assert.throws(()=>dev.load());dev.reset();assert.equal(data.get(DEV_SAVE_KEY+':reset-backup'),'bad dev');assert.equal(data.get(SAVE_KEY),main);
data.set(SAVE_KEY,'bad');const stale=createSaveStore(storage);data.set(SAVE_KEY,'changed');assert.throws(()=>stale.reset());assert.equal(data.get(SAVE_KEY),'changed');
const failing={getItem:k=>data.get(k)??null,setItem:(k,v)=>{if(k.endsWith(':reset-backup'))throw Error('quota');data.set(k,v);}};assert.throws(()=>createSaveStore(failing).reset());assert.equal(data.get(SAVE_KEY),'changed');
const ui=readFileSync(new URL('../ui/main.js',import.meta.url),'utf8');assert(ui.includes("reset.dataset.action='reset-game'"));assert(ui.includes("reset.textContent='重新开始游戏'"));assert(!ui.includes("if(fatalSave) throw Error('存档不可用'); store.reset()"));
console.log('Save recovery: malformed JSON, invalid version, invalid records, backup, fresh state, dev isolation, stale tab and failed backup protection passed');
