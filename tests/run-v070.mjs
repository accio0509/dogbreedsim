import './run-v060.mjs';
import {runTrainingChecks} from './training-checks.js';
const r=runTrainingChecks();for(const t of r)console.log(t.success?'PASS':'FAIL',t.name,t.message??'');console.log(`${r.filter(x=>x.success).length}/${r.length} training checks passed`);if(r.some(x=>!x.success))process.exitCode=1;
