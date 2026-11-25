import { escapeHTML, renderAnimalDetail } from './animalView.js';
import { getBreed } from '../data/species/dog/breeds.js';
import { LIFE_STAGES, getAnimalPhenotype } from '../engine/animal.js';
import { getPersonality } from '../data/species/dog/personalities.js';
import { MARKET_REFRESH_PRICE, paidRefreshRemaining, marketPlacement, nextMarketRefresh, priceBreakdown } from '../engine/market.js';

export function mountMarket(root,{state,service,notify,onPurchase,now=()=>Date.now()}){
    let expanded=null, confirming=null, message='', error=false, rental=false, refreshConfirm=false;
    function render(){
        const market=rental?state.rentalMarket:state.market, space=marketPlacement(state,rental);
        const verb=rental?'租借':'购买';
        root.innerHTML=`<h2>犬只市场</h2><div class="action-row"><button data-market-tab="buy" ${!rental?'disabled':''}>犬只购买</button><button data-market-tab="rent" ${rental?'disabled':''}>租借配种</button></div><section class="panel"><p>${rental?'每日六只成年犬 · 配种后归还':'每日六只 · 零点刷新'}</p><p>市场日期：${escapeHTML(market.day??'尚未刷新')} · 剩余 ${market.listings.filter(l=>!l.purchasedAnimalId).length}/${market.listings.length} 只 · 金钱：${escapeHTML(state.money)}</p><button data-market-refresh ${state.money<MARKET_REFRESH_PRICE||paidRefreshRemaining(state,rental,now())>0?"disabled":""}>付费刷新 · ${MARKET_REFRESH_PRICE} G</button>${refreshConfirm?`<div class="market-confirm"><p>花费${MARKET_REFRESH_PRICE} G重新生成当前页面全部商品？已购买或租借犬不受影响。</p><button data-market-refresh-confirm>确认刷新</button> <button data-market-refresh-cancel>取消</button></div>`:""}<p class="muted" data-market-countdown></p><p class="muted">${rental?(space?'繁育室有空位':'繁育室已满'):space?'购买后优先安置于'+(space==='nursery'?'饲育屋':'电脑盒子'):'饲育屋及电脑盒子已满，请先腾出位置。'}</p><p data-market-message role="status" style="color:${error?'#b34840':'#52765b'}">${escapeHTML(message)}</p></section><div class="animal-grid">${market.listings.map(l=>{
            const a=l.animal, p=getAnimalPhenotype(a), sold=l.purchasedAnimalId!==null, ask=confirming===l.id;
            const price=priceBreakdown(a), disabled=sold||!space||state.money<l.price;
            return `<article class="animal-card market-card"><div class="animal-card-header market-card-click" data-market-detail="${escapeHTML(l.id)}"><div class="animal-placeholder" style="background:${p.coatColor.hex}"></div><div><h3>${escapeHTML(a.name)}</h3><div class="muted">${escapeHTML(getBreed(a.breedId).name)} · ${a.sex==='female'?'♀ 母犬':'♂ 公犬'} · ${LIFE_STAGES[a.stage]}</div></div></div><div class="animal-summary"><div>毛色：${escapeHTML(p.coatColor.name)}</div><div>花纹：${escapeHTML(p.displayPattern)}</div><div>瞳色：${escapeHTML(p.eyeColor.name)}</div><div>性格：${escapeHTML(getPersonality(a.personality).name)}</div><div>个体值：${Object.values(a.iv).reduce((x,y)=>x+y,0)}/60</div></div><p><strong>价格：${l.price}</strong> ${sold?' · '+(rental?'已租借':'已售出'):''}</p><div class="action-row"><button type="button" class="secondary-button" data-market-detail="${escapeHTML(l.id)}">查看详情</button><button type="button" class="primary-button" data-market-buy="${escapeHTML(l.id)}" ${disabled?'disabled':''}>${sold?(rental?'已租借':'已售出'):state.money<l.price?'金钱不足':!space?'空间不足':verb}</button></div>${ask&&!disabled?`<div class="market-confirm"><p>确定花费 ${l.price} ${verb}${escapeHTML(a.name)}？</p><button type="button" class="primary-button" data-market-confirm="${escapeHTML(l.id)}">确认${verb}</button> <button type="button" class="secondary-button" data-market-cancel>取消</button></div>`:''}</article>`;
        }).join('')}</div>`;
        updateCountdown();
    }
    function updateCountdown(){
        const el=root.querySelector('[data-market-countdown]');if(!el)return;
        const seconds=Math.max(0,Math.ceil((nextMarketRefresh(state,now())-now())/1000));
        const left=paidRefreshRemaining(state,rental,now());const btn=root.querySelector("[data-market-refresh]");if(btn){btn.disabled=state.money<MARKET_REFRESH_PRICE||left>0;btn.textContent=left>0?`付费刷新冷却 · ${Math.ceil(left/60000)}分钟`:`付费刷新 · ${MARKET_REFRESH_PRICE} G`;}
        el.textContent=`距离下次零点刷新：${Math.floor(seconds/3600)}小时 ${Math.floor(seconds%3600/60)}分 ${seconds%60}秒`;
    }
    function refresh(){
        const r=service.refresh();
        if(!r.success){message=r.message;error=true;render();return;}
        if(r.changed){expanded=null;confirming=null;refreshConfirm=false;message='今日市场已刷新';error=false;render();}
        else updateCountdown();
    }
    function click(e){
        const header=e.target.closest('.market-card-click');
        if(header){openListing(header.dataset.marketDetail);return;}
        const btn=e.target.closest('button');if(!btn||btn.disabled)return;
        if(btn.dataset.marketTab){rental=btn.dataset.marketTab==='rent';expanded=null;confirming=null;refreshConfirm=false;message='';render();}
        else if(btn.hasAttribute('data-market-refresh')){refreshConfirm=true;confirming=null;render();}
        else if(btn.hasAttribute('data-market-refresh-cancel')){refreshConfirm=false;render();}
        else if(btn.hasAttribute('data-market-refresh-confirm')&&refreshConfirm){refreshConfirm=false;const r=service.paidRefresh(rental);expanded=null;confirming=null;message=r.message;error=!r.success;if(r.success)onPurchase?.(r);notify?.(message,error);render();}
        else if(btn.dataset.marketDetail){openListing(btn.dataset.marketDetail);}
        else if(btn.dataset.marketBuy){confirming=btn.dataset.marketBuy;render();}
        else if(btn.hasAttribute('data-market-cancel')){confirming=null;render();}
        else if(btn.dataset.marketConfirm){
            const r=service.buy(btn.dataset.marketConfirm,rental);confirming=null;message=r.message;error=!r.success;
            if(r.success)onPurchase?.(r);
            notify?.(message,error);render();
        }
    }
    const detailDialog=document.createElement('dialog');detailDialog.className='market-preview-dialog';document.body.append(detailDialog);
    function openListing(id){const listing=(rental?state.rentalMarket:state.market).listings.find(l=>l.id===id);if(!listing)return;
        detailDialog.innerHTML=`<div class="dialog-header"><h2>犬只详情</h2><button class="secondary-button" data-close-market>关闭</button></div>${renderAnimalDetail(listing.animal,{readOnly:true,showGenotype:true,actualStatsOnly:true,previewLocation:rental?'市场待租':'市场待售'})}`;
        detailDialog.querySelector('[data-close-market]').onclick=()=>detailDialog.close();if(!detailDialog.open)detailDialog.showModal();}
    root.addEventListener('click',click);
    render();refresh();
    const timer=setInterval(refresh,1000);
    return {destroy(){detailDialog.remove();clearInterval(timer);root.removeEventListener('click',click);}};
}
