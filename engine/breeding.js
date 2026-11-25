import { GAME_CONFIG } from "../config/game.js";

import {
    getBreed,
    SIZE_CLASSES
} from "../data/species/dog/breeds.js";

import {
    getCurrentTime,
    TIME
} from "./time.js";

import {
    calculateInbreedingCoefficient,
    getInbreedingPenalty
} from "./kinship.js";


// ==================================================
// 1. 读取繁育记录
// ==================================================

export function getBreedingHistory(animal) {

    if (!animal) {

        throw new Error(
            "缺少犬只数据。"
        );

    }

    // 兼容旧版本犬只
    const history = animal.breeding ?? {

        count: 0,

        lastSuccessAt: null

    };

    if (

        !Number.isInteger(history.count) ||

        history.count < 0

    ) {

        throw new Error(
            "繁育次数记录无效。"
        );

    }

    if (

        history.lastSuccessAt !== null &&

        (
            !Number.isFinite(history.lastSuccessAt) ||

            history.lastSuccessAt < 0
        )

    ) {

        throw new Error(
            "上次繁育时间无效。"
        );

    }

    if (

        (history.count === 0) !==

        (history.lastSuccessAt === null)

    ) {

        throw new Error(
            "繁育次数与时间记录不一致。"
        );

    }

    return {

        count: history.count,

        lastSuccessAt:
            history.lastSuccessAt

    };

}


// ==================================================
// 2. 获取剩余繁育次数
// ==================================================

export function getRemainingBreedings(animal) {

    const history =
        getBreedingHistory(animal);

    return Math.max(

        0,

        GAME_CONFIG.breeding
            .lifetimeMaxBreedings -

        history.count

    );

}


// ==================================================
// 3. 获取冷却结束时间
// ==================================================

export function getCooldownEnd(animal) {

    const history =
        getBreedingHistory(animal);

    if (history.lastSuccessAt === null) {

        return null;

    }

    return (

        history.lastSuccessAt +

        GAME_CONFIG.breeding.cooldownHours *

        TIME.HOUR - Math.min(GAME_CONFIG.breeding.cooldownHours * TIME.HOUR, Math.max(0, Number.isFinite(animal.breeding?.cooldownReductionMs) ? animal.breeding.cooldownReductionMs : 0))

    );

}


// ==================================================
// 4. 获取剩余冷却时间
// ==================================================

export function getRemainingCooldown(
    animal,
    now = getCurrentTime()
) {

    if (!Number.isFinite(now) || now < 0) {

        throw new Error(
            "当前时间无效。"
        );

    }

    const end = getCooldownEnd(animal);

    if (end === null) {
        return 0;
    }

    return Math.max(

        0,

        end - now

    );

}


// ==================================================
// 5. 单只犬的繁育资格
// ==================================================

export function checkIndividualBreeding(
    animal,
    now = getCurrentTime()
) {

    if (!animal) {

        return {

            success: false,

            reasons: [
                "犬只不存在。"
            ],

            remainingBreedings: 0,

            cooldownRemaining: 0

        };

    }

    const reasons = [];

    if (animal.species !== "dog") {

        reasons.push(
            "当前仅支持犬只繁育。"
        );

    }

    if (animal.stage !== "adult") {

        reasons.push(
            "只有成年犬才能繁育。"
        );

    }

    if (animal.retired) {

        reasons.push(
            "退役犬只不能繁育。"
        );

    }

    if (animal.activity != null) {

        reasons.push(
            "犬只正在执行其他活动。"
        );

    }

    if (

        !(animal.source==='rental' ? animal.location==='breeding' : ["nursery", "computer"].includes(animal.location))

    ) {

        reasons.push(
            "犬只当前位置不能参与繁育。"
        );

    }

    const remainingBreedings =
        getRemainingBreedings(animal);

    if (remainingBreedings === 0) {

        reasons.push(
            "已达到终生繁育次数上限。"
        );

    }

    const cooldownRemaining =
        getRemainingCooldown(
            animal,
            now
        );

    if (cooldownRemaining > 0) {

        reasons.push(
            "繁育冷却尚未结束。"
        );

    }

    return {

        success: reasons.length === 0,

        reasons,

        remainingBreedings,

        cooldownRemaining,

        cooldownEnd:
            getCooldownEnd(animal)

    };

}


// ==================================================
// 6. 检查亲本体型
// ==================================================

export function checkSizeCompatibility(
    mother,
    father
) {

    const motherBreed =
        getBreed(mother.breedId);

    const fatherBreed =
        getBreed(father.breedId);

    if (!motherBreed || !fatherBreed) {

        throw new Error(
            "无法识别亲本犬种。"
        );

    }

    const motherSize =
        SIZE_CLASSES[motherBreed.size];

    const fatherSize =
        SIZE_CLASSES[fatherBreed.size];

    if (!motherSize || !fatherSize) {

        throw new Error(
            "犬种体型配置错误。"
        );

    }

    const success =

        fatherSize.rank <=
        motherSize.rank;

    return {

        success,

        motherSize: motherSize.name,

        fatherSize: fatherSize.name,

        sizeDifference:

            Math.abs(
                motherSize.rank -
                fatherSize.rank
            ),

        message: success

            ? "亲本体型符合繁育要求。"

            : "公犬体型不能大于母犬。"

    };

}


// ==================================================
// 7. 检查完整配对资格
// ==================================================

export function checkBreedingPair(
    mother,
    father,
    pedigreeRecords = {},
    now = getCurrentTime()
) {

    const reasons = [];

    const warnings = [];

    const motherStatus =
        checkIndividualBreeding(
            mother,
            now
        );

    const fatherStatus =
        checkIndividualBreeding(
            father,
            now
        );

    for (const reason of motherStatus.reasons) {

        reasons.push(
            `母犬：${reason}`
        );

    }

    for (const reason of fatherStatus.reasons) {

        reasons.push(
            `公犬：${reason}`
        );

    }

    let size = null;

    let coefficient = null;

    let penalty = null;

    if (mother && father) {
        if(mother.source==='rental'&&father.source==='rental') reasons.push('至少一方必须为自有犬只。');

        if (mother.id === father.id) {

            reasons.push(
                "不能选择同一只犬作为两个亲本。"
            );

        }

        if (

            mother.sex !== "female" ||

            father.sex !== "male"

        ) {

            reasons.push(
                "必须选择一只母犬和一只公犬。"
            );

        }

        if (

            mother.species === "dog" &&

            father.species === "dog"

        ) {

            size = checkSizeCompatibility(

                mother,

                father

            );

            if (!size.success) {

                reasons.push(
                    size.message
                );

            }

        }

        if (

            mother.id !== father.id &&

            mother.species === "dog" &&

            father.species === "dog"

        ) {

            try {

                coefficient =
                    calculateInbreedingCoefficient(

                        mother,

                        father,

                        pedigreeRecords

                    );

                penalty =
                    getInbreedingPenalty(
                        coefficient
                    );

                if (coefficient > 0) {

                    warnings.push(

                        "亲本具有共同血统，后代近交系数为" +

                        (coefficient * 100).toFixed(2) +

                        "%。"

                    );

                }

                if (penalty > 0) {

                    warnings.push(

                        "后代个体值将受到" +

                        (penalty * 100).toFixed(0) +

                        "%的近交惩罚，并逐项向下取整。"

                    );

                }

            } catch (error) {

                reasons.push(

                    "无法计算完整家谱：" +

                    error.message

                );

            }

        }

    }

    return {

        success: reasons.length === 0,

        reasons,

        warnings,

        motherStatus,

        fatherStatus,

        size,

        inbreedingCoefficient:
            coefficient,

        inbreedingPenalty:
            penalty

    };

}


// ==================================================
// 8. 记录成功产蛋
// ==================================================

// 仅用于当前阶段的独立引擎测试。
// 正式繁育任务中的活动状态与产蛋事务
// 将在V0.4.0中统一管理。

export function recordSuccessfulBreeding(
    mother,
    father,
    pedigreeRecords = {},
    now = getCurrentTime()
) {

    const eligibility =
        checkBreedingPair(

            mother,

            father,

            pedigreeRecords,

            now

        );

    if (!eligibility.success) {

        return {

            success: false,

            message:
                eligibility.reasons.join("\n"),

            eligibility

        };

    }

    // 先读取双方记录，再统一修改
    const motherHistory =
        getBreedingHistory(mother);

    const fatherHistory =
        getBreedingHistory(father);

    const newMotherHistory = {

        count: motherHistory.count + 1,

        lastSuccessAt: now

    };

    const newFatherHistory = {

        count: fatherHistory.count + 1,

        lastSuccessAt: now

    };

    mother.breeding = newMotherHistory;

    father.breeding = newFatherHistory;

    return {

        success: true,

        message: "成功记录一次产蛋。",

        motherHistory: {
            ...newMotherHistory
        },

        fatherHistory: {
            ...newFatherHistory
        },

        cooldownEnd:

            now +

            GAME_CONFIG.breeding.cooldownHours *

            TIME.HOUR

    };

}


// ==================================================
// 9. 冷却时间显示
// ==================================================

export function formatCooldown(milliseconds) {

    if (

        !Number.isFinite(milliseconds) ||

        milliseconds < 0

    ) {

        throw new Error(
            "冷却时间无效。"
        );

    }

    if (milliseconds === 0) {

        return "可繁育";

    }

    const totalSeconds =
        Math.ceil(
            milliseconds / 1000
        );

    const hours =
        Math.floor(
            totalSeconds / 3600
        );

    const minutes =
        Math.floor(
            (totalSeconds % 3600) / 60
        );

    const seconds =
        totalSeconds % 60;

    return (

        String(hours).padStart(2, "0") +

        ":" +

        String(minutes).padStart(2, "0") +

        ":" +

        String(seconds).padStart(2, "0")

    );

}