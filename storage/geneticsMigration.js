// Translate legacy identifiers by meaning, never by numeric suffix.
const ids={C001:'C07',C002:'C06',C003:'C04',C004:'C05',C005:'C02',C006:'C08',C007:'C01',P001:'P4',P002:'P1',P003:'P7',P004:'P0',M001:'M07',M002:'M06',M003:'M04',M004:'M02',M005:'M01',E001:'E01',E002:'E02',E003:'E03',E004:'E04',L001:'L1',L002:'L3'};
export function migrateGeneticsIds(state){
 function visit(x){if(!x||typeof x!=='object')return;for(const [k,v] of Object.entries(x)){if(typeof v==='string'&&['allele','alleleId'].includes(k)&&Object.hasOwn(ids,v))x[k]=ids[v];else if(typeof v==='object')visit(v);}}
 for(const listing of state.rentalMarket?.listings??[]){if(Object.values(listing.animal?.genotype??{}).flat().some(a=>Object.hasOwn(ids,a.allele)))listing.legacyPrice=true;}
 visit(state);return state;
}
