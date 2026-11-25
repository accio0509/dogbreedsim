import {gameNow} from './gameClock.js';
import {getPersonality} from '../data/species/dog/personalities.js';
import { settleExploration } from './exploration.js';
import { GAME_CONFIG } from '../config/game.js';

// Settle time before movement. Only idle, non-retired nursery dogs grow.
export function settleGrowth(state, now=gameNow(state)) {
    const g=GAME_CONFIG.growth;
    let changed=settleExploration(state,now);
    for (const a of Object.values(state.activeAnimals)) {
        const last=a.timestamps.lastGrowthAt;
        if (!Number.isFinite(last)) {a.timestamps.lastGrowthAt=now;changed=true;continue;}
        if (now<=last) continue;
        if (a.stage==='adult' || a.retired || a.location!=='nursery' || a.activity!=null) {
            // Ineligible intervals never count toward growth.
            a.timestamps.lastGrowthAt=now;changed=true;continue;
        }
        const elapsed=Math.min(now-last,g.offlineMaxHours*3600000);
        const exp=Math.min(g.adultExp,(Number.isFinite(a.exp)?a.exp:0)+elapsed/3600000*g.expPerHour*(getPersonality(a.personality)?.effects?.nurseryEXP??1));
        a.exp=exp;
        a.stage=exp>=g.adultExp?'adult':exp>=g.juvenileExp?'juvenile':'puppy';
        a.timestamps.lastGrowthAt=now;
        changed=true;
    }
    return changed;
}
