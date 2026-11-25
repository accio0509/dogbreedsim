import {createBreedingIntegration} from '../engine/breedingIntegration.js';
import {mountBreedingRoom} from './breedingRoom.js';
import {mountIncubationRoom} from './incubationRoom.js';
// Call once after the formal state is loaded. Destroy/remount if state is replaced.
export function mountBreedingFeature({breedRoot,incubationRoot,onChange=()=>{},makeIds,now=()=>Date.now(),...options}){
    if(!breedRoot||!incubationRoot||breedRoot===incubationRoot)throw Error('需要两个独立的页面容器');
    const service=createBreedingIntegration({...options,now});
    let breeding,incubation;
    const refresh=()=>{breeding?.refresh();incubation?.refresh();};
    const changed=result=>{refresh();onChange(result);};
    try{
        breeding=mountBreedingRoom(breedRoot,{animals:service.animals,eggs:service.eggs,pedigreeRecords:service.pedigreeRecords,now,...(makeIds?{makeIds}:{}),executeBreeding:({mother,father,eggId,offspringId,now:at})=>service.breed({motherId:mother.id,fatherId:father.id,eggId,offspringId,at}),onChange:changed});
        incubation=mountIncubationRoom(incubationRoot,{eggs:service.eggs,now,onClaim:(id,name)=>{const r=service.claim(id,name);if(r.success){try{changed(r);}catch(e){console.error('领取已保存，但界面刷新失败',e);}}return r;}});
    }catch(e){breeding?.destroy();incubation?.destroy();throw e;}
    return {service,refresh,destroy(){breeding.destroy();incubation.destroy();}};
}
