import {createAnimal} from './animal.js';
import { startBreeding, isEggReady } from './egg.js';
import { createOffspringFromData } from './offspring.js';

const fail = message => ({success:false,message});
const owns = (obj,id) => Object.prototype.hasOwnProperty.call(obj,id);
function validate(state) {
    if (!state || !Array.isArray(state.animals) || !Array.isArray(state.eggs) || !state.pedigreeRecords || typeof state.pedigreeRecords !== 'object' || Array.isArray(state.pedigreeRecords)) throw new Error('存档缺少 animals、eggs 或 pedigreeRecords');
}
// Use one synchronous, atomic save of the whole candidate state. A thrown error
// or false means no commit. Do not use a Promise or a partial-field writer.
function transact(state, persist, operation) {
    try {
        validate(state);
        if (typeof persist !== 'function') return fail('未配置存档写入函数');
        const draft = structuredClone(state);
        const result = operation(draft);
        if (!result.success) return result;
        const saved = persist(draft);
        if (saved && typeof saved.then === 'function') throw new Error('不支持异步存档函数');
        if (saved === false) return fail('存档失败，操作未生效');
        // Preserve live collection references used by the UI.
        state.animals.splice(0,state.animals.length,...draft.animals);
        state.eggs.splice(0,state.eggs.length,...draft.eggs);
        for (const key of Object.keys(state.pedigreeRecords)) delete state.pedigreeRecords[key];
        for (const [key,value] of Object.entries(draft.pedigreeRecords)) Object.defineProperty(state.pedigreeRecords,key,{value,writable:true,enumerable:true,configurable:true});
        return result;
    } catch(e) { return fail(e.message || '操作失败'); }
}
export function breedAndSave({state,motherId,fatherId,eggId,offspringId,now=Date.now(),persist}) {
    return transact(state,persist,draft=>{
        if (!Number.isFinite(now)) return fail('时间无效');
        const mother=draft.animals.find(a=>a.id===motherId),father=draft.animals.find(a=>a.id===fatherId);
        if (!mother || !father) return fail('亲本不存在');
        if (!eggId || !offspringId || eggId===offspringId || draft.animals.some(a=>a.id===eggId||a.id===offspringId) || owns(draft.pedigreeRecords,eggId) || owns(draft.pedigreeRecords,offspringId) || draft.eggs.some(e=>[e.id,e.offspringId].some(id=>id===eggId||id===offspringId))) return fail('犬蛋或后代编号冲突');
        // Preserve parent ancestry even if the active dog later leaves the collection.
        for(const dog of [mother,father]) if(!owns(draft.pedigreeRecords,dog.id)) Object.defineProperty(draft.pedigreeRecords,dog.id,{value:structuredClone(dog),writable:true,enumerable:true,configurable:true});
        return startBreeding({mother,father,eggId,offspringId,eggs:draft.eggs,pedigreeRecords:draft.pedigreeRecords,now});
    });
}
export function claimEgg({state,eggId,name='',now=Date.now(),persist,chooseLocation=()=> 'nursery'}) {
    return transact(state,persist,draft=>{
        const matches=draft.eggs.filter(e=>e.id===eggId);
        if(matches.length!==1) return fail(matches.length?'犬蛋编号重复，请检查存档':'犬蛋不存在或已领取');
        const egg=matches[0];
        if(!Number.isFinite(now)||!Number.isFinite(egg.createdAt)||!Number.isFinite(egg.hatchAt)||egg.hatchAt<=egg.createdAt) return fail('孵化计时数据异常');
        if(!isEggReady(egg,now)) return fail('尚未孵化完成');
        const data=egg.offspringData;
        if(!data || !egg.offspringId || data.id!==egg.offspringId || data.breedId!==egg.breedId || (egg.source==='competition' ? (egg.motherId!==null||egg.fatherId!==null||data.source!=='competition'||data.pedigree?.generation!==1||data.pedigree?.motherId!==null||data.pedigree?.fatherId!==null) : (!egg.motherId || !egg.fatherId || egg.motherId===egg.fatherId)) || !data.pedigree) return fail('后代数据或家谱异常');
        if(draft.animals.some(a=>a.id===data.id)||owns(draft.pedigreeRecords,data.id)||draft.eggs.some(e=>e!==egg&&e.offspringId===data.id)) return fail('后代编号已存在');
        if(typeof name!=='string') return fail('名称格式无效');
        const cleaned=name.trim();
        if([...cleaned].length>20 || /[\u0000-\u001f\u007f]/u.test(cleaned)) return fail('名称最多20个字符，不能含控制字符');
        const location=chooseLocation(draft,egg);
        if(!['nursery','computer','pending'].includes(location)) return fail('暂无可用安置位置');
        const puppy=egg.source==='competition'?createAnimal({...structuredClone(data),location,stage:'puppy',source:'competition'}):createOffspringFromData(structuredClone(data),location);
        if(!puppy || puppy.id!==data.id || puppy.stage!=='puppy' || puppy.breedId!==data.breedId || puppy.sex!==data.sex) return fail('幼犬创建结果异常');
        // The existing offspring factory is responsible for preserving all inherited fields.
        puppy.name=cleaned || data.name || puppy.name;
        if(!puppy.name) return fail('缺少幼犬默认名称');
        puppy.birthNamingUsed=true;
        // V0.3.0 createAnimal may omit breeding for newborn dogs.
        if (puppy.breeding == null) {
            puppy.breeding = {count: 0, lastSuccessAt: null};
        }
        if(puppy.breeding.count!==0 || puppy.breeding.lastSuccessAt!=null) return fail('幼犬初始繁育状态异常');
        puppy.breeding.lastSuccessAt = null;
        draft.animals.push(puppy);
        Object.defineProperty(draft.pedigreeRecords,puppy.id,{value:structuredClone(puppy),writable:true,enumerable:true,configurable:true});
        draft.eggs.splice(draft.eggs.indexOf(egg),1);
        return {success:true,message:`${puppy.name} 已孵化并入库`,puppy};
    });
}
