import { getBreed } from '../data/species/dog/breeds.js';
import { getRemainingIncubation, getIncubationProgress, isEggReady } from '../engine/egg.js';

function node(tag, text, className) {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
}

export function formatIncubationTime(ms) {
    const seconds = Math.max(0, Math.ceil(ms / 1000));
    return `${Math.floor(seconds / 3600)}小时${String(Math.floor(seconds / 60) % 60).padStart(2, '0')}分${String(seconds % 60).padStart(2, '0')}秒`;
}

// eggs is the live array shared with breedingRoom. No egg or offspring is mutated here.
export function mountIncubationRoom(root, { eggs, now = () => Date.now(), onClaim = null }) {
    if (!root || !Array.isArray(eggs)) throw new Error('孵化室需要容器和犬蛋列表');
    let disposed = false;
    const wrap = node('section', undefined, 'ir-room');
    wrap.append(node('style', `
        .ir-room{max-width:780px;margin:auto;font:15px/1.6 system-ui,sans-serif;color:inherit}
        .ir-room *{box-sizing:border-box}.ir-room h2,.ir-room h3{margin:0 0 8px}
        .ir-room p{margin:4px 0}.ir-summary{opacity:.75;margin-bottom:12px!important}
        .ir-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:12px}
        .ir-panel{border:1px solid #aaa7;border-radius:12px;padding:16px;min-width:0}
        .ir-top{display:flex;align-items:center;gap:12px}.ir-top>div{min-width:0;flex:1}
        .ir-id{font-size:12px;overflow-wrap:anywhere;opacity:.7}.ir-egg{width:48px;height:62px;flex:none;border:1px solid #b49c75;border-radius:50% 50% 47% 47% / 65% 65% 35% 35%;background:radial-gradient(ellipse at 34% 30%,#fff5df,#d8bd90);display:grid;place-items:center;font-size:22px;color:#6e5737}
        .ir-panel progress{width:100%;height:14px;accent-color:#548064;margin-top:12px}.ir-meta{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;font-size:13px}.ir-ready{color:#267744;font-weight:600}.ir-wait{opacity:.85}.ir-bad{color:#b34840}
        .ir-naming{margin-top:12px}.ir-naming label{display:block;font-size:13px}.ir-naming input{display:block;width:100%;margin:6px 0 10px;padding:8px;border:1px solid #aaa;border-radius:6px}.ir-actions{display:flex;gap:8px;flex-wrap:wrap}.ir-actions button{padding:8px 12px}
        .ir-empty{border:1px dashed #aaa8;border-radius:12px;padding:24px;text-align:center;opacity:.8}
    `), node('h2','孵化室'));
    const summary = node('p', '', 'ir-summary');
    const grid = node('div', undefined, 'ir-grid');
    wrap.append(summary, grid); root.replaceChildren(wrap);
    const cards = new Map();
    function makeCard(egg) {
        const panel = node('article', undefined, 'ir-panel');
        const top = node('div', undefined, 'ir-top');
        const symbol = node('span', '', 'ir-egg'); symbol.setAttribute('aria-hidden','true');
        const meta = node('div'); const title = node('h3'); const id = node('p','','ir-id');
        meta.append(title,id);top.append(symbol,meta);
        const father = node('p'), mother = node('p');
        const progress = node('progress');progress.max=100;progress.setAttribute('aria-label','孵化进度');
        const line = node('div',undefined,'ir-meta');const percent=node('span'), remaining=node('span');line.append(percent,remaining);
        const state=node('p'); const note=node('p','','ir-summary');
        const claim=node('button','领取幼犬');claim.type='button';claim.hidden=true;
        const feedback=node('p');feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');
        const naming=node('form',undefined,'ir-naming');naming.hidden=true;
        const label=node('label','幼犬名称（留空保留默认名称）');
        const name=node('input');name.type='text';name.setAttribute('aria-label','幼犬名称');
        label.append(name);
        const confirm=node('button','确认领取');confirm.type='submit';confirm.className='primary-button';
        const cancel=node('button','取消');cancel.type='button';cancel.className='secondary-button';
        const actions=node('div',undefined,'ir-actions');actions.append(confirm,cancel);
        naming.append(label,actions);
        let busy=false;
        function report(message,success=false){feedback.textContent=message;feedback.className=success?'ir-ready':'ir-bad';}
        function getCurrent(){return eggs.find(e=>e.id===egg.id);}
        function closeNaming(){naming.hidden=true;claim.hidden=false;}
        claim.addEventListener('click',()=>{
            const current=getCurrent();
            if(!current||!onClaim||!isEggReady(current,now())){report('犬蛋尚未就绪或已领取，请刷新后重试。');refresh();return;}
            feedback.textContent='';name.value=current.offspringData?.name||'';naming.hidden=false;claim.hidden=true;name.focus();name.select();
        });
        cancel.addEventListener('click',()=>{if(!busy){closeNaming();feedback.textContent='';refresh();}});
        naming.addEventListener('submit',event=>{
            event.preventDefault();if(busy||naming.hidden)return;
            const current=getCurrent();
            if(!current||!onClaim||!isEggReady(current,now())){report('犬蛋尚未就绪或已领取，请刷新后重试。');refresh();return;}
            const cleaned=name.value.trim();
            if([...cleaned].length>20){report('名称最多20个字符。');name.focus();return;}
            busy=true;confirm.disabled=true;cancel.disabled=true;
            try{
                const result=onClaim(current.id,cleaned);
                report(result?.message||'领取失败：未收到操作结果。',result?.success===true);
                if(result?.success)closeNaming();
            }catch(e){report(e.message||'领取失败，请重试。');}
            finally{busy=false;confirm.disabled=false;cancel.disabled=false;refresh();}
        });
        panel.append(top,father,mother,progress,line,state,note,claim,naming,feedback);
        return {panel,symbol,title,id,father,mother,progress,percent,remaining,state,note,claim,naming};
    }
    function refresh() {
        if (disposed) return;
        const time = now();
        const seen = new Set(); let readyCount=0, invalidCount=0;
        for (const egg of eggs) {
            if (!egg || !egg.id || seen.has(egg.id)) { invalidCount++; continue; }
            seen.add(egg.id);
            let c=cards.get(egg.id);
            if (!c) {c=makeCard(egg);cards.set(egg.id,c);grid.append(c.panel);}
            let breed;try{breed=getBreed(egg.breedId);}catch{/* display ID as fallback */}
            c.title.textContent=breed?.nameZh??breed?.nameCN??breed?.name??egg.breedId??'未知犬种';
            c.id.textContent=`犬蛋：${egg.id}`;
            c.father.textContent=egg.source==='competition'?'来源：高级赛奖励':`父本：${egg.fatherName||'未知'}`;
            c.mother.textContent=egg.source==='competition'?'初代犬 · 无已知亲缘':`母本：${egg.motherName||'未知'}`;
            if (!Number.isFinite(egg.createdAt)||!Number.isFinite(egg.hatchAt)||egg.hatchAt<=egg.createdAt||!Number.isFinite(time)) {
                invalidCount++;c.claim.hidden=true;c.naming.hidden=true;c.progress.value=0;c.percent.textContent='—';c.remaining.textContent='—';c.symbol.textContent='!';c.state.textContent='计时数据异常';c.state.className='ir-bad';c.note.textContent='请检查存档；未修改原数据。';continue;
            }
            const ready=isEggReady(egg,time), pct=getIncubationProgress(egg,time), left=getRemainingIncubation(egg,time);
            if(ready)readyCount++;
            c.symbol.textContent=ready?'✓':'';
            c.progress.value=pct;
            c.percent.textContent=`${ready?100:Math.min(99.9,Math.floor(pct*10)/10).toFixed(1)}%`;
            c.remaining.textContent=ready?'剩余 0小时':`剩余 ${formatIncubationTime(left)}（游戏时间）`;
            c.state.textContent=ready?'孵化完成 · 待领取':'孵化中';c.state.className=ready?'ir-ready':'ir-wait';
            if(!ready||!onClaim)c.naming.hidden=true;
            c.claim.hidden=!ready||!onClaim||!c.naming.hidden;
            c.note.textContent=ready?(onClaim?'犬蛋不会过期；可以领取并命名。':'犬蛋不会过期；等待领取。'):'关闭页面后仍然继续计时。';
        }
        for(const [id,c] of cards)if(!seen.has(id)){c.panel.remove();cards.delete(id);}
        let empty=grid.querySelector('.ir-empty');
        if(!eggs.length&&!empty)grid.append(node('div','暂无犬蛋，请前往繁育室。','ir-empty'));
        if(eggs.length&&empty)empty.remove();
        summary.textContent=`共 ${eggs.length} 枚 · 孵化中 ${Math.max(0,eggs.length-readyCount-invalidCount)} 枚 · 待领取 ${readyCount} 枚${invalidCount?` · 异常 ${invalidCount} 枚`:''}`;
    }
    const onVisible=()=>{if(!document.hidden)refresh();};
    refresh();const timer=setInterval(refresh,1000);
    document.addEventListener('visibilitychange',onVisible);window.addEventListener('pageshow',refresh);
    return {refresh,destroy(){if(disposed)return;disposed=true;clearInterval(timer);document.removeEventListener('visibilitychange',onVisible);window.removeEventListener('pageshow',refresh);wrap.remove();cards.clear();}};
}
