import {breedAndSave,claimEgg} from './breedingLifecycle.js';
const fail=message=>({success:false,message});
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
// No save key or legacy task schema is guessed here.
export function prepareBreedingState(state,{animalsKey='activeAnimals',eggsKey='eggs'}={}) {
    if(!state || typeof state!=='object' || Array.isArray(state)) throw Error('正式存档无效');
    if(new Set([animalsKey,eggsKey,'pedigreeRecords']).size!==3) throw Error('存档字段映射重复');
    if(!Array.isArray(state[animalsKey])) throw Error(`犬只字段 ${animalsKey} 不是数组，请核对实际存档`);
    if(!state.pedigreeRecords || typeof state.pedigreeRecords!=='object' || Array.isArray(state.pedigreeRecords)) throw Error('家谱字段缺失或格式异常，不自动重建');
    if(!own(state,eggsKey)) {
        for(const key of ['incubationTasks','breedingTasks']) {
            const value=state[key];
            if(value!=null && (!Array.isArray(value)||value.length)) throw Error(`旧存档存在 ${key}，需先核对旧任务迁移，未修改存档`);
        }
        state[eggsKey]=[];
    }
    if(!Array.isArray(state[eggsKey])) throw Error('犬蛋字段格式异常，不自动覆盖');
    return {animals:state[animalsKey],eggs:state[eggsKey],pedigreeRecords:state.pedigreeRecords};
}
export function getPlacement(state,{nursery=10,computer=60}={}) {
    if(!Number.isInteger(nursery)||nursery<0||!Number.isInteger(computer)||computer<0) throw Error('安置容量无效');
    if(state.animals.filter(d=>d.location==='nursery').length<nursery)return 'nursery';
    if(state.animals.filter(d=>d.location==='computer').length<computer)return 'computer';
    return 'pending';
}
export function createBreedingIntegration({state,persist,animalsKey='activeAnimals',eggsKey='eggs',getCapacity=()=>({nursery:10,computer:60,incubation:1}),chooseLocation,now=()=>Date.now()}) {
    if(typeof persist!=='function')throw Error('缺少同步正式存档函数');
    const view=prepareBreedingState(state,{animalsKey,eggsKey});
    // Persist the entire formal save, not only the breeding subset. Stage 5
    // commits to the original collection references after persistence succeeds.
    const save=draft=>{
        const candidate=structuredClone(state);
        candidate[animalsKey]=draft.animals;
        candidate[eggsKey]=draft.eggs;
        candidate.pedigreeRecords=draft.pedigreeRecords;
        return persist(candidate);
    };
    const caps=()=>{
        const c=getCapacity(state);
        if(!c||!Number.isInteger(c.incubation)||c.incubation<1||c.incubation>5)throw Error('孵化室容量必须为1至5');
        return c;
    };
    let busy=false;
    function guard(fn){if(busy)return fail('操作处理中');busy=true;try{return fn();}catch(e){return fail(e.message);}finally{busy=false;}}
    return {...view,
        capacity:caps,
        breed({motherId,fatherId,eggId,offspringId,at=now()}){return guard(()=>{
            if(view.eggs.length>=caps().incubation)return fail('孵化室已满，请先领取幼犬');
            return breedAndSave({state:view,motherId,fatherId,eggId,offspringId,now:at,persist:save});
        });},
        claim(eggId,name='',at=now()){return guard(()=>claimEgg({state:view,eggId,name,now:at,persist:save,chooseLocation:(draft,egg)=>chooseLocation?chooseLocation(draft,egg,state):getPlacement(draft,caps())}));}
    };
}
