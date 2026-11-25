import {createAnimal} from '../engine/animal.js';
import {breedAndSave,claimEgg} from '../engine/breedingLifecycle.js';
import {INCUBATION_MS} from '../engine/egg.js';
import {getRemainingBreedings,getRemainingCooldown} from '../engine/breeding.js';
export function runLifecycleChecks(breedId){
    const t=Date.now(), tests=[], save=()=>true;
    const make=()=>{const animals=[createAnimal({id:'TEST-M',name:'父本',breedId,sex:'male',stage:'adult',location:'nursery'}),createAnimal({id:'TEST-F',name:'母本',breedId,sex:'female',stage:'adult',location:'nursery'})];return {animals,eggs:[],pedigreeRecords:Object.fromEntries(animals.map(a=>[a.id,structuredClone(a)]))};};
    const breed=(state,persist=save)=>breedAndSave({state,motherId:'TEST-F',fatherId:'TEST-M',eggId:'EGG-TEST',offspringId:'DOG-TEST',now:t,persist});
    const claim=(state,opts={})=>claimEgg({state,eggId:'EGG-TEST',now:t+INCUBATION_MS,persist:save,...opts});
    function assert(name,fn){try{if(!fn())throw Error('结果不符');tests.push({name,success:true});}catch(e){tests.push({name,success:false,message:e.message});}}
    const state=make();const before=JSON.stringify(state);
    assert('产蛋写入失败不修改犬只与犬蛋',()=>!breed(state,()=>false).success&&JSON.stringify(state)===before);
    assert('产蛋写入抛错不修改状态',()=>!breed(state,()=>{throw Error('模拟失败');}).success&&JSON.stringify(state)===before);
    let disk='';const result=breed(state,d=>{disk=JSON.stringify(d);return true;});
    assert('正常产蛋并保存',()=>{if(!result.success)throw Error(result.message);return state.eggs.length===1&&JSON.stringify(state)===disk;});
    if(!result.success)return tests;
    assert('双方各扣一次并开始冷却',()=>state.animals.every(a=>getRemainingBreedings(a)===9&&getRemainingCooldown(a,t)===INCUBATION_MS));
    assert('重复产蛋不改变存档',()=>{const b=JSON.stringify(state);return !breed(state).success&&b===JSON.stringify(state);});
    const snapshot=JSON.stringify(state), data=structuredClone(state.eggs[0].offspringData);
    assert('到期前1毫秒禁止领取',()=>!claim(state,{now:t+INCUBATION_MS-1}).success&&JSON.stringify(state)===snapshot);
    assert('无效名称不消耗犬蛋',()=>!claim(state,{name:'犬'.repeat(21)}).success&&JSON.stringify(state)===snapshot);
    assert('无可用安置位置不消耗犬蛋',()=>!claim(state,{chooseLocation:()=>null}).success&&JSON.stringify(state)===snapshot);
    assert('领取写入返回false时完整回滚',()=>{let called=false;const result=claim(state,{persist:()=>{called=true;return false;}});return called&&!result.success&&JSON.stringify(state)===snapshot;});
    assert('领取写入抛错时完整回滚',()=>{let called=false;const result=claim(state,{persist:()=>{called=true;throw Error('模拟失败');}});return called&&!result.success&&JSON.stringify(state)===snapshot;});
    const defaultState=JSON.parse(snapshot);const d=claim(defaultState);
    assert('留空保留默认名称',()=>{if(!d.success)throw Error(d.message);return d.puppy.name===data.name;});
    const pendingState=JSON.parse(snapshot);const p=claim(pendingState,{chooseLocation:()=> 'pending'});
    assert('支持等待安置位置',()=>{if(!p.success)throw Error(p.message);return p.puppy.location==='pending';});
    // Restore from persisted egg rather than using the original live instance.
    const restored=JSON.parse(disk);const a=restored.animals,e=restored.eggs,r=restored.pedigreeRecords;
    const claimed=claim(restored,{name:'新生犬',persist:s=>{disk=JSON.stringify(s);return true;}});
    assert('恰好24小时可领取并入库',()=>{if(!claimed.success)throw Error(claimed.message);return restored.animals.length===3&&restored.eggs.length===0;});
    if(!claimed.success)return tests;
    const puppy=claimed.puppy;
    assert('幼犬身份和命名正确',()=>puppy.id===data.id&&puppy.stage==='puppy'&&puppy.name==='新生犬'&&puppy.birthNamingUsed===true&&puppy.source==='breeding');
    for(const key of ['breedId','sex','genotype','iv','personality','weightGene','pedigree'])assert(`领取不改变 ${key}`,()=>data[key]!==undefined&&JSON.stringify(puppy[key])===JSON.stringify(data[key]));
    assert('幼犬初始繁育次数及冷却正常',()=>puppy.breeding?.count===0&&puppy.breeding?.lastSuccessAt===null&&getRemainingBreedings(puppy)===10&&getRemainingCooldown(puppy,t+INCUBATION_MS)===0);
    assert('家谱保留亲本和后代记录',()=>['TEST-M','TEST-F',puppy.id].every(id=>Object.hasOwn(restored.pedigreeRecords,id))&&JSON.stringify(restored.pedigreeRecords[puppy.id].pedigree)===JSON.stringify(data.pedigree));
    assert('保持界面引用不变',()=>a===restored.animals&&e===restored.eggs&&r===restored.pedigreeRecords);
    assert('领取后重新读取存档仍正确',()=>JSON.stringify(restored)===disk&&JSON.parse(disk).animals.some(x=>x.id===puppy.id));
    assert('重复领取不生成第二只幼犬',()=>{const b=JSON.stringify(restored);return !claim(restored).success&&b===JSON.stringify(restored);});
    return tests;
}
