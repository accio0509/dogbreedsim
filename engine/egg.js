
import {
    checkBreedingPair,
    recordSuccessfulBreeding
} from "./breeding.js";

import {
    generateOffspringData
} from "./offspring.js";

export const INCUBATION_HOURS = 24;

export const INCUBATION_MS =
    INCUBATION_HOURS * 60 * 60 * 1000;


// ==============================
// 1. 创建犬蛋数据
// ==============================

export function createEgg({
    eggId,
    offspringId,
    mother,
    father,
    pedigreeRecords = {},
    now = Date.now()
}) {

    if (!eggId || !offspringId) {
        throw new Error("犬蛋或后代ID不能为空");
    }

    const offspringData = generateOffspringData(
        mother,
        father,
        offspringId,
        pedigreeRecords
    );

    return {
        id: eggId,

        offspringId,

        species: "dog",

        breedId: offspringData.breedId,

        motherId: mother.id,
        fatherId: father.id,

        motherName: mother.name,
        fatherName: father.name,

        createdAt: now,

        hatchAt: now + INCUBATION_MS,

        offspringData: structuredClone(offspringData)
    };
}


// ==============================
// 2. 获取孵化剩余时间
// ==============================

export function getRemainingIncubation(
    egg,
    now = Date.now()
) {
    return Math.max(0, egg.hatchAt - now);
}


// ==============================
// 3. 获取孵化进度
// 返回0~100之间的数值
// ==============================

export function getIncubationProgress(
    egg,
    now = Date.now()
) {
    const duration = egg.hatchAt - egg.createdAt;

    if (duration <= 0) {
        return 100;
    }

    const elapsed = now - egg.createdAt;

    return Math.max(
        0,
        Math.min(100, elapsed / duration * 100)
    );
}


// ==============================
// 4. 判断是否可以孵化
// ==============================

export function isEggReady(
    egg,
    now = Date.now()
) {
    return now >= egg.hatchAt;
}


// ==============================
// 5. 获取犬蛋状态
// ==============================

export function getEggStatus(
    egg,
    now = Date.now()
) {
    return isEggReady(egg, now)
        ? "ready"
        : "incubating";
}


// ==============================
// 6. 正式执行繁育
// ==============================

export function startBreeding({
    mother,
    father,
    eggId,
    offspringId,
    eggs,
    pedigreeRecords = {},
    now = Date.now()
}) {

    if (!mother || !father) {
        return {
            success: false,
            message: "请选择完整的父母本"
        };
    }

    if (!Array.isArray(eggs)) {
        return {
            success: false,
            message: "犬蛋列表不存在"
        };
    }

    if (!eggId || !offspringId) {
        return {
            success: false,
            message: "缺少犬蛋或后代ID"
        };
    }

    if (eggs.some(egg => egg.id === eggId)) {
        return {
            success: false,
            message: "犬蛋ID已存在"
        };
    }

    if (
        eggs.some(
            egg => egg.offspringId === offspringId
        ) ||
        Object.hasOwn(pedigreeRecords, offspringId) ||
        offspringId === mother.id ||
        offspringId === father.id
    ) {
        return {
            success: false,
            message: "后代ID已存在"
        };
    }

    // 检查双亲资格

    const eligibility = checkBreedingPair(
        mother,
        father,
        pedigreeRecords,
        now
    );

    if (!eligibility.success) {
        return {
            success: false,
            message: "不满足繁育条件",
            eligibility
        };
    }

    // 先生成犬蛋
    // 若生成失败，不扣除繁育次数

    let egg;

    try {
        egg = createEgg({
            eggId,
            offspringId,
            mother,
            father,
            pedigreeRecords,
            now
        });

    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }

    // 更新双亲繁育状态

    const record = recordSuccessfulBreeding(
        mother,
        father,
        pedigreeRecords,
        now
    );

    if (!record.success) {
        return {
            success: false,
            message: record.message
        };
    }

    // 将犬蛋加入孵化列表

    eggs.push(egg);

    return {
        success: true,
        message: "繁育成功，获得一枚犬蛋",
        egg,
        record
    };
}
