import {getAllBreeds} from '../data/species/dog/breeds.js';
import {runMarketChecks} from './market-checks.js';
import {runFormalChecks} from './formal-checks.js';
import {runReleaseChecks} from './release-checks.js';
import {runLifecycleChecks} from './lifecycle-checks.js';
import {runDevChecks} from './dev-checks.js';
let pass=0,fail=0;
for(const [name,tests] of [['市场',runMarketChecks()],...getAllBreeds().map(b=>[b.name,[...runFormalChecks(b.id),...runReleaseChecks(b.id),...runLifecycleChecks(b.id),...runDevChecks(b.id)]])]){
    const errors=tests.filter(t=>!t.success);console.log(`${name}: ${tests.length-errors.length}/${tests.length}`);for(const e of errors)console.error(e.name,e.message);pass+=tests.length-errors.length;fail+=errors.length;
}
console.log(`${pass} 通过，${fail} 失败`);if(fail)process.exitCode=1;
