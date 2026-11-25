import { GAME_CONFIG } from "../config/game.js";

import {
    getBreed
} from "../data/species/dog/breeds.js";

import {
    getPersonality
} from "../data/species/dog/personalities.js";


export const STAT_KEYS = [
    "STR",
    "SPD",
    "STA",
    "AGI",
    "INT",
    "PER"
];

export const STAT_NAMES = {
    STR: "力量",
    SPD: "速度",
    STA: "耐力",
    AGI: "敏捷",
    INT: "智力",
    PER: "感知"
};


// 随机生成个体值
export function generateIV() {
    const iv = {};

    for (const key of STAT_KEYS) {
        iv[key] = Math.floor(
            Math.random() *
            (GAME_CONFIG.stats.ivMax + 1)
        );
    }

    return iv;
}


// 创建初始努力值
export function generateEV() {
    const ev = {};

    for (const key of STAT_KEYS) {
        ev[key] = 0;
    }

    return ev;
}


// 计算实际能力
export function calculateStats(animal) {
    const breed = getBreed(animal.breedId);

    const personality = getPersonality(
        animal.personality
    );

    const stageMultiplier =
        GAME_CONFIG.growth.stageMultiplier[
            animal.stage
        ] ?? 0;

    const result = {};

    for (const key of STAT_KEYS) {
        const base = breed.baseStats[key];

        const iv = animal.iv[key];

        const ev = animal.ev[key];

        const personalityMultiplier =
            personality.stats?.[key] ?? 1;

        result[key] = Math.round(
            (
                base +
                iv * GAME_CONFIG.stats.ivMultiplier +
                ev * GAME_CONFIG.stats.evMultiplier
            ) *
            stageMultiplier *
            personalityMultiplier
        );
    }

    return result;
}


// 计算能力总和
export function calculateTotal(stats) {
    return Object.values(stats).reduce(
        (sum, value) => sum + value,
        0
    );
}