import {witchMarkup} from './witchView.js';
import {ITEMS} from '../engine/training.js';
import {WITCH_RATES} from '../engine/witch.js';
import {gameNow} from '../engine/gameClock.js';
import {dogLabel,emptyFilter,filterDogs,filterMarkup,handleFilterChange,handleFilterClick,enhancePicker} from './dogPicker.js';
import {EXPLORATION_MAPS,EXPLORATION_ITEMS,MAP_BREEDS} from '../config/exploration.js';
import {explorationEligible,explorationReady} from '../engine/exploration.js';
import {getBreed} from '../data/species/dog/breeds.js';
import {GAME_CONFIG} from '../config/game.js';
import {escapeHTML as e,renderAnimalDetail} from './animalView.js';
const H=3600000;
function remaining(ms){const min=Math.max(0,Math.ceil(ms/60000));return `${Math.floor(min/60)}小时${min%60}分钟`;}
export function mountExploration(root,{state,service,notify,onChange,preselected=''}){
    const selections=new Map(EXPLORATION_MAPS.map(m=>[m.id,preselected]));const filters=emptyFilter();let preview=null;const choices=new Map(EXPLORATION_MAPS.map(m=>[m.id,{}]));
    function render(){const fold=root.querySelector(".picker-fold");if(fold)filters.open=fold.open;
        const now=gameNow(state),eligible=filterDogs(Object.values(state.activeAnimals).filter(explorationEligible),filters);
        root.innerHTML=`<h2>地图探索</h2><section class="panel"><p>探索中的地图：${state.explorationTasks.length}/${EXPLORATION_MAPS.length} · 空闲饲育屋犬只：${eligible.length}</p>${filterMarkup(filters)}</section><div class="exploration-grid">${EXPLORATION_MAPS.map(m=>{
            const t=state.explorationTasks.find(x=>x.mapId===m.id),ready=t&&explorationReady(t,now),a=t&&state.activeAnimals[t.animalId];
            const selected=eligible.some(d=>d.id===selections.get(m.id))?selections.get(m.id):eligible[0]?.id;
            if(selected)selections.set(m.id,selected);
            return `<section class="panel exploration-card"><h3>${m.name}</h3><p>优势犬种（4倍权重）：${MAP_BREEDS[m.id].map(id=>getBreed(id).name).join("、")}</p><p>${m.hours}小时 · ${m.multiplier}倍成长经验（${GAME_CONFIG.growth.expPerHour*m.multiplier} EXP/小时）</p><p class="muted">金钱 ${m.money[0]}–${m.money[1]}</p>${t?`<p><strong>${e(a.name)}</strong> · ${ready?'探索完成，待领取':'探索中'}</p><p class="muted">${e(explorationProgress(t,a.name,now))}</p><div class="progress-track"><div class="progress-fill" style="width:${Math.max(0,Math.min(100,(now-t.startedAt)/(t.endsAt-t.startedAt)*100))}%"></div></div><p>已获经验：${Math.floor(t.expEarned)} EXP · ${ready?'可以领取':remaining(t.endsAt-now)}</p>${ready?`<p>获得：${t.reward.money} 金钱${t.reward.item?'、'+EXPLORATION_ITEMS[t.reward.item]:''}</p>${t.reward.extra?.length?`<p>额外道具：${t.reward.extra.map(k=>ITEMS[k]?.name??k).join('、')}${t.reward.extraClaimed?'（已领取）':''}</p>`:''}${witchMarkup(state,t,choices.get(m.id))}${t.reward.puppy?`<p>遇见幼犬：${e(t.reward.puppy.name)} · ${getBreed(t.reward.puppy.breedId).name} · ${t.reward.puppy.sex==='male'?'公犬':'母犬'}</p><div class="dev-buttons"><button class="secondary-button" data-explore="preview" data-map="${m.id}">查看幼犬</button><button class="primary-button" data-explore="adopt" data-map="${m.id}">领养并领取奖励</button><button class="secondary-button" data-explore="claim" data-map="${m.id}">不领养，领取奖励</button></div>`:`<button class="primary-button" data-explore="claim" data-map="${m.id}">领取奖励并返回</button>`}`:`<button class="secondary-button" data-explore="cancel" data-map="${m.id}">提前返回（无奖励）</button>`}`:`<label>选择探索犬只 <select data-explore-select="${m.id}" ${eligible.length?'':'disabled'}>${eligible.length?eligible.map(d=>`<option value="${e(d.id)}" ${d.id===selected?'selected':''}>${e(dogLabel(d))}</option>`).join(''):'<option>无空闲犬只</option>'}</select></label><p><button class="primary-button" data-explore="start" data-map="${m.id}" ${eligible.length?'':'disabled'}>开始探索</button></p>`}</section>`;
        }).join('')}</div><dialog id="exploration-preview"><button class="secondary-button" data-explore="close">关闭</button><div id="exploration-detail"></div></dialog>`;
        for(const sel of root.querySelectorAll("[data-explore-select]"))enhancePicker(sel,eligible);
        if(preview){const t=state.explorationTasks.find(x=>x.mapId===preview);if(t?.reward.puppy&&explorationReady(t,now)){root.querySelector('#exploration-detail').innerHTML=renderAnimalDetail(t.reward.puppy,{readOnly:true,previewLocation:"探索待领养"});root.querySelector('#exploration-preview').showModal();}else preview=null;}
    }
    function change(ev){const w=ev.target.closest('[data-witch]');if(w){choices.get(w.dataset.map)[w.dataset.witch]=w.value;render();return;}if(handleFilterChange(ev,filters,render))return;const el=ev.target.closest('[data-explore-select]');if(el)selections.set(el.dataset.exploreSelect,el.value);}
    function click(ev){if(handleFilterClick(ev,filters,render))return;const b=ev.target.closest('[data-explore]');if(!b||b.disabled)return;const id=b.dataset.map,action=b.dataset.explore;
        if(action==='preview'){preview=id;render();return;}
        if(action==='close'){preview=null;root.querySelector('#exploration-preview').close();return;}
        let r;if(action==='witch-open')r=service.openWitch(id);else if(action==='witch-trade')r=service.witchTrade(id,{kind:'increase',stat:'STR',donor:'SPD',locus:'coatColor',...choices.get(id)});else if(action==='start')r=service.start(id,selections.get(id));else if(action==='cancel')r=service.cancel(id);else if(action==='adopt'||action==='claim')r=service.claim(id,{adopt:action==='adopt'});else return;
        notify(r.message,!r.success);if(r.success)onChange();render();
    }
    root.addEventListener('click',click);root.addEventListener('change',change);
    // Preserve open preview and chosen dogs on periodic refresh.
    const refresh=()=>{if(!root.querySelector('#exploration-preview')?.open&&(!root.contains(document.activeElement)||!['INPUT','SELECT'].includes(document.activeElement.tagName))){preview=null;render();}};
    render();return {refresh,destroy(){root.removeEventListener('click',click);root.removeEventListener('change',change);}};
}

export function explorationProgress(t,name,now){const p=Math.max(0,(now-t.startedAt)/(t.endsAt-t.startedAt));const scenes={park:['沿小路散步','在草地上嗅闻','绕过喷泉'],field:['穿过田埂','追逐落叶','在树荫下休息'],wetland:['沿湖岸前进','观察水面','嗅闻芦苇'],forest:['进入林间小径','寻找林中气味','在树下休息'],snow:['踏过雪地','循着足迹前进','抖落身上的雪']};return name+(p>=1?'返回了。':p<.15?'准备出发。':p<.4?'正在'+(scenes[t.mapId]?.[0]??'散步')+'。':p<.7?'正在'+(scenes[t.mapId]?.[1]??'探索')+'。':p<.9?'正在'+(scenes[t.mapId]?.[2]??'休息')+'。':'正在返回犬舍。');}
