import { GAME_CONFIG } from "../config/game.js";

import { STAT_KEYS } from "./stats.js";

import { validateIV } from "./inheritance.js";


// ==================================================
// 1. 整理血统档案
// ==================================================

export function buildPedigreeMap(
    records = {},
    animals = []
) {

    const map = new Map();

    let entries;

    if (records instanceof Map) {

        entries = records.entries();

    } else if (Array.isArray(records)) {

        entries = records.map(
            record => [record.id, record]
        );

    } else {

        entries = Object.entries(records);

    }

    for (const [id, record] of entries) {

        if (!record || record.id !== id) {

            throw new Error(
                `血统档案编号不一致：${id}`
            );

        }

        map.set(id, record);

    }

    // 加入当前参与计算的现役犬只
    for (const animal of animals) {

        if (!animal || !animal.id) {

            throw new Error(
                "缺少有效的犬只编号。"
            );

        }

        map.set(animal.id, animal);

    }

    return map;

}


// ==================================================
// 2. 获取父母编号
// ==================================================

function getParentIds(record) {

    if (!record.pedigree) {

        throw new Error(
            `犬只 ${record.id} 缺少血统数据。`
        );

    }

    const {
        motherId,
        fatherId
    } = record.pedigree;

    for (const id of [motherId, fatherId]) {

        if (

            id !== null &&

            (
                typeof id !== "string" ||
                !id.trim()
            )

        ) {

            throw new Error(
                `犬只 ${record.id} 的父母编号无效。`
            );

        }

    }

    if (

        motherId === record.id ||

        fatherId === record.id ||

        (
            motherId !== null &&
            motherId === fatherId
        )

    ) {

        throw new Error(
            `犬只 ${record.id} 的血统存在冲突。`
        );

    }

    return [motherId, fatherId];

}


// ==================================================
// 3. 创建亲缘计算器
// ==================================================

export function createKinshipCalculator(
    records = {},
    animals = []
) {

    const map = buildPedigreeMap(
        records,
        animals
    );

    // 当前计算中的祖先
    const visiting = new Set();

    // 已完成血统检查的犬只
    const visited = new Set();

    // 拓扑顺序：祖先一定排在后代之前
    const order = new Map();

    // 亲缘系数缓存
    const cache = new Map();


    // ----------------------------------------------
    // 检查完整家谱
    // ----------------------------------------------

    function visit(id) {

        // null表示未知创始亲本
        if (id === null) {
            return;
        }

        if (visited.has(id)) {
            return;
        }

        if (visiting.has(id)) {

            throw new Error(
                `家谱出现循环关系：${id}`
            );

        }

        const record = map.get(id);

        if (!record) {

            throw new Error(
                `缺少祖先血统档案：${id}`
            );

        }

        visiting.add(id);

        const [motherId, fatherId] =
            getParentIds(record);

        visit(motherId);

        visit(fatherId);

        visiting.delete(id);

        visited.add(id);

        order.set(
            id,
            order.size
        );

    }


    // ----------------------------------------------
    // 计算亲缘系数
    // ----------------------------------------------

    function calculate(idA, idB) {

        if (idA === null || idB === null) {
            return 0;
        }

        // 后代始终作为第一个个体
        if (order.get(idA) < order.get(idB)) {

            [idA, idB] = [idB, idA];

        }

        const key = JSON.stringify(
            [idA, idB]
        );

        if (cache.has(key)) {

            return cache.get(key);

        }

        const record = map.get(idA);

        const [motherId, fatherId] =
            getParentIds(record);

        let result;

        // 个体与自身的亲缘系数
        if (idA === idB) {

            const inbreeding =
                calculate(
                    motherId,
                    fatherId
                );

            result = (1 + inbreeding) / 2;

        } else {

            // 不同个体的亲缘系数
            result = (

                calculate(motherId, idB) +

                calculate(fatherId, idB)

            ) / 2;

        }

        cache.set(
            key,
            result
        );

        return result;

    }


    // ----------------------------------------------
    // 对外接口
    // ----------------------------------------------

    return {

        getKinship(idA, idB) {

            visit(idA);

            visit(idB);

            return calculate(
                idA,
                idB
            );

        },

        getInbreeding(id) {

            visit(id);

            const [motherId, fatherId] =
                getParentIds(map.get(id));

            return calculate(
                motherId,
                fatherId
            );

        },

        getOffspringInbreeding(
            motherId,
            fatherId
        ) {

            visit(motherId);

            visit(fatherId);

            return calculate(
                motherId,
                fatherId
            );

        }

    };

}


// ==================================================
// 4. 计算后代近交系数
// ==================================================

export function calculateInbreedingCoefficient(
    mother,
    father,
    pedigreeRecords = {}
) {

    if (!mother || !father) {

        throw new Error(
            "计算近交系数必须提供两个亲本。"
        );

    }

    if (

        !mother.id ||

        !father.id ||

        mother.id === father.id

    ) {

        throw new Error(
            "亲本编号无效。"
        );

    }

    const calculator =
        createKinshipCalculator(

            pedigreeRecords,

            [mother, father]

        );

    return calculator.getOffspringInbreeding(

        mother.id,

        father.id

    );

}


// ==================================================
// 5. 获取近交惩罚比例
// ==================================================

export function getInbreedingPenalty(
    coefficient
) {

    if (

        !Number.isFinite(coefficient) ||

        coefficient < 0 ||

        coefficient > 1

    ) {

        throw new Error(
            "近交系数必须介于0和1之间。"
        );

    }

    const rule = GAME_CONFIG.breeding

        .inbreedingPenalties

        .find(item =>

            coefficient <= item.maxF

        );

    if (!rule) {

        throw new Error(
            "缺少对应的近交惩罚规则。"
        );

    }

    return rule.penalty;

}


// ==================================================
// 6. 应用个体值惩罚
// ==================================================

export function applyInbreedingPenalty(
    iv,
    coefficient
) {

    validateIV(iv);

    const penalty =
        getInbreedingPenalty(
            coefficient
        );

    const originalIV = {
        ...iv
    };

    const adjustedIV = {};

    const losses = {};

    let totalLoss = 0;

    for (const key of STAT_KEYS) {

        // 每项个体值分别向下取整
        const value = Math.floor(

            iv[key] * (1 - penalty)

        );

        adjustedIV[key] = value;

        losses[key] =

            iv[key] - value;

        totalLoss += losses[key];

    }

    validateIV(adjustedIV);

    return {

        coefficient,

        penalty,

        originalIV,

        iv: adjustedIV,

        losses,

        totalLoss

    };

}


// ==================================================
// 7. 近交系数格式化
// ==================================================

export function formatInbreedingCoefficient(
    coefficient
) {

    getInbreedingPenalty(coefficient);

    return (

        coefficient * 100

    ).toFixed(2) + "%";

}