import assert from 'node:assert/strict';
import {createGameState} from '../storage/state.js';
import {migrateSave} from '../storage/save.js';
import {createAnimal} from '../engine/animal.js';
import {createFormalBreeding} from '../engine/formalBreeding.js';
import {advancedEggChance,createCompetitionService} from '../engine/competition.js';
import {getAllBreeds,getBreedAppearance} from '../data/species/dog/breeds.js';
import {MAP_BREEDS,pickMapBreed} from '../config/exploration.js';
import {filterDogs,emptyFilter,filterMarkup} from '../ui/dogPicker.js';
import {geneRarity,geneLabel} from '../ui/geneStyle.js';
import {STAT_KEYS} from '../engine/stats.js';
const now=Date.now(),H=3600000;
function setup(){const s=createGameState();s.initialized=true;for(const [id,sex] of [['A','female'],['B','male']]){const a=createAnimal({id,breedId:'newfoundland',sex,stage:'adult',personality:'calm'});for(const k of STAT_KEYS)a.iv[k]=10;s.activeAnimals[id]=a;s.pedigreeRecords[id]=structuredClone(a);}s.inventory={destiny_knot:1,advanced_destiny_knot:1};return s;}
for(const [item,n] of [['',3],['destiny_knot',4],['advanced_destiny_knot',5]]){const s=setup();const svc=createFormalBreeding({state:s,persist:()=>true,now:()=>now});const r=svc.breed('A','B',item);assert(r.success,r.message);assert.equal(s.incubationTasks[0].offspringData.inheritance.iv.inheritedKeys.length,n);if(item)assert.equal(s.inventory[item],0);assert.equal(migrateSave(s).incubationTasks.length,1);}
for(const persist of [()=>false,()=>true]){const s=setup(),before=structuredClone(s);const r=createFormalBreeding({state:s,persist,now:()=>now}).breed('A',persist()?'missing':'B','destiny_knot');assert(!r.success);assert.deepEqual(s,before);}
assert.deepEqual([1,2,3,4,5,6].map(advancedEggChance),[.3,.15,.05,0,0,0]);
const s=setup();let at=now;for(const k of ['STR','STA','SPD'])s.activeAnimals.B.ev[k]=100;for(const levelId of ['beginner','intermediate'])s.competitionRecords.push({animalId:'B',name:'B',eventId:'strength',levelId,stage:'adult',startedAt:now-2*H,endsAt:now-H,claimedAt:now-H,score:150,rank:1,money:45});const cmp=createCompetitionService({state:s,persist:()=>true,now:()=>at,rng:()=>0});assert(cmp.start('B','strength','advanced').success);assert(s.competitionTasks[0].eggReward);assert(s.competitionTasks[0].knotReward);at+=H;assert(cmp.claim('B').success);assert.equal(s.inventory.advanced_destiny_knot,2);assert.equal(s.incubationTasks.length,1);assert(!cmp.claim('B').success);
const breeds=getAllBreeds();assert.equal(new Set(Object.values(MAP_BREEDS).flat()).size,24);for(const [map,ids] of Object.entries(MAP_BREEDS)){const counts={};const n=24+3*ids.length;for(let i=0;i<n;i++){const b=pickMapBreed(map,breeds,()=>(i+.5)/n);counts[b.id]=(counts[b.id]??0)+1;}for(const b of breeds)assert.equal(counts[b.id],ids.includes(b.id)?4:1);}
const a=s.activeAnimals.A,b=s.activeAnimals.B;a.marks=['heart','dna'];const id=a.genotype.coatColor[0].allele;const f={...emptyFilter(),mark:'dna',gene_coatColor:id};assert.deepEqual(filterDogs([a,b],f),[a]);assert.equal(filterDogs([a,b],{...f,mark:'dumbbell'}).length,0);assert(filterMarkup(f,{advanced:true}).includes('gene_coatColor'));assert(!filterMarkup(f).includes('gene_coatColor'));for(const breed of breeds){const p=getBreedAppearance(breed.id);for(const l of ['coatColor','patternColor','eyeColor']){for(const id of p[l].rare??[])assert.equal(geneRarity(breed.id,l,id),'rare');for(const id of p[l].mutation??[])assert.equal(geneRarity(breed.id,l,id),'mutation');}}assert(geneLabel(a.breedId,'coatColor',a.genotype.coatColor[0]).includes('gene-swatch'));
console.log('V1.0.5: IV inheritance, rollback, competition rewards, 24 breed weights, gene/mark filtering, rarity styles passed');
