import assert from 'node:assert/strict';
import {getAllBreeds} from '../data/species/dog/breeds.js';
import {createAnimal} from '../engine/animal.js';
import {predictPortraits} from '../ui/avatar/prediction.js';
import {predictLocus} from '../engine/management.js';
import {renderMiniAvatar,renderPredictedAvatar} from '../ui/avatar/mini.js';
import {familyTreeMarkup} from '../ui/managementView.js';
import {BREED_EARS} from '../ui/avatar/templates.js';
const breeds=getAllBreeds();let count=0;
for(const b of breeds)for(const f of breeds){const m=createAnimal({id:'m',breedId:b.id,sex:'female'}),d=createAnimal({id:'f',breedId:f.id,sex:'male'});const before=JSON.stringify([m,d]);const rows=predictPortraits(m,d);assert.ok(Math.abs(rows.reduce((s,x)=>s+x.probability,0)-1)<1e-9);assert.equal(JSON.stringify([m,d]),before);for(const l of ['coatColor','eyeColor','hairLength'])for(const x of predictLocus(m,d,l))assert.ok(Math.abs(rows.filter(r=>r.phenotype[l].allele===x.allele).reduce((s,r)=>s+r.probability,0)-x.p)<1e-9);const keys=rows.map(({phenotype:p})=>[p.coatColor.allele,p.patternVisible?p.pattern.allele:'P0',p.patternVisible?p.patternColor.allele:'',p.eyeColor.allele,p.hairLength.allele].join('/'));assert.equal(new Set(keys).size,keys.length);assert.ok(renderPredictedAvatar(b.id,rows[0].phenotype).includes('<svg'));assert.ok(renderMiniAvatar(m).includes('position:static'));assert.ok(familyTreeMarkup({animal:m,role:'母本',children:[]}).includes('mini-dog-avatar'));count++;}
assert.ok(BREED_EARS.doberman[4].includes('立耳'));console.log(`${count} breed pair probability totals, marginals, merging, mini avatar and family markup passed`);
