import assert from 'node:assert/strict';
import {getAllBreeds,getBreedAppearance} from '../data/species/dog/breeds.js';
import {APPEARANCE_GENES,getGene} from '../data/species/dog/appearance.js';
import {collectionTargets,collection} from '../engine/management.js';
import {getAllowedAlleles} from '../engine/genetics.js';
import {createGameState} from '../storage/state.js';
import {migrateSave} from '../storage/save.js';
import {renderCollection} from '../ui/managementView.js';
const s=createGameState();let count=0;
for(const b of getAllBreeds())for(const l of Object.keys(APPEARANCE_GENES)){
 const pool=getBreedAppearance(b.id)[l];
 for(const history of [[],Object.keys(APPEARANCE_GENES[l]).reverse()]){
  const c=collection(s,b.id);c.genes.set(l,new Set(history));
  const expected=new Set([...getAllowedAlleles(pool,l),...(pool.mutation??[]),...history]);
  const ids=collectionTargets(b.id,l,c);
  assert.deepEqual(new Set(ids),expected);assert.equal(ids.length,expected.size);
  assert.deepEqual(ids.map(id=>getGene(l,id).dominance),ids.map(id=>getGene(l,id).dominance).sort((a,b)=>a-b));
  count++;
 }
}
const page={innerHTML:''};const buttons=getAllBreeds().map(b=>({dataset:{breedTab:b.id},setAttribute(){},addEventListener(_,fn){this.click=fn;}}));
const root={innerHTML:'',querySelector(){return page;},querySelectorAll(){return buttons;}};
renderCollection(root,s);
for(const b of buttons){b.click();const panels=page.innerHTML.split('<div class="collection-genes aligned-genes">').slice(1);assert.equal(panels.length,5);for(const p of panels){const ranks=[...p.matchAll(/显性 (\d+)/g)].map(m=>Number(m[1]));assert(ranks.length);assert.deepEqual(ranks,[...ranks].sort((a,b)=>a-b));}}
const old=createGameState();old.version='1.0.3';old.money=987;assert.equal(migrateSave(old).version,'1.0.5');assert.equal(migrateSave(old).money,987);
console.log(`${count} pool/history ordering checks; 24 breed UI pages; V1.0.3 migration passed`);
