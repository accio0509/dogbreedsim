import {runRentalChecks} from './rental-checks.js';
const r=runRentalChecks();for(const t of r)console.log(t.success?'PASS':'FAIL',t.name,t.message??'');console.log(`${r.filter(x=>x.success).length}/${r.length} rental checks passed`);if(r.some(x=>!x.success))process.exitCode=1;
