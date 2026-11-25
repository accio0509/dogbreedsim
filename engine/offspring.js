import {
    generateOffspringAppearance
} from "./mutation.js";

import {
    inheritAttributes
} from "./inheritance.js";

import {
    createAnimal
} from "./animal.js";

import {
    getRandomDogName
} from "../data/species/dog/names.js";

import {
    calculateInbreedingCoefficient,
    applyInbreedingPenalty
} from "./kinship.js";


// ==================================================
// 1. 基础亲本校验
// ==================================================

function validateParents(
    mother,
    father,
    offspringId
) {

    if (!mother || !father) {

        throw new Error(
            "缺少亲本数据。"
        );

    }

    if (

        mother.sex !== "female" ||

        father.sex !== "male"

    ) {

        throw new Error(
            "必须提供一只母犬和一只公犬。"
        );

    }

    if (

        mother.species !== "dog" ||

        father.species !== "dog"

    ) {

        throw new Error(
            "当前只支持犬只之间的遗传计算。"
        );

    }

    if (

        typeof offspringId !== "string" ||

        !offspringId.trim()

    ) {

        throw new Error(
            "后代必须具有唯一编号。"
        );

    }

    if (

        mother.id === father.id ||

        offspringId === mother.id ||

        offspringId === father.id

    ) {

        throw new Error(
            "亲本或后代编号冲突。"
        );

    }

    return true;

}


// ==================================================
// 2. 检查后代编号是否已存在
// ==================================================

function hasPedigreeId(
    records,
    id
) {

    if (records instanceof Map) {

        return records.has(id);

    }

    if (Array.isArray(records)) {

        return records.some(
            record => record.id === id
        );

    }

    return Object.hasOwn(
        records,
        id
    );

}


// ==================================================
// 3. 生成完整后代遗传数据
// ==================================================

// 此函数只负责遗传数据计算。
// 不修改亲本，不消耗繁育次数，
// 不检查设施，不执行冷却。

export function generateOffspringData(
    mother,
    father,
    offspringId,
    pedigreeRecords = {}, inheritedCount
) {

    validateParents(

        mother,

        father,

        offspringId

    );

    if (

        hasPedigreeId(

            pedigreeRecords,

            offspringId

        )

    ) {

        throw new Error(
            "后代编号已存在于血统档案。"
        );

    }


    // ----------------------------------------------
    // 完整家谱近交系数
    // ----------------------------------------------

    const coefficient =
        calculateInbreedingCoefficient(

            mother,

            father,

            pedigreeRecords

        );


    // ----------------------------------------------
    // 外貌遗传及新突变
    // ----------------------------------------------

    const appearance =
        generateOffspringAppearance(

            mother,

            father,

            offspringId

        );


    // ----------------------------------------------
    // 个体属性遗传
    // ----------------------------------------------

    const attributes =
        inheritAttributes(

            mother,

            father, inheritedCount

        );


    // ----------------------------------------------
    // 近交个体值惩罚
    // ----------------------------------------------

    const inbreeding =
        applyInbreedingPenalty(

            attributes.iv,

            coefficient

        );


    // ----------------------------------------------
    // 完整后代数据
    // ----------------------------------------------

    return {

        id: offspringId,

        breedId: mother.breedId,

        source: "breeding",

        name: getRandomDogName(),

        sex: attributes.sex,

        genotype:
            appearance.genotype,

        personality:
            attributes.personality,

        weightGene:
            attributes.weightGene,

        // 使用惩罚后的最终IV
        iv: inbreeding.iv,

        // 血统数据
        pedigree: {

            ...attributes.pedigree,

            inbreedingCoefficient:
                coefficient

        },

        // 遗传计算记录
        inheritance: {

            ...attributes.inheritance,

            inbreeding: {

                coefficient,

                penalty:
                    inbreeding.penalty,

                originalIV:
                    inbreeding.originalIV,

                losses:
                    inbreeding.losses,

                totalLoss:
                    inbreeding.totalLoss

            }

        },

        // 新突变记录
        mutationInfo: {

            rate:
                appearance.mutationRate,

            triggered:
                appearance.mutationTriggered,

            occurred:
                appearance.newMutationOccurred,

            newMutation:
                appearance.newMutation,

            reason:
                appearance.mutationReason

        }

    };

}


// ==================================================
// 4. 根据已有遗传数据创建幼犬
// ==================================================

// 孵化时不会重新计算任何遗传属性，
// 也不会再次执行近交惩罚。

export function createOffspringFromData(
    data,
    location = "nursery"
) {

    if (

        !data ||

        data.source !== "breeding"

    ) {

        throw new Error(
            "缺少有效的繁育后代数据。"
        );

    }

    const requiredFields = [

        "id",

        "breedId",

        "name",

        "sex",

        "genotype",

        "personality",

        "weightGene",

        "iv",

        "pedigree",

        "inheritance",

        "mutationInfo"

    ];

    for (const field of requiredFields) {

        if (

            data[field] === undefined ||

            data[field] === null

        ) {

            throw new Error(
                `后代遗传数据缺少 ${field}。`
            );

        }

    }

    if (

        !data.pedigree.motherId ||

        !data.pedigree.fatherId ||

        !Number.isInteger(
            data.pedigree.generation
        ) ||

        data.pedigree.generation < 2

    ) {

        throw new Error(
            "后代血统数据不完整。"
        );

    }

    if (

        !["female", "male"].includes(data.sex)

    ) {

        throw new Error(
            "后代性别数据无效。"
        );

    }


    // 检查已保存的近交数据
    // 只校验，不再次扣除个体值

    if (data.inheritance.inbreeding) {

        const record =
            data.inheritance.inbreeding;

        if (

            record.coefficient !==

            data.pedigree.inbreedingCoefficient

        ) {

            throw new Error(
                "近交系数记录不一致。"
            );

        }

        const expected =
            applyInbreedingPenalty(

                record.originalIV,

                record.coefficient

            );

        for (
            const key of
            Object.keys(expected.iv)
        ) {

            if (

                expected.iv[key] !==
                    data.iv[key]

            ) {

                throw new Error(
                    "已保存的个体值与近交记录不一致。"
                );

            }

        }

    }


    // 创建已经确定遗传属性的幼犬

    return createAnimal({

        ...data,

        stage: "puppy",

        location,

        source: "breeding"

    });

}