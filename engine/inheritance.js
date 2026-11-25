import {
    GAME_CONFIG
} from "../config/game.js";

import {
    PERSONALITIES
} from "../data/species/dog/personalities.js";

import {
    STAT_KEYS
} from "./stats.js";

import {
    randomChoice
} from "./genetics.js";


// ==================================================
// 1. 通用工具
// ==================================================


// 生成指定范围内的随机整数
function randomInt(min, max) {

    return Math.floor(

        Math.random() * (max - min + 1)

    ) + min;

}


// 限制数值范围
function clamp(value, min, max) {

    return Math.max(
        min,
        Math.min(max, value)
    );

}


// 无放回随机抽样
export function sampleWithoutReplacement(
    array,
    count
) {

    if (
        !Number.isInteger(count) ||
        count < 0 ||
        count > array.length
    ) {

        throw new Error(
            "无放回抽样数量无效。"
        );

    }

    const pool = [...array];

    const result = [];

    for (let i = 0; i < count; i++) {

        const index = randomInt(
            0,
            pool.length - 1
        );

        result.push(
            pool.splice(index, 1)[0]
        );

    }

    return result;

}


// ==================================================
// 2. 个体值校验
// ==================================================


export function validateIV(iv) {

    if (!iv || typeof iv !== "object") {

        throw new Error(
            "个体值数据不存在。"
        );

    }

    const {
        ivMin,
        ivMax
    } = GAME_CONFIG.stats;

    if (
        Object.keys(iv).length !==
        STAT_KEYS.length
    ) {

        throw new Error(
            "个体值必须包含六项能力。"
        );

    }

    for (const key of STAT_KEYS) {

        const value = iv[key];

        if (

            !Number.isInteger(value) ||

            value < ivMin ||

            value > ivMax

        ) {

            throw new Error(
                `${key} 个体值无效：${value}`
            );

        }

    }

    return true;

}


// ==================================================
// 3. 个体值遗传
// ==================================================


export function inheritIV(mother, father, inheritedCount = GAME_CONFIG.stats.inheritedIVCount) {

    validateIV(mother.iv);

    validateIV(father.iv);

    const config = GAME_CONFIG.stats;

    // 随机选择三个不同的能力维度
    const inheritedKeys =
        sampleWithoutReplacement(

            STAT_KEYS,

            inheritedCount

        );

    const iv = {};

    // 保存各项个体值来源
    const sources = {};

    for (const key of STAT_KEYS) {

        if (inheritedKeys.includes(key)) {

            // 每项独立决定继承父亲还是母亲
            const fromMother =
                Math.random() < 0.5;

            const parent = fromMother
                ? mother
                : father;

            iv[key] = parent.iv[key];

            sources[key] = fromMother
                ? "mother"
                : "father";

        } else {

            // 剩余维度随机生成
            iv[key] = randomInt(

                config.ivMin,

                config.ivMax

            );

            sources[key] = "random";

        }

    }

    validateIV(iv);

    return {

        iv,

        inheritedKeys,

        sources

    };

}


// ==================================================
// 4. 性格遗传
// ==================================================


export function inheritPersonality(
    mother,
    father
) {

    const motherPersonality =
        mother.personality;

    const fatherPersonality =
        father.personality;

    if (
        !Object.hasOwn(
            PERSONALITIES,
            motherPersonality
        )
    ) {

        throw new Error(
            "母本性格不存在。"
        );

    }

    if (
        !Object.hasOwn(
            PERSONALITIES,
            fatherPersonality
        )
    ) {

        throw new Error(
            "父本性格不存在。"
        );

    }

    const probabilities =
        GAME_CONFIG.genetics
            .personalityInheritance;

    const total =

        probabilities.mother +

        probabilities.father +

        probabilities.random;

    if (
        Math.abs(total - 1) > 0.000001 ||

        Object.values(probabilities).some(
            value =>
                !Number.isFinite(value) ||
                value < 0
        )
    ) {

        throw new Error(
            "性格遗传概率配置错误。"
        );

    }

    const roll = Math.random();

    // 10%继承母亲
    if (roll < probabilities.mother) {

        return {

            personality:
                motherPersonality,

            source: "mother"

        };

    }

    // 10%继承父亲
    if (

        roll <

        probabilities.mother +
        probabilities.father

    ) {

        return {

            personality:
                fatherPersonality,

            source: "father"

        };

    }

    // 剩余80%只从非亲本性格中抽取
    const candidates = Object.keys(
        PERSONALITIES

    ).filter(id =>

        id !== motherPersonality &&

        id !== fatherPersonality

    );

    return {

        personality:
            randomChoice(candidates),

        source: "random"

    };

}


// ==================================================
// 5. 体重遗传值校验
// ==================================================


export function validateWeightGene(value) {

    if (

        !Number.isInteger(value) ||

        value < 0 ||

        value > 100

    ) {

        throw new Error(
            `无效体重遗传值：${value}`
        );

    }

    return true;

}


// ==================================================
// 6. 体重遗传
// ==================================================


export function inheritWeightGene(
    mother,
    father
) {

    validateWeightGene(
        mother.weightGene
    );

    validateWeightGene(
        father.weightGene
    );

    const variation =
        GAME_CONFIG.breeding.weightVariation;

    if (

        !Number.isInteger(variation) ||

        variation < 0

    ) {

        throw new Error(
            "体重随机波动配置错误。"
        );

    }

    const average = (

        mother.weightGene +

        father.weightGene

    ) / 2;

    const offset = randomInt(

        -variation,

        variation

    );

    const rawValue = average + offset;

    const weightGene = clamp(

        Math.round(rawValue),

        0,

        100

    );

    return {

        weightGene,

        parentalAverage: average,

        offset,

        rawValue

    };

}


// ==================================================
// 7. 性别生成
// ==================================================


export function generateSex() {

    return Math.random() < 0.5

        ? "female"

        : "male";

}


// ==================================================
// 8. 血统遗传
// ==================================================


export function inheritPedigree(
    mother,
    father
) {

    if (

        typeof mother.id !== "string" ||

        !mother.id.trim() ||

        typeof father.id !== "string" ||

        !father.id.trim() ||

        mother.id === father.id

    ) {

        throw new Error(
            "亲本编号无效。"
        );

    }

    const motherGeneration =
        mother.pedigree?.generation;

    const fatherGeneration =
        father.pedigree?.generation;

    if (

        !Number.isInteger(motherGeneration) ||

        motherGeneration < 1 ||

        !Number.isInteger(fatherGeneration) ||

        fatherGeneration < 1

    ) {

        throw new Error(
            "亲本世代数据无效。"
        );

    }

    return {

        motherId: mother.id,

        fatherId: father.id,

        generation: Math.max(

            motherGeneration,

            fatherGeneration

        ) + 1

    };

}


// ==================================================
// 9. 综合属性遗传
// ==================================================


export function inheritAttributes(
    mother,
    father, inheritedCount
) {

    if (!mother || !father) {

        throw new Error(
            "必须提供两个亲本。"
        );

    }

    if (

        mother.sex !== "female" ||

        father.sex !== "male"

    ) {

        throw new Error(
            "亲本性别顺序错误。"
        );

    }

    const ivResult = inheritIV(
        mother,
        father, inheritedCount
    );

    const personalityResult =
        inheritPersonality(
            mother,
            father
        );

    const weightResult =
        inheritWeightGene(
            mother,
            father
        );

    return {

        // 后代属性
        iv: ivResult.iv,

        personality:
            personalityResult.personality,

        weightGene:
            weightResult.weightGene,

        sex: generateSex(),

        pedigree: inheritPedigree(
            mother,
            father
        ),

        // 遗传计算记录
        inheritance: {

            iv: {

                inheritedKeys:
                    ivResult.inheritedKeys,

                sources:
                    ivResult.sources

            },

            personality: {

                source:
                    personalityResult.source

            },

            weight: {

                parentalAverage:
                    weightResult.parentalAverage,

                offset:
                    weightResult.offset,

                rawValue:
                    weightResult.rawValue

            }

        }

    };

}