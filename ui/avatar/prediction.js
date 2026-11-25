import {predictLocus} from '../../engine/management.js';
import {APPEARANCE_LOCI,getGene} from '../../data/species/dog/appearance.js';
// Independent loci; conditional on no new mutation. Merge hidden pattern outcomes.
export function predictPortraits(mother,father){
 const loci=Object.keys(APPEARANCE_LOCI),options=loci.map(l=>predictLocus(mother,father,l));const merged=new Map();
 function visit(i,p,prob){if(i<loci.length){const l=loci[i];for(const x of options[i])visit(i+1,{...p,[l]:{...getGene(l,x.allele),allele:x.allele}},prob*x.p);return;}
 const visible=p.pattern.allele!=='P0'&&p.coatColor.hex.toLowerCase()!==p.patternColor.hex.toLowerCase();const key=[p.coatColor.allele,visible?p.pattern.allele:'P0',visible?p.patternColor.allele:'',p.eyeColor.allele,p.hairLength.allele].join('/');const old=merged.get(key);if(old)old.probability+=prob;else merged.set(key,{phenotype:{...p,patternVisible:visible},probability:prob});}
 visit(0,{},1);return [...merged.values()].sort((a,b)=>b.probability-a.probability);
}
