import {
    GAME_CONFIG
} from "../config/game.js";

import {
    getBreed,
    getBreedAppearance,
    SIZE_CLASSES
} from "../data/species/dog/breeds.js";

import {
    getGene,
    getMutationAlleles,
    isMutationOnlyGene
} from "../data/species/dog/appearance.js";

import {
    randomChoice,
    createAllele,
    cloneAllele,
    validateGenotype,
    inheritGenotype,
    calculatePhenotype,
    hasMutation,
    hasVisibleMutation,
    getMutationRecords
} from "./genetics.js";


// ==================================================
// 1. 计算父母体型差
// ==================================================

export function getBreedSizeDifference(
    motherBreedId,
    fatherBreedId
) {

    const motherBreed = getBreed(
        motherBreedId
    );

    const fatherBreed = getBreed(
        fatherBreedId
    );

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
            "犬种体型分类错误。"
        );

    }

    return Math.abs(

        motherSize.rank -
        fatherSize.rank

    );

}


// ==================================================
// 2. 计算突变概率
// ==================================================

export function getMutationRate(
    mother,
    father
) {

    if (!mother || !father) {

        throw new Error(
            "计算突变概率必须提供两个亲本。"
        );

    }

    const sizeDifference =
        getBreedSizeDifference(
            mother.breedId,
            father.breedId
        );

    // 相同犬种
    if (mother.breedId === father.breedId) {

        return GAME_CONFIG.breeding
            .sameBreed.mutationRate;

    }

    // 不同犬种，根据体型差计算
    const rule = GAME_CONFIG.breeding

        .differentBreed[sizeDifference];

    if (!rule) {

        throw new Error(
            "没有对应的跨犬种突变规则。"
        );

    }

    return rule.mutationRate;

}


// ==================================================
// 3. 获取指定犬种的突变候选基因
// ==================================================

export function getMutationCandidates(
    breedId,
    locus
) {

    if (

        !GAME_CONFIG.genetics.mutableLoci
            .includes(locus)

    ) {

        return [];

    }

    const pools = getBreedAppearance(
        breedId
    );

    if (!pools) {

        throw new Error(
            `犬种 ${breedId} 缺少基因池。`
        );

    }

    const pool = pools[locus];

    if (!pool) {

        throw new Error(
            `缺少 ${locus} 位点基因池。`
        );

    }

    // 犬种未单独配置时使用全局突变池
    const candidates =

        pool.mutation ??

        getMutationAlleles(locus);

    return [...new Set(candidates)]

        .filter(id =>

            getGene(locus, id) && ![...(pool.normal ?? []), ...(pool.rare ?? [])].includes(id)

        );

}


// ==================================================
// 4. 获取所有可突变位点
// ==================================================

export function getEligibleMutationLoci(
    breedId
) {

    return GAME_CONFIG.genetics.mutableLoci

        .filter(locus =>

            getMutationCandidates(
                breedId,
                locus
            ).length > 0

        );

}


// ==================================================
// 5. 无突变结果
// ==================================================

function createNoMutationResult(
    genotype,
    rate,
    triggered = false,
    reason = "not_triggered"
) {

    return {

        genotype,

        mutationRate: rate,

        // 概率判定是否触发
        triggered,

        // 是否真正产生新基因变化
        occurred: false,

        mutation: null,

        reason

    };

}


// ==================================================
// 6. 执行一次突变
// ==================================================

export function applyMutation(
    genotype,
    breedId,
    offspringId,
    mutationRate
) {

    validateGenotype(genotype);

    if (

        typeof offspringId !== "string" ||

        !offspringId.trim()

    ) {

        throw new Error(
            "产生突变必须提供后代唯一编号。"
        );

    }

    if (

        !Number.isFinite(mutationRate) ||

        mutationRate < 0 ||

        mutationRate > 1

    ) {

        throw new Error(
            "突变概率必须介于0和1之间。"
        );

    }

    // 复制基因型，绝不修改原始遗传结果
    const result = structuredClone(
        genotype
    );

    if (

        GAME_CONFIG.genetics.mutationMaxPerEgg
            !== 1

    ) {

        throw new Error(
            "当前引擎仅支持每个蛋最多一次新突变。"
        );

    }

    // 突变概率判定
    if (Math.random() >= mutationRate) {

        return createNoMutationResult(

            result,

            mutationRate

        );

    }

    const loci = getEligibleMutationLoci(
        breedId
    );

    if (loci.length === 0) {

        return createNoMutationResult(

            result,

            mutationRate,

            true,

            "no_eligible_locus"

        );

    }

    // 三个允许位点等概率选择
    const locus = randomChoice(loci);

    // 母系、父系等概率选择
    const alleleIndex = randomChoice(
        [0, 1]
    );

    const oldAllele = cloneAllele(

        result[locus][alleleIndex]

    );

    // 获取突变颜色
    const candidates = getMutationCandidates(

        breedId,

        locus

    );

    const newAlleleId = randomChoice(
        candidates
    );

    // 已经是相同的突变色时，不虚构新突变来源
    if (

        oldAllele.allele === newAlleleId &&

        oldAllele.mutated

    ) {

        return createNoMutationResult(

            result,

            mutationRate,

            true,

            "same_allele"

        );

    }

    // 创建新突变基因
    const newAllele = createAllele(

        newAlleleId,

        true,

        offspringId

    );

    // 替换单个等位基因
    result[locus][alleleIndex] =
        newAllele;

    validateGenotype(result);

    return {

        genotype: result,

        mutationRate,

        triggered: true,

        occurred: true,

        mutation: {

            locus,

            alleleIndex,

            inheritedFrom:

                alleleIndex === 0

                    ? "mother"

                    : "father",

            before: oldAllele,

            after: cloneAllele(
                newAllele
            ),

            mutationOrigin: offspringId,

            replacedExistingMutation:
                oldAllele.mutated

        },

        reason: "new_mutation"

    };

}


// ==================================================
// 7. 完整后代外貌生成
// ==================================================

export function generateOffspringAppearance(
    mother,
    father,
    offspringId
) {

    // 后代犬种由母亲决定
    const breedId = mother.breedId;

    // 第一步：正常孟德尔遗传
    const inheritedGenotype =
        inheritGenotype(
            mother,
            father
        );

    // 第二步：确定新突变概率
    const mutationRate = Math.min(1, getMutationRate(

        mother,

        father

    ) * (mother.mutationPollen || father.mutationPollen ? 2 : 1));

    // 第三步：尝试产生一次新突变
    const mutationResult = applyMutation(

        inheritedGenotype,

        breedId,

        offspringId,

        mutationRate

    );

    // 第四步：计算最终表现型
    const genotype =
        mutationResult.genotype;

    const phenotype =
        calculatePhenotype(genotype);

    return {

        offspringId,

        breedId,

        genotype,

        phenotype,

        // 遗传前后对照
        inheritedGenotype,

        // 本次新突变信息
        mutationRate,

        mutationTriggered:
            mutationResult.triggered,

        newMutationOccurred:
            mutationResult.occurred,

        newMutation:
            mutationResult.mutation,

        mutationReason:
            mutationResult.reason,

        // 现存的所有突变信息
        carriesMutation:
            hasMutation(genotype),

        visibleMutation:
            hasVisibleMutation(phenotype),

        mutationRecords:
            getMutationRecords(genotype)

    };

}


// ==================================================
// 8. 突变记录中文描述
// ==================================================

export function describeMutation(mutation) {

    if (!mutation) {

        return "未产生新突变";

    }

    const locus = mutation.locus;

    const beforeGene = getGene(

        locus,

        mutation.before.allele

    );

    const afterGene = getGene(

        locus,

        mutation.after.allele

    );

    const parent =

        mutation.inheritedFrom === "mother"

            ? "母系"

            : "父系";

    return (

        `${parent}等位基因：` +

        `${beforeGene.name} → ${afterGene.name}`

    );

}