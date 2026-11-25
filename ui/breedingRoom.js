import {predictPortraits} from './avatar/prediction.js';
import {renderPredictedAvatar,renderMiniAvatar} from './avatar/mini.js';
import {getMutationRate} from '../engine/mutation.js';
import {dogLabel,emptyFilter,filterDogs,filterMarkup,handleFilterChange,handleFilterClick,enhancePicker} from './dogPicker.js';
import { getBreed } from '../data/species/dog/breeds.js';
import { checkBreedingPair, getRemainingBreedings, getRemainingCooldown } from '../engine/breeding.js';
import { startBreeding, INCUBATION_HOURS } from '../engine/egg.js';

const stages = {puppy:'幼犬', youth:'青年犬', juvenile:'青年犬', adult:'成年犬'};
function breedName(id) {
    const breed = getBreed(id);
    return breed?.nameZh ?? breed?.nameCN ?? breed?.name ?? id;
}
function node(tag, text, className) {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
}
function messages(value) {
    return (Array.isArray(value) ? value : value ? [value] : []).map(v => typeof v === 'string' ? v : v.message ?? v.reason ?? JSON.stringify(v));
}
function uniqueIds(animals, eggs, records) {
    const used = new Set([...animals.map(a=>a.id), ...eggs.flatMap(e=>[e.id,e.offspringId]), ...Object.keys(records)]);
    const next = prefix => {
        let id;
        do { id = prefix + crypto.randomUUID(); } while (used.has(id));
        used.add(id);
        return id;
    };
    return {eggId:next('EGG-'),offspringId:next('DOG-')};
}

// animals, eggs and pedigreeRecords must be the same live objects used by the game.
// onChange is a notification, not a persistence transaction (added later).
export function mountBreedingRoom(root, {animals, eggs, pedigreeRecords = {}, onChange = ()=>{}, now = ()=>Date.now(), makeIds = uniqueIds, executeBreeding = startBreeding, getCapacity = null,preselected = '',getInventory=()=>({})}) {
    if (!root || !Array.isArray(animals) || !Array.isArray(eggs)) throw new Error('繁育室需要容器、犬只列表与犬蛋列表');
    let portraitKey="", portraitRows=[], portraitPage=0;
    let motherId = animals.find(a=>a.id===preselected&&a.sex==='female')?.id??'', fatherId = animals.find(a=>a.id===preselected&&a.sex==='male')?.id??'', busy = false, disposed = false;
    const wrap = node('section', undefined, 'br-room');
    const style = node('style', `
    .br-room{max-width:780px;margin:auto;font:15px/1.6 system-ui,sans-serif;color:inherit}
    .br-room *{box-sizing:border-box}.br-room h2,.br-room h3{margin:0 0 12px}
    .br-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px}
    .br-panel{border:1px solid #aaa6;border-radius:12px;padding:16px;margin:12px 0}
    .br-room select,.br-room button{font:inherit;padding:10px;border-radius:8px;border:1px solid #aaa9;width:100%;background:transparent;color:inherit}
    .br-room button{cursor:pointer;background:#48785b;color:white;border:0;font-weight:600}
    .br-room button:disabled{opacity:.45;cursor:not-allowed}.br-info{white-space:pre-line;margin:12px 0 0}
    .br-good{color:#287b47}.br-bad{color:#b34840}.br-muted{opacity:.75}
    .br-preview p{margin:6px 0}.br-room [role=status]{min-height:26px;margin:10px 0}
    `);
    wrap.append(style,node('h2','繁育室'),node('p','选择一只成年雄犬与一只成年雌犬。','br-muted'));
    const grid = node('div',undefined,'br-grid');
    function parentPanel(title, sex) {
        const panel = node('div',undefined,'br-panel');
        const label = node('label',title);
        const select = node('select');
        select.setAttribute('aria-label',title);
        const info = node('div',undefined,'br-info');const avatar=node('div');
        const filters=emptyFilter(), filterBox=node('div');filterBox.innerHTML=filterMarkup(filters,{fixedSex:true});filterBox.addEventListener('change',ev=>handleFilterChange(ev,filters,refresh));filterBox.addEventListener('click',ev=>handleFilterClick(ev,filters,()=>{filterBox.innerHTML=filterMarkup(filters,{fixedSex:true});refresh();}));label.append(select); panel.append(filterBox,label,avatar,info); grid.append(panel);
        select.addEventListener('change',()=>{if(sex==='female') motherId=select.value; else fatherId=select.value; refresh();});
        return {select,info,avatar,sex,filters};
    }
    const fatherPanel = parentPanel('♂ 父本','male');
    const motherPanel = parentPanel('♀ 母本','female');
    const preview = node('div',undefined,'br-panel br-preview');
    const status = node('p'); status.setAttribute('role','status');
    const button = node('button','确认繁育'); button.type='button';
    const count = node('p',undefined,'br-muted');
    const itemSelect=node('select');itemSelect.setAttribute('aria-label','遗传道具');const itemLabel=node('label','遗传道具（每次最多一个）');itemLabel.append(itemSelect);wrap.append(grid,itemLabel,preview,button,status,count); root.replaceChildren(wrap);

    const find = id => animals.find(a=>String(a.id)===id);
    function populate(panel, chosenId, time) {
        const select=panel.select;
        const entries = filterDogs(animals.filter(a=>a.sex===panel.sex),panel.filters);
        // Keep ineligible dogs visible, so the player can inspect why they cannot breed.
        const options = [new Option('请选择犬只',''), ...entries.map(a=>new Option(dogLabel(a),String(a.id)))];
        const signature=JSON.stringify(options.map(o=>[o.value,o.text]));
        if(select.dataset.signature!==signature){select.replaceChildren(...options);select.dataset.signature=signature;}
        select.value=chosenId;
        enhancePicker(select,entries);
        const dog=find(select.value);
        panel.avatar.innerHTML=dog?renderMiniAvatar(dog,72):'';if (!dog) {panel.info.textContent='未选择';return '';}
        const remaining=getRemainingCooldown(dog,time);
        const cooldownText=remaining>0 ? `${Math.floor(Math.ceil(remaining/60000)/60)}小时${Math.ceil(remaining/60000)%60}分钟` : '已就绪';
        panel.info.textContent=[`犬种：${breedName(dog.breedId)}`,`阶段：${stages[dog.stage] || dog.stage}`,`剩余繁育次数：${dog.source==='rental'?1:getRemainingBreedings(dog)}`,`冷却：${cooldownText}`,`状态：${dog.retired?'已退役':dog.activity?'活动中':'空闲'}`,`位置：${dog.location==='nursery'?'饲育屋':dog.location==='computer'?'电脑盒子':dog.location==='breeding'?'繁育室（租借）':dog.location}`].join('\n');
        return select.value;
    }
    function refresh() {
        if(disposed) return;
        const time=now();const inv=getInventory(),old=itemSelect.value;const options=[new Option('不使用（3项IV）',''),... [['destiny_knot','遗传结（4项IV）'],['advanced_destiny_knot','高级遗传结（5项IV）']].map(([k,n])=>{const o=new Option(n+' × '+(inv[k]??0),k);o.disabled=!(inv[k]>0);return o;})];const sig=JSON.stringify(options.map(o=>[o.text,o.disabled]));if(itemSelect.dataset.sig!==sig){itemSelect.replaceChildren(...options);itemSelect.dataset.sig=sig;itemSelect.value=inv[old]>0?old:'';}
        motherId=populate(motherPanel,motherId,time);
        fatherId=populate(fatherPanel,fatherId,time);
        const mother=find(motherId), father=find(fatherId);
        preview.replaceChildren(node('h3','繁育预览'));
        const capacity=getCapacity?.();
        count.textContent=`孵化列表：${eggs.length}${capacity!=null?` / ${capacity}`:""} 枚犬蛋`;
        button.disabled=true;
        if(!mother || !father){preview.append(node('p','请选择完整的父母本。','br-muted'));return;}
        try {
            const result=checkBreedingPair(mother,father,pedigreeRecords,time);
            const f=result.inbreedingCoefficient;
            preview.append(node('p',`后代犬种：${breedName(mother.breedId)}`),node('p',mother.source==='rental'||father.source==='rental'?'租借费已支付，成功产蛋后租借犬离场':'繁育费用：免费'),node('p',`孵化时间：${INCUBATION_HOURS} 游戏小时`),node('p',`近交系数：${typeof f==='number'?(f*100).toFixed(2)+'%':'未返回'}`));
            // Render the engine's value without assuming it is a percentage or multiplier.
            preview.append(node('p','近交按实际家谱计算，不受犬种限制。'),node('p',`新突变基础概率：${(Math.min(1,getMutationRate(mother,father)*(mother.mutationPollen||father.mutationPollen?2:1))*100).toFixed(0)}%${mother.mutationPollen||father.mutationPollen?"（突变花粉生效）":""}`),node('h4','后代外貌预测（未发生新突变时）'));
            const key=JSON.stringify([mother.breedId,mother.genotype,father.genotype]);if(key!==portraitKey){portraitKey=key;portraitRows=predictPortraits(mother,father);portraitPage=0;}
            const gallery=node('div'),nav=node('div');gallery.style.cssText='display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:8px';nav.style.cssText='display:flex;gap:8px;align-items:center;margin:8px 0';
            const drawPortraits=()=>{gallery.replaceChildren();nav.replaceChildren();const size=24,pages=Math.max(1,Math.ceil(portraitRows.length/size));portraitPage=Math.min(portraitPage,pages-1);for(const x of portraitRows.slice(portraitPage*size,(portraitPage+1)*size)){const p=x.phenotype,card=node('div');card.style.cssText='text-align:center;border:1px solid #aaa6;border-radius:8px;padding:6px';card.innerHTML=renderPredictedAvatar(mother.breedId,p);card.append(node('strong',`${(x.probability*100).toPrecision(3)}%`),node('small',[p.coatColor.name,p.patternVisible?p.pattern.name+' '+p.patternColor.name:'纯色',p.eyeColor.name,p.hairLength.name].join(' · ')));card.querySelector('strong').style.display='block';card.querySelector('small').style.display='block';gallery.append(card);}const prev=node('button','上一页'),next=node('button','下一页');prev.type=next.type='button';prev.disabled=portraitPage===0;next.disabled=portraitPage>=pages-1;prev.onclick=()=>{portraitPage--;drawPortraits();};next.onclick=()=>{portraitPage++;drawPortraits();};nav.append(prev,node('span',`${portraitPage+1}/${pages} 页 · ${portraitRows.length}种`),next);};drawPortraits();preview.append(gallery,nav,node('p','各头像概率为未发生新突变时的条件概率，合计100%（四舍五入可能有误差）。','br-muted'));
            const penalty=result.inbreedingPenalty;
            const penaltyText=typeof f==='number' ? (f<=0.0625?'无':f<=0.125?'−5%':f<=0.25?'−10%':'−20%') : '未返回';
            preview.append(node('p',`个体值惩罚（按近交规则）：${penaltyText}`));
            if(penalty!==undefined && typeof f!=='number') preview.append(node('p',`引擎惩罚值：${typeof penalty==='object'?JSON.stringify(penalty):penalty}`));
            for(const reason of messages(result.reasons)) preview.append(node('p',reason,'br-bad'));
            for(const warning of messages(result.warnings)) preview.append(node('p',warning,'br-muted'));
            preview.append(node('p',result.success?'满足繁育条件':'暂不满足繁育条件',result.success?'br-good':'br-bad'));
            const full=capacity!=null && eggs.length>=capacity;
            if(full) preview.append(node("p","孵化室已满，请先领取幼犬。","br-bad"));
            button.disabled=busy || !result.success || full;
        }catch(error){preview.append(node('p',`检查失败：${error.message}`,'br-bad'));}
    }
    button.addEventListener('click',()=>{
        if(busy || disposed) return;
        const mother=find(motherId),father=find(fatherId);
        if(!mother || !father) return;
        if(!window.confirm(`确定让 ${father.name || father.id} 与 ${mother.name || mother.id} 繁育？成功后双方进入24小时冷却。${itemSelect.value?"将消耗一个"+itemSelect.selectedOptions[0].text.split(" × ")[0]+"。":""}`)) return;
        busy=true; button.disabled=true;
        try {
            const ids=makeIds(animals,eggs,pedigreeRecords);
            const result=executeBreeding({mother,father,...ids,eggs,pedigreeRecords,now:now(),item:itemSelect.value});
            status.textContent=result.message || (result.success?'繁育成功':'繁育失败');
            status.className=result.success?'br-good':'br-bad';
            if(result.success) {
                try {onChange(result);} catch(error) {status.textContent+=`；界面更新失败：${error.message}`;}
            }
        } catch(error) {status.textContent=`繁育操作异常：${error.message}`;status.className='br-bad';}
        finally {busy=false;refresh();}
    });
    refresh();
    const timer=setInterval(()=>{if(!busy) refresh();},1000);
    return {refresh,destroy(){disposed=true;clearInterval(timer);wrap.remove();}};
}
