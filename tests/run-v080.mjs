import './run-v070.mjs';
import {runV080Checks} from './v080-checks.js';
const r=runV080Checks();for(const t of r)console.log(t.success?'PASS':'FAIL',t.name,t.message??'');console.log(`${r.filter(x=>x.success).length}/${r.length} V0.8 checks passed`);if(r.some(x=>!x.success))process.exitCode=1;
