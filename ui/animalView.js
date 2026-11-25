import {
    getBreed,
    SIZE_CLASSES
} from "../data/species/dog/breeds.js";

import {
    getPersonality
} from "../data/species/dog/personalities.js";

import {
    APPEARANCE_LOCI,
    getGene
} from "../data/species/dog/appearance.js";

import {
    LIFE_STAGES,
    LOCATIONS,
    ANIMAL_SOURCES,
    calculateAdultWeight,
    calculateCurrentWeight,
    getAnimalPhenotype
} from "../engine/animal.js";

import {
    STAT_KEYS,
    STAT_NAMES,
    calculateStats,
    calculateTotal
} from "../engine/stats.js";

import {
    hasMutation,
    hasVisibleMutation
} from "../engine/genetics.js";

import {
    GAME_CONFIG
} from "../config/game.js";


// 防止玩家输入的名称被当作HTML执行
export function escapeHTML(value) {
    return String(value ?? "").replace(
        /[&<>"']/g,
        char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]
    );
}


// 性别显示
export function getSexText(sex) {
    return sex === "female" ? "♀ 母犬" : "♂ 公犬";
}


// 颜色显示
function renderColor(hex, name) {
    return `
        <span class="color-label">
            <span class="color-swatch"
                  style="background:${hex}">
            </span>
            ${escapeHTML(name)}
        </span>
    `;
}


// 获取成长经验显示
function getGrowthInfo(animal) {
    const growth = GAME_CONFIG.growth;

    if (animal.stage === "adult") {
        return {
            text: "已成年",
            percent: 100
        };
    }

    const target =
        animal.stage === "puppy"
            ? growth.juvenileExp
            : growth.adultExp;

    const start =
        animal.stage === "juvenile"
            ? growth.juvenileExp
            : 0;

    const percent = Math.max(
        0,
        Math.min(
            100,
            (animal.exp - start) /
            (target - start) * 100
        )
    );

    return {
        text: `${Math.floor(animal.exp)} / ${target} EXP`,
        percent: percent
    };
}


// 犬只列表卡片
export function renderAnimalCard(animal) {
    const breed = getBreed(animal.breedId);

    const personality =
        getPersonality(animal.personality);

    const phenotype =
        getAnimalPhenotype(animal);

    const growth = getGrowthInfo(animal);

    return `
        <article class="animal-card">

            <div class="animal-card-header">

                <div class="animal-placeholder"
                     style="background:${phenotype.coatColor.hex}">
                </div>

                <div>
                    <h3>${escapeHTML(animal.name)}</h3>

                    
                </div>

            </div>

            <div class="animal-meta">
                ${breed.name} ·
                ${getSexText(animal.sex)} ·
                ${LIFE_STAGES[animal.stage]}${animal.activity === "exploration" ? " · 探索中/待返回" : animal.activity === "training" ? " · 训练中/待领取" : animal.activity === "competition" ? " · 比赛中/待领奖" : ""}
            </div>

            <div class="animal-summary">

                <div>
                    毛色：
                    ${renderColor(
                        phenotype.coatColor.hex,
                        phenotype.coatColor.name
                    )}
                </div>

                <div>
                    花纹：${phenotype.displayPattern}
                </div>

                <div>
                    性格：${personality.name}${({gentle:"（自然成长经验+20%）",adventurous:"（探索经验+20%）",lucky:"（道具/幼犬奖励概率×1.2）",diligent:"（训练努力值+20%）",foodie:"（零食经验+20%）",playful:"（玩具经验+20%）",competitive:"（比赛奖金+10%）"})[animal.personality]??""}
                </div>

                <div>
                    个体值：${calculateTotal(animal.iv)}/60
                </div>

            </div>

            <div class="progress-track">
                <div class="progress-fill"
                     style="width:${growth.percent}%">
                </div>
            </div>

            <div class="muted">
                ${growth.text}
            </div>

            <button type="button"
                    class="primary-button"
                    data-action="view-animal"
                    data-id="${animal.id}">
                查看详情
            </button>

        </article>
    `;
}


// 犬只列表
export function renderAnimalList(animals) {
    if (animals.length === 0) {
        return `
            <div class="empty-state">
                此处目前没有犬只。
            </div>
        `;
    }

    return `
        <div class="animal-grid">
            ${animals.map(renderAnimalCard).join("")}
        </div>
    `;
}


// 能力表格
function renderStatsTable(animal) {
    const breed = getBreed(animal.breedId);

    const stats = calculateStats(animal);

    return `
        <table class="data-table">

            <thead>
                <tr>
                    <th>能力</th>
                    <th>种族值</th>
                    <th>个体值</th>
                    <th>努力值</th>
                    <th>实际能力</th>
                </tr>
            </thead>

            <tbody>

                ${STAT_KEYS.map(key => `
                    <tr>
                        <td>${STAT_NAMES[key]}</td>
                        <td>${breed.baseStats[key]}</td>
                        <td>${animal.iv[key]}</td>
                        <td>${animal.ev[key]}</td>
                        <td><strong>${stats[key]}</strong></td>
                    </tr>
                `).join("")}

                <tr class="total-row">
                    <td>总和</td>
                    <td>${calculateTotal(breed.baseStats)}</td>
                    <td>${calculateTotal(animal.iv)}/60</td>
                    <td>${calculateTotal(animal.ev)}/300</td>
                    <td>${calculateTotal(stats)}</td>
                </tr>

            </tbody>

        </table>
    `;
}


// 基因型表格
function renderGenotypeTable(animal) {
    const phenotype =
        getAnimalPhenotype(animal);

    return `
        <table class="data-table">

            <thead>
                <tr>
                    <th>遗传位点</th>
                    <th>等位基因1</th>
                    <th>等位基因2</th>
                    <th>表现性状</th>
                </tr>
            </thead>

            <tbody>

                ${Object.entries(APPEARANCE_LOCI)
                    .map(([locus, name]) => {

                        const alleles =
                            animal.genotype[locus];

                        const gene1 =
                            getGene(locus, alleles[0].allele);

                        const gene2 =
                            getGene(locus, alleles[1].allele);

                        let display =
                            phenotype[locus].name;

                        if (
                            locus === "patternColor" &&
                            !phenotype.patternVisible
                        ) {
                            display = "隐藏";
                        }

                        if (locus === "pattern") {
                            display = phenotype.displayPattern;
                        }

                        return `
                            <tr>
                                <td>${name}</td>

                                <td>
                                    ${gene1.name}
                                    ${alleles[0].mutated ? "★" : ""}
                                    <small>${alleles[0].allele} · 显性等级 ${gene1.dominance}</small>
                                </td>

                                <td>
                                    ${gene2.name}
                                    ${alleles[1].mutated ? "★" : ""}
                                    <small>${alleles[1].allele} · 显性等级 ${gene2.dominance}</small>
                                </td>

                                <td>${display}</td>
                            </tr>
                        `;
                    }).join("")}

            </tbody>

        </table>
    `;
}


// 犬只完整详情
export function renderAnimalDetail(animal, {readOnly=false,previewLocation="市场待售",pedigreeRecords={}}={}) {
    const breed = getBreed(animal.breedId);

    const personality =
        getPersonality(animal.personality);

    const phenotype =
        getAnimalPhenotype(animal);

    const growth = getGrowthInfo(animal);

    const mutationText =
        hasVisibleMutation(phenotype)
            ? "表现突变性状"
            : hasMutation(animal.genotype)
                ? "携带突变基因"
                : "无";

    const targetLocation =
        animal.location === "nursery"
            ? "computer"
            : "nursery";

    return `

        <section class="detail-section">

            <div class="detail-title">

                <div class="animal-placeholder large"
                     style="background:${phenotype.coatColor.hex}">
                </div>

                <div>
                    <h2>${escapeHTML(animal.name)}</h2>
                    
                    <p>${breed.name} · ${getSexText(animal.sex)}</p>
                </div>

            </div>

            ${readOnly ? "" : `
            <div class="action-row">

                <div class="rename-group">

                    <input type="text"
                           id="animal-name-input"
                           ${animal.birthNamingUsed ? "disabled" : ""}
                           maxlength="20"
                           value="${escapeHTML(animal.name)}"
                           placeholder="输入犬只名称"
                           aria-label="犬只名称"
                           autocomplete="off">

                    <button type="button"
                            class="secondary-button"
                            ${animal.birthNamingUsed ? "disabled" : ""}
                            data-action="rename-animal"
                            data-id="${animal.id}">
                        ${animal.birthNamingUsed ? "出生已命名" : "保存名称"}
                    </button>

                </div>

                <button type="button"
                        class="primary-button"
                        ${animal.activity != null ? "disabled" : ""}
                        data-action="move-animal"
                        data-id="${animal.id}"
                        data-target="${targetLocation}">
                    移至${LOCATIONS[targetLocation]}
                </button>
                ${animal.location === "pending" ? `<button type="button" class="secondary-button" data-action="move-animal" data-id="${animal.id}" data-target="computer">移至电脑盒子</button>` : ""}

            </div>

            <div class="action-row">${[["exploration","地图探索"],["training","训练与道具"],["breeding","繁育中心"],["competition","比赛中心"]].map(([page,label])=>`<button class="secondary-button" data-action="dispatch-animal" data-id="${animal.id}" data-target="${page}" ${animal.activity!=null||animal.retired||(page!=="breeding"&&(animal.location!=="nursery"||animal.source==="rental"))||(page==="breeding"&&animal.stage!=="adult")?"disabled":""}>前往${label}</button>`).join("")}</div>
            <p id="rename-message"
               class="muted"
               role="status"
               aria-live="polite">
            </p>
            `}

        </section>


        <section class="detail-section">

            <h3>基本信息</h3>

            <div class="info-grid">

                <div>犬种：${breed.name}</div>

                <div>
                    体型：${SIZE_CLASSES[breed.size].name}
                </div>

                <div>
                    阶段：${LIFE_STAGES[animal.stage]}
                </div>

                <div>
                    性格：${personality.name}${({gentle:"（自然成长经验+20%）",adventurous:"（探索经验+20%）",lucky:"（道具/幼犬奖励概率×1.2）",diligent:"（训练努力值+20%）",foodie:"（零食经验+20%）",playful:"（玩具经验+20%）",competitive:"（比赛奖金+10%）"})[animal.personality]??""}
                </div>

                <div>
                    位置：${readOnly ? escapeHTML(previewLocation) : LOCATIONS[animal.location]}${animal.activity === "exploration" ? "（探索中/待返回）" : animal.activity === "training" ? "（训练中/待领取）" : animal.activity === "competition" ? "（比赛中/待领奖）" : ""}
                </div>

                <div>
                    来源：${ANIMAL_SOURCES[animal.source]}
                </div>

                <div>
                    当前体重：
                    ${calculateCurrentWeight(animal).toFixed(2)} kg
                </div>

                <div>
                    成年体重：
                    ${calculateAdultWeight(animal).toFixed(2)} kg
                </div>

            </div>

            <p>成长经验：${growth.text}</p>
            <p>女巫改造：潜能 ${animal.witchChanges?.iv??0}/3 · 基因 ${animal.witchChanges?.gene??0}/1</p>
            ${animal.luckyCharm?'<p>幸运护符：下次探索生效</p>':''}${animal.mutationPollen?'<p>突变花粉：下次繁育生效</p>':''}

            <div class="progress-track">
                <div class="progress-fill"
                     style="width:${growth.percent}%">
                </div>
            </div>

        </section>


        <section class="detail-section">

            <h3>外貌性状</h3>

            <div class="info-grid">

                <div>
                    基础毛色：
                    ${renderColor(
                        phenotype.coatColor.hex,
                        phenotype.coatColor.name
                    )}
                </div>

                <div>
                    花纹：${phenotype.displayPattern}
                </div>

                <div>
                    花纹颜色：
                    ${phenotype.patternVisible
                        ? renderColor(
                            phenotype.patternColor.hex,
                            phenotype.patternColor.name
                        )
                        : "隐藏"}
                </div>

                <div>
                    眼睛颜色：
                    ${renderColor(
                        phenotype.eyeColor.hex,
                        phenotype.eyeColor.name
                    )}
                </div>

                <div>
                    毛发长度：${phenotype.hairLength.name}
                </div>

                <div>
                    突变状态：${mutationText}
                </div>

            </div>

        </section>


        <section class="detail-section">

            <h3>能力信息</h3>

            ${renderStatsTable(animal)}

        </section>


        <section class="detail-section">

            <details>

                <summary>查看完整基因型</summary>

                ${renderGenotypeTable(animal)}

                <p>
                    体重遗传值：${animal.weightGene}/100
                </p>

            </details>

        </section>


        <section class="detail-section">

            <h3>血统信息</h3>

            <div class="info-grid">

                <div>
                    世代：第${animal.pedigree.generation}代
                </div>

                <div>
                    母亲：${escapeHTML(pedigreeRecords[animal.pedigree.motherId]?.name ?? "未知")}
                </div>

                <div>
                    父亲：${escapeHTML(pedigreeRecords[animal.pedigree.fatherId]?.name ?? "未知")}
                </div>

            </div>

        </section>

    `;
}