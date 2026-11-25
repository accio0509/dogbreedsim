import {getBreedAppearance} from '../data/species/dog/breeds.js';
import {getGene} from '../data/species/dog/appearance.js';
export function geneRarity(breed,locus,id,mutated=false){const p=getBreedAppearance(breed)?.[locus];if(!getGene(locus,id)?.hex||!p)return '';return mutated||p.mutation?.includes(id)||(!p.normal.includes(id)&&!p.rare?.includes(id))?'mutation':p.rare?.includes(id)?'rare':'';}
export function geneLabel(breed,locus,a){const g=getGene(locus,a.allele);return `<span class="gene-text-${geneRarity(breed,locus,a.allele,a.mutated)}">${g.hex?`<i class="gene-swatch gene-small" style="background:${g.hex}"></i> `:''}${g.name}</span>`;}
