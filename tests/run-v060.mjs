import './run-v050.mjs';
import './rental-test.mjs';
import {runExplorationChecks} from './exploration-checks.js';
const r=runExplorationChecks();for(const t of r)console.log(t.success?'PASS':'FAIL',t.name,t.message??'');console.log(`${r.filter(x=>x.success).length}/${r.length} exploration checks passed`);if(r.some(x=>!x.success))process.exitCode=1;
