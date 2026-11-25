import { getAllBreeds } from '../data/species/dog/breeds.js';
import { SAVE_KEY } from '../storage/save.js';
import { applyDevAction, commitDevState, blankDevState } from '../engine/devTools.js';

export function renderDevPanel(root,{state,persist,onChange,notify,storage=localStorage}) {
    root.innerHTML=`<h2>开发者测试工具</h2>
    <section class="panel"><strong>独立测试存档</strong><p>以下操作仅影响开发模式。正式游戏存档不会被修改。首次使用可复制正式存档，或点击「犬舍总览」建立测试犬舍。快进会同时推进成长、繁育冷却、孵化、训练、比赛、地图探索及市场日期，不会改变电脑盒子内犬只的自然成长规则。</p><a href="./index.html">返回正式游戏</a></section>
    <section class="panel"><h3>时间管理</h3><div class="dev-buttons" id="dev-time"></div></section>
    <section class="panel"><h3>繁育调试</h3><div class="dev-buttons" id="dev-breeding"></div><p style="margin-top:12px"><label for="dev-breed">测试犬种：</label> <select id="dev-breed"></select> <button class="secondary-button" id="dev-pair">生成一对成年测试犬</button></p></section>
    <section class="panel"><h3>市场调试</h3><div class="dev-buttons" id="dev-market"></div><p>快进24小时即可推进市场日期；可付费刷新当前市场。</p></section><section class="panel"><h3>探索调试</h3><div class="dev-buttons" id="dev-exploration"></div><p>强制遇见幼犬仅改变当前测试探索任务的幼犬奖励；快进可推进探索计时。</p></section><section class="panel"><h3>训练调试</h3><div class="dev-buttons" id="dev-training"></div></section><section class="panel"><h3>存档管理</h3><p>可导出测试存档 JSON，或从文件导入。复制正式存档会覆盖当前测试进度，反向写入不提供。</p><div class="dev-buttons" id="dev-save"></div><input id="dev-import" type="file" accept=".json,application/json" hidden></section>`;
    const find=s=>root.querySelector(s);
    const select=find('#dev-breed');for(const b of getAllBreeds()){const o=document.createElement('option');o.value=b.id;o.textContent=b.name;select.append(o);}
    function run(make,message){try{commitDevState(state,persist,make);onChange();notify(message);}catch(e){notify(e.message,true);}}
    function action(type,opts={},message='操作完成'){run(d=>{applyDevAction(d,type,opts);return d;},message);}
    function button(container,label,fn,requiresGame=true){const b=document.createElement('button');b.className='secondary-button';b.type='button';b.textContent=label;b.disabled=requiresGame&&!state.initialized;b.onclick=fn;find(container).append(b);}
    for(const [h,label] of [[1,'+1小时'],[12,'+12小时'],[24,'+24小时'],[48,'+48小时'],[168,'+7天']])button('#dev-time',label,()=>action('advance',{hours:h},`已快进 ${h} 小时`));
    button('#dev-time','立即成年',()=>action('adult',{},'空闲未退役犬只已成年（含盒子及等待安置）'));
    button('#dev-breeding','立即孵化全部犬蛋',()=>action('hatch',{},'全部犬蛋已达到领取时间'));
    button('#dev-breeding','解除繁育冷却',()=>action('cooldown',{},'繁育冷却已解除，次数不变'));
    button('#dev-breeding','恢复繁育次数',()=>{if(confirm('将所有现役犬只的已用繁育次数清零并解除冷却？'))action('counts',{},'繁育次数已恢复，冷却同时解除');});
    find('#dev-pair').disabled=!state.initialized;find('#dev-pair').onclick=()=>action('pair',{breedId:select.value},'已生成一对成年测试犬');
    button('#dev-market','增加1000测试金钱',()=>action('market-money',{},'已增加1000测试金钱'));
    button('#dev-market','市场推进一天',()=>action('advance',{hours:24},'已快进24小时，市场更新'));
    button('#dev-exploration','当前任务必遇幼犬',()=>action('exploration-puppies',{},'当前探索任务已确保遇见幼犬'));
    button('#dev-exploration','当前任务必遇女巫',()=>action('exploration-witch',{},'当前未领取任务已确保遇见女巫'));
    button('#dev-training','每种道具增加10个',()=>action('training-items',{},'每种道具已增加10个'));
    button('#dev-time','+2小时',()=>action('advance',{hours:2},'已快进2小时'));
    button('#dev-time','+4小时',()=>action('advance',{hours:4},'已快进4小时'));
    button('#dev-save','手动保存',()=>action('save',{},'测试存档已保存'));
    button('#dev-save','导出JSON存档',()=>{try{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='dogbreedsim-dev-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('已发起测试存档导出');}catch(e){notify(e.message,true);}},false);
    button('#dev-save','导入JSON存档',()=>find('#dev-import').click(),false);
    find('#dev-import').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const raw=JSON.parse(await file.text());if(confirm('导入将覆盖当前测试存档，是否继续？'))run(()=>raw,'测试存档已导入');}catch(err){notify(err.message,true);}finally{e.target.value='';}};
    button('#dev-save','复制正式存档',()=>{if(!confirm('复制正式存档并覆盖当前测试进度？正式存档不会改变。'))return;try{const raw=storage.getItem(SAVE_KEY);if(raw===null)throw Error('尚无正式存档，请先建立正式犬舍');run(()=>JSON.parse(raw),'正式存档已复制到开发模式');}catch(e){notify(e.message,true);}},false);
    button('#dev-save','重置测试存档',()=>{if(confirm('清空当前测试存档？正式存档不会改变。'))run(blankDevState,'测试存档已重置');},false);
}
