import { GAME_CONFIG } from "../config/game.js";

import {
    APPEARANCE_LOCI
} from "../data/species/dog/appearance.js";

import {
    STAT_KEYS
} from "./stats.js";

import {
    calculatePhenotype,
    hasMutation,
    hasVisibleMutation,
    getMutationRecords
} from "./genetics.js";

import {
    calculateAdultWeight
} from "./animal.js";

import {
    checkBreedingPair
} from "./breeding.js";

import {
    generateOffspringData
} from "./offspring.js";


// ==================================================
// 1. 统计工具
// ==================================================

function increment(counter, key) {

    counter[key] = (counter[key] ?? 0) + 1;

}


function createCounter() {

    return Object.create(null);

}


function createStatistics() {

    return {

        total: 0,

        sex: createCounter(),

        breed: createCounter(),

        appearance: Object.fromEntries(

            Object.keys(APPEARANCE_LOCI).map(

                locus => [locus, createCounter()]

            )

        ),

        genotype: Object.fromEntries(

            Object.keys(APPEARANCE_LOCI).map(

                locus => [locus, createCounter()]

            )

        ),

        personality: createCounter(),

        iv: {

            sum: 0,

            min: null,

            max: null,

            histogram: createCounter(),

            statSums: Object.fromEntries(

                STAT_KEYS.map(key => [key, 0])

            ),

            average: 0,

            averages: {},

            perfectCount: 0

        },

        weight: {

            sum: 0,

            min: null,

            max: null,

            average: 0

        },

        mutation: {

            triggered: 0,

            newMutation: 0,

            carriers: 0,

            visible: 0,

            hidden: 0,

            loci: createCounter(),

            alleleCounts: createCounter(),

            carriersByColor: createCounter()

        },

        inbreeding: {

            coefficient: 0,

            penalty: 0,

            totalIVLoss: 0,

            averageIVLoss: 0

        }

    };

}


// ==================================================
// 2. 统计单只后代
// ==================================================

function collectStatistics(stats, child) {

    stats.total++;

    increment(stats.sex, child.sex);

    increment(stats.breed, child.breedId);

    increment(
        stats.personality,
        child.personality
    );


    // 外貌表现型与基因型

    const phenotype =
        calculatePhenotype(child.genotype);

    for (
        const locus of
        Object.keys(APPEARANCE_LOCI)
    ) {

        let name = phenotype[locus].name;

        if (locus === "pattern") {

            name = phenotype.displayPattern;

        }

        if (

            locus === "patternColor" &&

            !phenotype.patternVisible

        ) {

            name = "隐藏";

        }

        increment(
            stats.appearance[locus],
            name
        );

        const genotypeName = child.genotype[locus]

            .map(a => a.allele)

            .sort()

            .join("/");

        increment(
            stats.genotype[locus],
            genotypeName
        );

    }


    // 个体值统计

    const totalIV = STAT_KEYS.reduce(

        (sum, key) => sum + child.iv[key],

        0

    );

    stats.iv.sum += totalIV;

    stats.iv.min = stats.iv.min === null

        ? totalIV

        : Math.min(stats.iv.min, totalIV);

    stats.iv.max = stats.iv.max === null

        ? totalIV

        : Math.max(stats.iv.max, totalIV);

    increment(
        stats.iv.histogram,
        totalIV
    );

    for (const key of STAT_KEYS) {

        stats.iv.statSums[key] += child.iv[key];

    }

    const maxIV =

        GAME_CONFIG.stats.ivMax *

        STAT_KEYS.length;

    if (totalIV === maxIV) {

        stats.iv.perfectCount++;

    }


    // 成年体重统计

    const weight = calculateAdultWeight(child);

    stats.weight.sum += weight;

    stats.weight.min = stats.weight.min === null

        ? weight

        : Math.min(stats.weight.min, weight);

    stats.weight.max = stats.weight.max === null

        ? weight

        : Math.max(stats.weight.max, weight);


    // 新突变统计

    if (child.mutationInfo.triggered) {

        stats.mutation.triggered++;

    }

    if (child.mutationInfo.occurred) {

        stats.mutation.newMutation++;

        const mutation =
            child.mutationInfo.newMutation;

        increment(
            stats.mutation.loci,
            mutation.locus
        );

    }


    // 已有突变及可见突变

    if (hasMutation(child.genotype)) {

        stats.mutation.carriers++;

        if (hasVisibleMutation(phenotype)) {

            stats.mutation.visible++;

        } else {

            stats.mutation.hidden++;

        }

    }

    const records =
        getMutationRecords(child.genotype);

    const colors = new Set();

    for (const record of records) {

        increment(

            stats.mutation.alleleCounts,

            record.allele

        );

        colors.add(record.allele);

    }

    for (const color of colors) {

        increment(

            stats.mutation.carriersByColor,

            color

        );

    }


    // 近交统计

    const inbreeding =
        child.inheritance.inbreeding;

    stats.inbreeding.coefficient =
        inbreeding.coefficient;

    stats.inbreeding.penalty =
        inbreeding.penalty;

    stats.inbreeding.totalIVLoss +=
        inbreeding.totalLoss;

}


// ==================================================
// 3. 完成统计
// ==================================================

function finalizeStatistics(stats) {

    if (stats.total === 0) {

        return stats;

    }

    stats.iv.average =

        stats.iv.sum / stats.total;

    for (const key of STAT_KEYS) {

        stats.iv.averages[key] =

            stats.iv.statSums[key] / stats.total;

    }

    stats.weight.average =

        stats.weight.sum / stats.total;

    stats.inbreeding.averageIVLoss =

        stats.inbreeding.totalIVLoss / stats.total;

    return stats;

}


// ==================================================
// 4. 批量繁育模拟
// ==================================================

export function simulateBreeding(

    mother,

    father,

    pedigreeRecords = {},

    options = {}

) {

    const {

        count = 100,

        idPrefix = "SIM_" + Date.now(),

        now = Date.now()

    } = options;

    if (

        !Number.isInteger(count) ||

        count < 1 ||

        count > 10000

    ) {

        throw new Error(
            "单次模拟数量必须为1～10000。"
        );

    }

    if (

        typeof idPrefix !== "string" ||

        !idPrefix.trim()

    ) {

        throw new Error(
            "模拟编号前缀无效。"
        );

    }

    const eligibility = checkBreedingPair(

        mother,

        father,

        pedigreeRecords,

        now

    );

    if (!eligibility.success) {

        throw new Error(

            eligibility.reasons.join("\n")

        );

    }

    const stats = createStatistics();

    const offspring = [];

    const start = performance.now();

    for (let i = 0; i < count; i++) {

        const child = generateOffspringData(

            mother,

            father,

            `${idPrefix}_${i + 1}`,

            pedigreeRecords

        );

        collectStatistics(
            stats,
            child
        );

        offspring.push(child);

    }

    return {

        count,

        eligibility,

        offspring,

        statistics:
            finalizeStatistics(stats),

        elapsedMilliseconds:

            performance.now() - start

    };

}


// ==================================================
// 5. CSV导出工具
// ==================================================

function csvCell(value) {

    let text = String(value ?? "");

    // 防止电子表格将文本解释为公式

    if (

        typeof value === "string" &&

        /^[\s]*[=+\-@]/.test(text)

    ) {

        text = "'" + text;

    }

    return '"' +

        text.replace(/"/g, '""') +

        '"';

}


export function offspringToCSV(offspring) {

    const loci =
        Object.keys(APPEARANCE_LOCI);

    const headers = [

        "ID",

        "名称",

        "犬种ID",

        "性别",

        "世代",

        "母亲ID",

        "父亲ID",

        "性格ID",

        "体重遗传值",

        "成年体重kg",

        ...loci.flatMap(locus => [

            `${locus}_母系基因`,

            `${locus}_父系基因`,

            `${locus}_表现型`

        ]),

        ...STAT_KEYS.map(
            key => `${key}_IV`
        ),

        "IV总和",

        "近交系数",

        "近交惩罚比例",

        "IV总损失",

        "是否携带突变",

        "是否表现突变",

        "是否产生新突变",

        "新突变位点",

        "突变来源"

    ];

    const rows = [

        headers.map(csvCell).join(",")

    ];

    for (const child of offspring) {

        const phenotype =
            calculatePhenotype(
                child.genotype
            );

        const inbreeding =
            child.inheritance.inbreeding;

        const mutation =
            child.mutationInfo.newMutation;

        const totalIV = STAT_KEYS.reduce(

            (sum, key) => sum + child.iv[key],

            0

        );

        const records =
            getMutationRecords(child.genotype);

        const row = [

            child.id,

            child.name,

            child.breedId,

            child.sex,

            child.pedigree.generation,

            child.pedigree.motherId,

            child.pedigree.fatherId,

            child.personality,

            child.weightGene,

            calculateAdultWeight(child).toFixed(2),

            ...loci.flatMap(locus => {

                let name =
                    phenotype[locus].name;

                if (locus === "pattern") {

                    name = phenotype.displayPattern;

                }

                if (

                    locus === "patternColor" &&

                    !phenotype.patternVisible

                ) {

                    name = "隐藏";

                }

                return [

                    child.genotype[locus][0].allele,

                    child.genotype[locus][1].allele,

                    name

                ];

            }),

            ...STAT_KEYS.map(
                key => child.iv[key]
            ),

            totalIV,

            inbreeding.coefficient,

            inbreeding.penalty,

            inbreeding.totalLoss,

            hasMutation(child.genotype) ? 1 : 0,

            hasVisibleMutation(phenotype) ? 1 : 0,

            child.mutationInfo.occurred ? 1 : 0,

            mutation?.locus ?? "",

            records.map(record =>

                `${record.locus}:` +

                `${record.allele}:` +

                `${record.mutationOrigin}`

            ).join(";")

        ];

        rows.push(

            row.map(csvCell).join(",")

        );

    }

    // BOM方便Windows Excel正确识别中文

    return "\uFEFF" + rows.join("\r\n");

}