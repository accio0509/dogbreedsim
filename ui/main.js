import {emptyFilter,filterDogs,filterMarkup,handleFilterChange,handleFilterClick} from './dogPicker.js';
import {getBreed} from '../data/species/dog/breeds.js';
import {calculateTotal} from '../engine/stats.js';
import {migrateSave,SAVE_KEY} from '../storage/save.js';
const boxFilter=emptyFilter();let boxSort='breed';
import {upgradeFacility,buyItem,retireAnimal} from '../engine/management.js';
import {renderManagement,renderCollection,renderFamily} from './managementView.js';
import {gameNow,changeSpeed,SPEEDS} from '../engine/gameClock.js';
import {createCompetitionService,COMPETITIONS,COMPETITION_LEVELS,competitionHonors} from '../engine/competition.js';
import {mountCompetition} from './competitionView.js';
let competitionService,competitionRoom;
import {createTrainingService} from "../engine/training.js";
import {mountTraining} from "./trainingView.js";
let trainingService,trainingRoom;
import { createExplorationService } from "../engine/exploration.js";
import { mountExploration } from "./explorationView.js";
import { createMarketService } from "../engine/market.js";
import { mountMarket } from "./marketView.js";
import { DEV_SAVE_KEY } from "../engine/devTools.js";
import { renderDevPanel } from "./devPanel.js";
import { createSaveStore } from "../storage/save.js";
import { settleGrowth } from "../engine/growth.js";
import { createFormalBreeding } from "../engine/formalBreeding.js";
import { mountBreedingRoom } from "./breedingRoom.js";
import { mountIncubationRoom } from "./incubationRoom.js";

import {
    getCurrentTime,
    formatTime
} from "../engine/time.js";

import {
    getAllBreeds
} from "../data/species/dog/breeds.js";

import {
    gameState,
    initializeGame,
    getAnimals,
    getAnimal,
    getAnimalsByLocation,
    getLocationCount,
    renameAnimal,
    moveAnimal
} from "../storage/state.js";

import {
    escapeHTML,
    renderAnimalList,
    renderAnimalDetail
} from "./animalView.js";


// 当前界面
let currentPage = "overview";

let selectedAnimalId = null;
let room = null;
let store;
let breeding;
let marketService;
let marketRoom;
let explorationService, explorationRoom;
let fatalSave = false;
const DEV_MODE = new URLSearchParams(location.search).get("dev") === "1";

function showNotice(message, bad = false) {
    const notice = document.getElementById('game-notice');
    notice.textContent = message;
    notice.style.color = bad ? '#b34840' : '#52765b';
}

function persist(candidate) {
    if (fatalSave) throw Error('存档不可用，请先刷新或备份');
    return store.save(candidate);
}

function commitAction(action) {
    const before = structuredClone(gameState);
    try {
        const result = action();
        if (!result.success) { Object.assign(gameState,before); return result; }
        gameState.timestamps.lastPlayedAt = Date.now();
        persist(gameState);
        return result;
    } catch(e) {
        Object.assign(gameState,before);
        return {success:false,message:e.message};
    }
}

function updateGrowth() {
    if (!gameState.initialized || fatalSave) return false;
    const draft=structuredClone(gameState);
    if (!settleGrowth(draft)) return false;
    try { draft.timestamps.lastPlayedAt=Date.now(); persist(draft); Object.assign(gameState,draft); return true; }
    catch(e){showNotice(e.message,true);return false;}
}

function renderBreedingPage(page,preselected) {
    const root = document.createElement('div');
    mainContent.replaceChildren(root);
    if (page==='breeding') {
        const animals=getAnimals(), eggs=gameState.incubationTasks, records=gameState.pedigreeRecords;
        room=mountBreedingRoom(root,{animals,eggs,pedigreeRecords:records,preselected,now:()=>gameNow(gameState),
            makeIds:()=>({}), getCapacity:()=>breeding.capacity().incubation,
            executeBreeding:({mother,father})=>breeding.breed(mother.id,father.id),
            onChange:r=>{syncRoom();showNotice(r.message);updateHeader();}
        });
        room.sync=()=>{animals.splice(0,animals.length,...getAnimals());if(eggs!==gameState.incubationTasks)eggs.splice(0,eggs.length,...gameState.incubationTasks);if(records!==gameState.pedigreeRecords){for(const k of Object.keys(records))delete records[k];Object.assign(records,gameState.pedigreeRecords);}};
    } else {
        const eggs=gameState.incubationTasks;
        room=mountIncubationRoom(root,{eggs,now:()=>gameNow(gameState),onClaim:(id,name)=>{
            const r=breeding.claim(id,name);showNotice(r.message,!r.success);if(r.success){syncRoom();updateHeader();}return r;
        }});
        room.sync=()=>{if(eggs!==gameState.incubationTasks)eggs.splice(0,eggs.length,...gameState.incubationTasks);};
    }
}
function syncRoom(){room?.sync?.();room?.refresh();}

function renderPedigree(){
    mainContent.innerHTML='<h2>血统家谱</h2><section class="panel"><p>永久记录所有已登记犬只及父母关系。</p><div id="pedigree-list"></div></section>';
    const root=document.getElementById('pedigree-list');
    for(const r of Object.values(gameState.pedigreeRecords)){
        const row=document.createElement('div');row.className='event-item';
        const p=r.pedigree??{};const name=id=>id?(gameState.pedigreeRecords[id]?.name??'未知'):'未知';
        row.textContent=`${r.name} · 第${p.generation??1}代 · 母：${name(p.motherId)} · 父：${name(p.fatherId)}`;
        root.append(row);
    }
}



// 页面名称
const PAGE_NAMES = {
    overview: "犬舍总览",
    nursery: "饲育屋",
    computer: "电脑盒子",
    breeding: "繁育中心",
    incubation: "孵化室",
    market: "犬只市场",
    exploration: "地图探索",
    training: "训练",
    warehouse:"道具仓库",
    competition: "犬只比赛",
    pedigree: "血统家谱",
    collection: "性状图鉴",
    management: "犬舍经营",
    events: "事件记录",
    settings: "游戏设置",
    dev: "开发者工具"
};


// 页面元素
const mainContent =
    document.getElementById("main-content");

const animalDialog =
    document.getElementById("animal-dialog");

const animalDetail =
    document.getElementById("animal-detail");


// 更新现实时间
function updateClock() {
    document.getElementById("real-time").textContent =
        formatTime(getCurrentTime())+` · 游戏${gameState.gameClock?.speed??1}倍速`;
}


// 更新顶部信息
function updateHeader() {
    document.getElementById("money-display").textContent =
        `金钱：${gameState.money.toLocaleString()}`;

    document.getElementById("sidebar-kennel-name").textContent =
        gameState.kennelName;
}


// 新游戏初始化界面
function renderNewGame() {
    const breeds = getAllBreeds();

    mainContent.innerHTML = `

        <section class="panel setup-panel">

            <h2>建立你的犬舍</h2>

            <p>
                选择初始犬种。
                初始犬只：一公一母。
            </p>

            <form id="new-game-form">

                <label for="kennel-name">
                    犬舍名称
                </label>

                <input id="kennel-name"
                       name="kennelName"
                       maxlength="20"
                       value="我的犬舍"
                       required>

                <label>初始犬种</label>

                <div class="breed-options">

                    ${breeds.map((breed, index) => `

                        <label class="breed-option">

                            <input type="radio"
                                   name="breedId"
                                   value="${breed.id}"
                                   ${index === 0 ? "checked" : ""}>

                            <strong>${breed.name}</strong>

                            <span class="muted">
                                成年体重
                                ${breed.weightRange.min}～
                                ${breed.weightRange.max} kg
                            </span>

                        </label>

                    `).join("")}

                </div>

                <p class="muted">
                    初始资金：${gameState.money}
                </p>

                <button type="submit"
                        class="primary-button">
                    建立犬舍
                </button>

            </form>

        <div class="action-row"><button data-action="import-save">导入已有存档</button><input hidden type="file" id="import-save-file" accept=".json,application/json"></div>
        </section>
    `;

    document.getElementById("new-game-form")
        .addEventListener("submit", event => {

            event.preventDefault();

            const data = new FormData(event.target);

            const result = commitAction(() => initializeGame(
                data.get("kennelName"),
                data.get("breedId")
            ));

            if (!result.success) {
                alert(result.message);
                return;
            }

            renderPage("overview");
        });
}


// 设施容量显示
function renderCapacity(name, count, capacity) {
    const percent = capacity > 0
        ? Math.min(100, count / capacity * 100)
        : 0;

    return `

        <div class="capacity-item">

            <div class="capacity-heading">
                <span>${name}</span>
                <strong>${count}/${capacity}</strong>
            </div>

            <div class="progress-track">
                <div class="progress-fill"
                     style="width:${percent}%">
                </div>
            </div>

        </div>

    `;
}


// 事件记录
function renderEvents(limit = null) {
    const events = limit === null
        ? gameState.events
        : gameState.events.slice(0, limit);

    if (events.length === 0) {
        return `<p class="muted">暂无事件记录。</p>`;
    }

    return events.map(event => `

        <div class="event-item">

            <div class="event-time">
                ${formatTime(event.timestamp)}
            </div>

            <div>
                ${escapeHTML(event.message)}
            </div>

        </div>

    `).join("");
}


// 犬舍总览
function renderOverview() {
    mainContent.innerHTML = `

        <h2>犬舍总览</h2>

        <div class="overview-grid">

            <section class="panel">

                <h3>犬舍信息</h3>

                <div class="info-grid">

                    <div>
                        犬舍名称：
                        ${escapeHTML(gameState.kennelName)}
                    </div>

                    <div>
                        当前金钱：${gameState.money}
                    </div>

                    <div>
                        现役犬只：${getAnimals().filter(a=>a.source!=="rental").length}
                    </div>

                    <div>
                        血统档案：
                        ${Object.keys(
                            gameState.pedigreeRecords
                        ).length}
                    </div>

                </div>

            </section>

            <section class="panel">

                <h3>设施容量</h3>

                ${renderCapacity(
                    "饲育屋",
                    getLocationCount("nursery"),
                    gameState.facilities.nursery.capacity
                )}

                ${renderCapacity(
                    "电脑盒子",
                    getLocationCount("computer"),
                    gameState.facilities.computer.capacity
                )}

                ${renderCapacity(
                    "繁育室",
                    getLocationCount("breeding"),
                    gameState.facilities.breeding.capacity
                )}

                ${renderCapacity(
                    "孵化室",
                    gameState.incubationTasks.length,
                    gameState.facilities.incubation.capacity
                )}

            </section>

        </div>

        <section class="panel">

            <h3>饲育屋犬只</h3>

            ${renderAnimalList(
                getAnimalsByLocation("nursery")
            )}

        </section>

        <section class="panel">
            <h3>等待安置犬只（${getLocationCount("pending")}）</h3>
            ${renderAnimalList(getAnimalsByLocation("pending"))}
        </section>
        <section class="panel">

            <h3>最近事件</h3>

            ${renderEvents(5)}

        </section>

    `;
}


// 饲育屋与电脑盒子页面
function renderLocation(location) {
    let animals = getAnimalsByLocation(location);
    const occupied=animals.length;
    if(location==="computer"){animals=filterDogs(animals,boxFilter);const cmp=(a,b)=>boxSort==="iv"?calculateTotal(b.iv)-calculateTotal(a.iv):boxSort==="age"?b.exp-a.exp:boxSort==="sex"?a.sex.localeCompare(b.sex):boxSort==="name"?a.name.localeCompare(b.name,"zh"):getBreed(a.breedId).name.localeCompare(getBreed(b.breedId).name,"zh");animals.sort((a,b)=>cmp(a,b)||a.name.localeCompare(b.name,"zh")||a.id.localeCompare(b.id));}

    const capacity =
        gameState.facilities[location].capacity;

    const title = PAGE_NAMES[location];

    const description =
        location === "nursery"
            ? "空闲犬只自然成长。"
            : "存放犬只，不增长经验。";

    mainContent.innerHTML = `

        <h2>${title}</h2>

        <section class="panel">

            <p>${description}</p>

            ${renderCapacity(
                title,
                occupied,
                capacity
            )}

        </section>

        ${location==="computer"?`<section class="panel">${filterMarkup(boxFilter)}<label>自动整理 <select id="box-sort">${[["breed","犬种"],["name","名称"],["sex","性别"],["age","年龄"],["iv","个体值"]].map(([k,v])=>`<option value="${k}" ${boxSort===k?"selected":""}>${v}</option>`).join("")}</select></label><small>显示 ${animals.length}/${occupied} 只</small></section>`:""}${renderAnimalList(animals)}

    `;
}


// 完整事件记录页面
function renderEventPage() {
    mainContent.innerHTML = `

        <h2>事件记录</h2>

        <section class="panel">
            ${renderEvents()}
        </section>

    `;
}


// 尚未开放的功能
function renderUnavailable(page) {
    mainContent.innerHTML = `

        <h2>${PAGE_NAMES[page]}</h2>

        <section class="panel empty-state">

            <h3>功能尚未开放</h3>

            <p>
                该功能将在后续版本中加入。
            </p>

        </section>

    `;
}


// 页面切换
function renderPage(page = currentPage,preselected = '') {
    competitionRoom?.destroy(); competitionRoom=null;
    room?.destroy(); room=null;
    marketRoom?.destroy(); marketRoom=null;
    explorationRoom?.destroy(); explorationRoom=null;
    trainingRoom?.destroy(); trainingRoom=null;
    currentPage = page;
    if(fatalSave) return;
    updateGrowth();
    updateHeader();

    document.querySelectorAll("[data-page]")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.page === page
            );

            button.disabled =
                !gameState.initialized && !(DEV_MODE && ["dev","overview"].includes(button.dataset.page));
        });

    if (DEV_MODE && page === "dev") {
        renderDevPanel(mainContent,{state:gameState,persist,onChange:()=>renderPage("dev"),notify:showNotice});
        return;
    }

    if (!gameState.initialized) {
        renderNewGame();
        return;
    }

    switch (page) {

        case "overview":
            renderOverview();
            break;

        case "nursery":
        case "computer":
            renderLocation(page);
            break;

        case "breeding":
        case "incubation":
            renderBreedingPage(page,preselected);
            break;
        case "market":
            marketRoom=mountMarket(mainContent,{state:gameState,service:marketService,notify:showNotice,onPurchase:updateHeader});
            break;
        case "warehouse":
        case "training":
            trainingRoom=mountTraining(mainContent,{state:gameState,service:trainingService,preselected,warehouse:page==="warehouse",notify:showNotice,onChange:updateHeader});
            break;
        case "exploration":
            explorationRoom=mountExploration(mainContent,{state:gameState,service:explorationService,preselected,notify:showNotice,onChange:updateHeader});
            break;
        case "competition":
            competitionRoom=mountCompetition(mainContent,{state:gameState,service:competitionService,preselected,notify:showNotice,onChange:updateHeader});
            break;
        case "pedigree":
            renderFamily(mainContent,gameState);
            break;
        case "management":
            renderManagement(mainContent,gameState);
            break;
        case "collection":
            renderCollection(mainContent,gameState);
            break;
        case "events":
            renderEventPage();
            break;

        case "settings":
            mainContent.innerHTML = `<h2>游戏设置</h2><section class="panel"><p>${DEV_MODE ? "当前为独立开发模式。" : "游戏自动存档。"}</p><label>游戏时间倍率 <select id="game-speed">${SPEEDS.map(n=>`<option value="${n}" ${n===(gameState.gameClock?.speed??1)?"selected":""}>${n}倍速</option>`).join("")}</select></label><p>任务按游戏时间，市场按现实时间。</p><div class="action-row"><button data-action="export-save">导出存档</button><button data-action="import-save">导入存档</button><input hidden type="file" id="import-save-file" accept=".json,application/json"></div><details><summary>游戏帮助</summary><p>饲育屋成长，成年犬可繁育。探索与比赛获得奖励，训练增加努力值。道具仓库使用道具。设置倍速可缩短等待时间。</p></details><a href="${DEV_MODE ? "./index.html" : "./index.html?dev=1"}">${DEV_MODE ? "返回正式游戏" : "打开独立开发模式"}</a></section>`;
            break;
        default:
            renderUnavailable(page);
    }
}


// 打开犬只详情
function openAnimalDetail(id) {
    const animal = getAnimal(id);

    if (!animal) {
        return;
    }

    selectedAnimalId = id;

    animalDetail.innerHTML =
        renderAnimalDetail(animal,{pedigreeRecords:gameState.pedigreeRecords})+`<section class="detail-section"><button data-action="retire-animal" data-id="${id}" ${animal.activity!=null||animal.source==='rental'?'disabled':''}>永久退役</button><div id="retire-confirmation" hidden><p>确认永久退役？此操作不可撤销，犬只将不再参与任何活动。</p><button data-action="confirm-retire" data-id="${id}">确认退役</button> <button data-action="cancel-retire">取消</button></div><p>退役后释放位置，家谱及荣誉记录永久保留。</p></section>`+`<section class="detail-section"><h3>冠军荣誉</h3>${competitionHonors(gameState,id).map(h=>`<p>🏆 ${({puppy:"幼犬",juvenile:"青年犬",adult:"成年犬"})[h.stage]}组 · ${COMPETITION_LEVELS.find(l=>l.id===h.levelId)?.name}${COMPETITIONS.find(c=>c.id===h.eventId)?.name}冠军 ×${h.count}</p>`).join("")||"暂无冠军荣誉"}<h3>参赛记录</h3>${gameState.competitionRecords.filter(r=>r.animalId===id).map(r=>`<p>${COMPETITION_LEVELS.find(l=>l.id===r.levelId)?.name??""}${COMPETITIONS.find(c=>c.id===r.eventId)?.name??"比赛"} · 第${r.rank}名 · ${r.score}分 · ${r.money} G</p>`).join("")||"暂无比赛记录"}</section>`;

    if (!animalDialog.open) {
        animalDialog.showModal();
    }
}


// 显示犬只详情操作提示
function showRenameMessage(message, success = true) {
    const element =
        document.getElementById("rename-message");

    if (!element) {
        return;
    }

    element.textContent = message;

    element.style.color = success
        ? "#52765B"
        : "#B94A48";
}


// 保存犬只名称
function saveAnimalName(id) {
    const animal = getAnimal(id);

    if (!animal) {
        return;
    }

    const input =
        document.getElementById("animal-name-input");

    if (!input) {
        return;
    }

    const name = input.value.trim();

    // 检查名称是否为空
    if (!name) {
        showRenameMessage(
            "犬只名称不能为空。",
            false
        );

        input.focus();
        return;
    }

    // 检查名称长度
    if (name.length > 20) {
        showRenameMessage(
            "犬只名称不能超过20个字符。",
            false
        );

        input.focus();
        return;
    }

    // 名称未发生改变
    if (name === animal.name) {
        showRenameMessage(
            "名称未发生改变。"
        );

        return;
    }

    // 调用状态管理模块修改名称
    const result = commitAction(() => renameAnimal(id, name));

    if (!result.success) {
        showRenameMessage(
            result.message,
            false
        );

        return;
    }

    // 更新主页面中的犬只列表
    renderPage();

    // 更新犬只详情
    openAnimalDetail(id);

    // 显示成功提示
    showRenameMessage(
        `名称已保存：${name}`
    );
}


document.addEventListener("toggle",event=>{if(currentPage==="computer"&&event.target.matches?.(".picker-fold"))boxFilter.open=event.target.open;},true);
document.addEventListener("change",event=>{if(currentPage==="computer"){if(event.target.id==="box-sort"){boxSort=event.target.value;renderPage();return;}if(handleFilterChange(event,boxFilter,renderPage))return;}if(event.target.id!=="game-speed")return;const speed=Number(event.target.value),r=commitAction(()=>{const real=Date.now();settleGrowth(gameState,gameNow(gameState,real));changeSpeed(gameState,speed,real);return {success:true};});showNotice(r.success?`已设置${speed}倍速`:r.message,!r.success);renderPage("settings");});
// 统一处理按钮点击
document.addEventListener("click", event => {
    if(currentPage==="computer"&&handleFilterClick(event,boxFilter,renderPage))return;

    const pageButton =
        event.target.closest("[data-page]");

    if (pageButton) {
        if (!pageButton.disabled) {
            renderPage(pageButton.dataset.page);
        }

        return;
    }

    const actionButton =
        event.target.closest("[data-action]");

    if (!actionButton) {
        return;
    }

    const id = actionButton.dataset.id;

    const action = actionButton.dataset.action;


    switch (action) {
        case "export-save": {const blob=new Blob([JSON.stringify(gameState,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='dogbreedsim-'+(DEV_MODE?'dev-':'')+Date.now()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);break;}
        case "import-save": {const input=document.getElementById('import-save-file');input.onchange=async()=>{try{const file=input.files[0];if(!file)return;const candidate=migrateSave(JSON.parse(await file.text()));if(!confirm('导入将替换当前存档，继续？'))return;const key=DEV_MODE?DEV_SAVE_KEY:SAVE_KEY;const previous=localStorage.getItem(key);if(previous!==null)localStorage.setItem(key+':backup',previous);persist(candidate);location.reload();}catch(e){showNotice('导入失败：'+e.message,true);} };input.click();break;}

        case "retire-animal": {document.getElementById('retire-confirmation').hidden=false;break;}
        case "cancel-retire": {document.getElementById('retire-confirmation').hidden=true;break;}
        case "confirm-retire": {const r=commitAction(()=>retireAnimal(gameState,id,gameNow(gameState)));showNotice(r.message,!r.success);if(r.success){animalDialog.close();renderPage();}else showRenameMessage(r.message,false);break;}
        case "upgrade-facility":
        case "buy-item": {
            const r=commitAction(()=>action==="upgrade-facility"?upgradeFacility(gameState,id):buyItem(gameState,id));
            showNotice(r.message,!r.success);renderPage("management");break;
        }

        // 查看犬只详情
        case "view-animal":

            openAnimalDetail(id);

            break;


        // 修改犬只名称
        case "rename-animal":

            saveAnimalName(id);

            break;


        case "dispatch-animal": {
            const a=getAnimal(id),target=actionButton.dataset.target;
            if(!a||a.activity!=null||a.retired)return;
            animalDialog.close();renderPage(target,id);break;
        }
        // 移动犬只
        case "move-animal": {

            const target =
                actionButton.dataset.target;

            const result =
                commitAction(() => moveAnimal(id, target));

            if (!result.success) {
                showRenameMessage(
                    result.message,
                    false
                );

                return;
            }

            renderPage();

            openAnimalDetail(id);

            const locationName =
                target === "nursery"
                    ? "饲育屋"
                    : "电脑盒子";

            showRenameMessage(
                `已移动至${locationName}。`
            );

            break;
        }

        default:
            break;
    }

});


// 支持按Enter键保存犬只名称
document.addEventListener("keydown", event => {

    if (
        event.target.id === "animal-name-input" &&
        event.key === "Enter" &&
        !event.isComposing &&
        event.keyCode !== 229
    ) {
        event.preventDefault();

        if (selectedAnimalId) {
            saveAnimalName(selectedAnimalId);
        }
    }

});


// 输入新名称时清除旧提示
document.addEventListener("input", event => {

    if (event.target.id === "animal-name-input") {

        const message =
            document.getElementById("rename-message");

        if (message) {
            message.textContent = "";
        }
    }

});


// 关闭犬只详情
document.getElementById("close-dialog")
    .addEventListener("click", () => {
        animalDialog.close();
    });


// 清除当前选中的犬只
animalDialog.addEventListener("close", () => {
    selectedAnimalId = null;
});


// 游戏初始化
function initGame() {
    updateClock();
    setInterval(updateClock, 1000);
    try {
        store=createSaveStore(localStorage, DEV_MODE ? DEV_SAVE_KEY : undefined);
        if(DEV_MODE){
            document.getElementById("dev-navigation").hidden=false;
            document.getElementById("dev-indicator").hidden=false;
        }
        const saved=store.load();
        if(saved) Object.assign(gameState,saved);
        breeding=createFormalBreeding({state:gameState,persist});
        marketService=createMarketService({state:gameState,persist});
        explorationService=createExplorationService({state:gameState,persist});
        trainingService=createTrainingService({state:gameState,persist});
        competitionService=createCompetitionService({state:gameState,persist});
        renderPage(DEV_MODE ? "dev" : currentPage);
        setInterval(()=>{
            const changed=updateGrowth();
            if(changed) updateHeader();
            if(explorationRoom) explorationRoom.refresh();
            if(trainingRoom) trainingRoom.refresh();
            if(competitionRoom) competitionRoom.refresh();
            if(changed && room) syncRoom();
            else if(changed && ['overview','nursery','computer'].includes(currentPage) && !animalDialog.open) renderPage();
        },30000);
    } catch(e) {
        fatalSave=true;
        document.querySelectorAll('[data-page]').forEach(b=>b.disabled=true);
        mainContent.textContent='存档读取失败：'+e.message+'。原存档未覆盖。';const download=document.createElement('button');download.textContent='导出原始存档';download.onclick=()=>{const url=URL.createObjectURL(new Blob([localStorage.getItem(DEV_MODE?DEV_SAVE_KEY:SAVE_KEY)??''],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='damaged-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};mainContent.append(download);
        showNotice('存档无法读取',true);
    }
    console.log('狗狗育种模拟器 V1.0.0 初始化完成');
}

initGame();