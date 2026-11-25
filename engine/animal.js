import {
    GAME_CONFIG
} from "../config/game.js";

import {
    getCurrentTime
} from "./time.js";

import {
    getBreed
} from "../data/species/dog/breeds.js";

import {
    getPersonality,
    getRandomPersonality
} from "../data/species/dog/personalities.js";

import {
    generateIV,
    generateEV
} from "./stats.js";

import {
    generateGenotype,
    calculatePhenotype,
    validateGenotype
} from "./genetics.js";

import {
    validateIV,
    validateWeightGene,
    generateSex
} from "./inheritance.js";


// ==================================================
// 1. 基础枚举
// ==================================================


export const LIFE_STAGES = {

    egg: "狗狗蛋",

    puppy: "幼犬",

    juvenile: "青年犬",

    adult: "成年犬"

};


export const LOCATIONS = {

    nursery: "饲育屋",

    computer: "电脑盒子",

    breeding: "繁育室",
    incubation: "孵化室",

    pending: "等待安置",

    retired: "已退役"

};


export const ANIMAL_SOURCES = {

    starter: "初始赠送",

    market: "市场购买",
    rental: "租借配种",

    breeding: "自主繁育",

    exploration: "地图探索",

    competition: "比赛奖励"

};


// ==================================================
// 2. 通用工具
// ==================================================


export function randomInt(min, max) {

    return Math.floor(

        Math.random() * (max - min + 1)

    ) + min;

}


export function formatAnimalId(number) {

    return "DOG" +

        String(number).padStart(5, "0");

}


// ==================================================
// 3. 体重计算
// ==================================================


export function calculateAdultWeight(animal) {

    const breed = getBreed(
        animal.breedId
    );

    const min = breed.weightRange.min;

    const max = breed.weightRange.max;

    return min +

        (max - min) *

        animal.weightGene / 100;

}


export function calculateCurrentWeight(animal) {

    const adultWeight =
        calculateAdultWeight(animal);

    const multiplier =
        GAME_CONFIG.growth
            .weightMultiplier[animal.stage] ?? 0;

    return Number(

        (adultWeight * multiplier)
            .toFixed(2)

    );

}


// ==================================================
// 4. 创建犬只
// ==================================================


export function createAnimal(options) {

    const {

        id,

        breedId,

        name = null,

        sex = null,

        stage = "puppy",

        location = "nursery",

        source = "starter",

        // 可传入已经确定的遗传属性
        genotype = null,

        iv = null,

        personality = null,

        weightGene = null,

        pedigree = null,

        inheritance = null,

        mutationInfo = null

    } = options;


    // ------------------------------
    // 基础校验
    // ------------------------------

    const breed = getBreed(breedId);

    if (!breed) {

        throw new Error(
            `未知犬种：${breedId}`
        );

    }

    if (
        typeof id !== "string" ||
        !id.trim()
    ) {

        throw new Error(
            "创建犬只必须提供唯一编号。"
        );

    }

    if (

        !["puppy", "juvenile", "adult"]
            .includes(stage)

    ) {

        throw new Error(
            `当前不支持直接创建 ${stage} 阶段犬只。`
        );

    }

    if (
        !Object.hasOwn(
            ANIMAL_SOURCES,
            source
        )
    ) {

        throw new Error(
            `未知犬只来源：${source}`
        );

    }

    if (
        sex !== null &&
        !["female", "male"].includes(sex)
    ) {

        throw new Error(
            `无效犬只性别：${sex}`
        );

    }


    // ------------------------------
    // 外貌基因
    // ------------------------------

    const finalGenotype =

        genotype !== null

            ? structuredClone(genotype)

            : generateGenotype(
                breedId,
                source
            );

    validateGenotype(finalGenotype);


    // ------------------------------
    // 个体值
    // ------------------------------

    const finalIV =

        iv !== null

            ? structuredClone(iv)

            : generateIV();

    validateIV(finalIV);


    // ------------------------------
    // 性格
    // ------------------------------

    const finalPersonality =

        personality ??

        getRandomPersonality();

    if (!getPersonality(finalPersonality)) {

        throw new Error(
            `未知性格：${finalPersonality}`
        );

    }


    // ------------------------------
    // 体重遗传值
    // ------------------------------

    const finalWeightGene =

        weightGene ??

        randomInt(0, 100);

    validateWeightGene(
        finalWeightGene
    );


    // ------------------------------
    // 血统数据
    // ------------------------------

    const finalPedigree =

        pedigree !== null

            ? structuredClone(pedigree)

            : {

                motherId: null,

                fatherId: null,

                generation: 1

            };

    if (

        !Number.isInteger(
            finalPedigree.generation
        ) ||

        finalPedigree.generation < 1

    ) {

        throw new Error(
            "犬只世代数据无效。"
        );

    }

    const motherId =
        finalPedigree.motherId;

    const fatherId =
        finalPedigree.fatherId;

    if (

        motherId === id ||

        fatherId === id ||

        (
            motherId !== null &&
            motherId === fatherId
        )

    ) {

        throw new Error(
            "犬只血统编号存在冲突。"
        );

    }


    // ------------------------------
    // 初始成长经验
    // ------------------------------

    const initialExp = {

        puppy: 0,

        juvenile:
            GAME_CONFIG.growth.juvenileExp,

        adult:
            GAME_CONFIG.growth.adultExp

    };

    const now = getCurrentTime();


    // ------------------------------
    // 完整犬只数据
    // ------------------------------

    return {

        id,

        name: name ?? breed.name,

        species: "dog",

        breedId,

        sex: sex ?? generateSex(),

        source,

        stage,

        location,

        retired: false,


        // 外貌基因
        genotype: finalGenotype,


        // 性格与体重
        personality: finalPersonality,

        weightGene: finalWeightGene,


        // 能力
        iv: finalIV,

        ev: generateEV(),

        exp: initialExp[stage],


        // 血统
        pedigree: finalPedigree,


        // 遗传计算记录
        inheritance:

            inheritance !== null

                ? structuredClone(inheritance)

                : null,


        // 本次新突变记录
        mutationInfo:

            mutationInfo !== null

                ? structuredClone(mutationInfo)

                : null,


        // 当前活动
        activity: null,


        // 时间记录
        timestamps: {

            createdAt: now,

            hatchedAt: now,

            lastGrowthAt: now,

            retiredAt: null

        }

    };

}


// ==================================================
// 5. 外貌表现型
// ==================================================


export function getAnimalPhenotype(animal) {

    return calculatePhenotype(
        animal.genotype
    );

}


// ==================================================
// 6. 状态判断
// ==================================================


export function isAdult(animal) {

    return animal.stage === "adult";

}


export function isBusy(animal) {

    return animal.activity !== null;

}


// 基础繁育资格
// 第四阶段将加入完整限制
export function canBreed(animal) {

    return (

        isAdult(animal) &&

        !animal.retired &&

        !isBusy(animal) &&

        (animal.source === "rental" ? animal.location === "breeding" : ["nursery", "computer"].includes(animal.location))

    );

}