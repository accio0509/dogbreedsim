import assert from 'node:assert/strict';
import {getAllBreeds} from '../data/species/dog/breeds.js';
import {APPEARANCE_GENES} from '../data/species/dog/appearance.js';
import {createAnimal,getAnimalPhenotype} from '../engine/animal.js';
import {renderPortrait,renderDogAvatar} from '../ui/avatar/renderer.js';
import {BREED_TEMPLATES,BREED_PROFILES} from '../ui/avatar/templates.js';
import {renderAnimalCard,renderAnimalDetail} from '../ui/animalView.js';
let count=0;const g=(l,id)=>({...APPEARANCE_GENES[l][id],allele:id});
for(const b of getAllBreeds()){
 assert.ok(Object.hasOwn(BREED_TEMPLATES,b.id));
 const a=createAnimal({id:b.id,breedId:b.id,name:'<test>'});const before=JSON.stringify(a);const p=getAnimalPhenotype(a);
 assert.ok(renderDogAvatar(a).includes('<svg'));assert.ok(renderAnimalCard(a).includes('dog-portrait-svg'));assert.ok(renderAnimalDetail(a).includes('dog-portrait-svg'));assert.equal(JSON.stringify(a),before);assert.ok(renderDogAvatar(a).includes('&lt;test&gt;'));
 for(const c of Object.keys(APPEARANCE_GENES.coatColor))for(const pat of Object.keys(APPEARANCE_GENES.pattern))for(const m of Object.keys(APPEARANCE_GENES.patternColor))for(const h of Object.keys(APPEARANCE_GENES.hairLength)){
 const p={coatColor:g('coatColor',c),pattern:g('pattern',pat),patternColor:g('patternColor',m),eyeColor:g('eyeColor','E06'),hairLength:g('hairLength',h)};p.patternVisible=pat!=='P0'&&p.coatColor.hex!==p.patternColor.hex;const svg=renderPortrait(b.id,p);assert.ok(svg.startsWith('<svg')&&svg.endsWith('</svg>'));assert.ok(!/undefined|NaN/.test(svg));assert.ok(svg.includes(p.coatColor.hex)&&svg.includes(p.eyeColor.hex));count++;
 }
}
assert.ok(!renderDogAvatar({name:'invalid'}).includes('<svg'));
console.log(`${count} SVG combinations; 24 breed templates, card/detail hooks, fallback and immutability passed`);

assert.equal(Object.keys(BREED_PROFILES).length,24);
assert.equal(new Set(Object.values(BREED_PROFILES).map(p=>p[0])).size,24);
console.log("24 distinct head profiles verified");

import {patternMarkup} from '../ui/avatar/patterns.js';
assert.ok(patternMarkup('P3','#C99548','#29282B').includes('C69 52 72 58 70 66'));
assert.ok(patternMarkup('P3','#C99548','#29282B').includes('#F8F5ED'));
const black={coatColor:g('coatColor','C07'),pattern:g('pattern','P0'),patternColor:g('patternColor','M04'),eyeColor:g('eyeColor','E01'),hairLength:g('hairLength','L1'),patternVisible:false};
for(const b of getAllBreeds()){const svg=renderPortrait(b.id,black);assert.ok(svg.includes('stroke="#888186"')&&svg.includes('stroke="#a29a9c"')&&svg.includes('fill="#b6adb3"'));}
console.log('V1.4 tricolor muzzle and facial contrast checks passed');
