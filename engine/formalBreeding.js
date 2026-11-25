import {gameNow} from './gameClock.js';
import { breedAndSave, claimEgg } from './breedingLifecycle.js';
import { getPlacement } from './breedingIntegration.js';
import { formatAnimalId } from './animal.js';
import { settleGrowth } from './growth.js';
const fail=message=>({success:false,message});

// All counters, events, dogs and eggs commit in one full-save transaction.
export function createFormalBreeding({state,persist,now=()=>gameNow(state)}) {
    let busy=false;
    const caps=s=>({nursery:s.facilities.nursery.capacity,computer:s.facilities.computer.capacity,incubation:s.facilities.incubation.capacity});
    function run(operation) {
        if(busy)return fail('操作处理中');busy=true;
        try {
            const draft=structuredClone(state), at=now();
            settleGrowth(draft,at);
            const view={animals:Object.values(draft.activeAnimals),eggs:draft.incubationTasks,pedigreeRecords:draft.pedigreeRecords};
            const result=operation(draft,view,at);
            if(!result.success)return result;
            draft.activeAnimals=Object.fromEntries(view.animals.map(a=>[a.id,a]));
            draft.events.unshift({id:draft.nextEventId++,type:result.egg?'breeding':'hatching',message:result.message,timestamp:at});
            draft.timestamps.lastPlayedAt=at;
            if(persist(draft)===false)return fail('存档失败，操作未生效');
            Object.assign(state,draft);
            return result;
        }catch(e){return fail(e.message);}finally{busy=false;}
    }
    return {
        capacity:()=>caps(state),
        breed(motherId,fatherId,item=""){return run((d,v,at)=>{
            const counts={destiny_knot:4,advanced_destiny_knot:5};if(item&&(!Object.hasOwn(counts,item)||!(d.inventory[item]>0)))return fail("遗传道具不足或无效");
            if(v.eggs.length>=caps(d).incubation)return fail('孵化室已满，请先领取幼犬');
            const used=new Set([...Object.keys(d.activeAnimals),...Object.keys(d.pedigreeRecords),...v.eggs.flatMap(e=>[e.id,e.offspringId])]);
            let offspringId,eggId;
            do {const n=d.nextAnimalId++;offspringId=formatAnimalId(n);eggId='EGG'+String(n).padStart(5,'0');} while(used.has(offspringId)||used.has(eggId));
            const result=breedAndSave({state:v,motherId,fatherId,eggId,offspringId,now:at,persist:()=>true,inheritedCount:item?counts[item]:undefined});
            if(result.success){if(item){d.inventory[item]--;result.message+=` 使用${item=== "destiny_knot"?"遗传结":"高级遗传结"}。`;}for(const id of [motherId,fatherId]){const a=v.animals.find(x=>x.id===id);if(a)delete a.mutationPollen;if(a?.source==='rental'){v.pedigreeRecords[id]={...structuredClone(a),rentalReturnedAt:at};v.animals.splice(v.animals.indexOf(a),1);result.message+=` 租借犬${a.name}已归还。`;}}}
            return result;
        });},
        claim(eggId,name){return run((d,v,at)=>{
            const result=claimEgg({state:v,eggId,name,now:at,persist:()=>true,chooseLocation:()=>getPlacement(v,caps(d))});
            if(result.success){
                const puppy=result.puppy;
                // Growth begins on collection, not while waiting in the egg.
                puppy.timestamps.createdAt=at;puppy.timestamps.hatchedAt=at;puppy.timestamps.lastGrowthAt=at;
                v.pedigreeRecords[puppy.id]=structuredClone(puppy);
            }
            return result;
        });}
    };
}
