import {
    GAME_CONFIG
} from "../config/game.js";

import {
    getBreedAppearance
} from "../data/species/dog/breeds.js";

import {
    APPEARANCE_LOCI,
    getGene,
    isMutationOnlyGene
} from "../data/species/dog/appearance.js";


// ==================================================
// 1. 随机工具
// ==================================================

export function randomChoice(array) {

    if (!Array.isArray(array) || array.length === 0) {
        throw new Error("无法从空数组中随机抽取。");
    }

    return array[
        Math.floor(Math.random() * array.length)
    ];

}


export function weightedChoice(items) {

    if (!Array.isArray(items) || items.length === 0) {
        throw new Error("权重列表不能为空。");
    }

    for (const item of items) {

        if (
            !Number.isFinite(item.weight) ||
            item.weight < 0
        ) {
            throw new Error("存在无效随机权重。");
        }

    }

    const totalWeight = items.reduce(
        (sum, item) => sum + item.weight,
        0
    );

    if (totalWeight <= 0) {
        throw new Error("随机权重总和必须大于0。");
    }

    let random = Math.random() * totalWeight;

    for (const item of items) {

        random -= item.weight;

        if (random < 0) {
            return item.value;
        }

    }

    return items.filter(
        item => item.weight > 0
    ).at(-1).value;

}


// ==================================================
// 2. 等位基因数据
// ==================================================

export function createAllele(
    alleleId,
    mutated = false,
    mutationOrigin = null
) {

    return {
        allele: alleleId,
        mutated,
        mutationOrigin
    };

}


export function cloneAllele(allele) {

    return createAllele(
        allele.allele,
        allele.mutated ?? false,
        allele.mutationOrigin ?? null
    );

}


// ==================================================
// 3. 基因池工具
// ==================================================


// 判断是否为颜色位点
export function isColorLocus(locus) {

    return GAME_CONFIG.genetics.colorLoci
        .includes(locus);

}


// 判断是否允许突变
export function isMutableLocus(locus) {

    return GAME_CONFIG.genetics.mutableLoci
        .includes(locus);

}


// 过滤普通及稀有基因池
function filterRegularAlleles(ids, locus = null) {

    const unique = [...new Set(ids ?? [])];

    if (locus !== null) {

        return unique.filter(id =>

            getGene(locus, id) &&

            !isMutationOnlyGene(locus, id)

        );

    }

    // 兼容上一版本未传入 locus 的调用
    return unique.filter(id => {

        for (
            const currentLocus of
            Object.keys(APPEARANCE_LOCI)
        ) {

            if (getGene(currentLocus, id)) {

                return !isMutationOnlyGene(
                    currentLocus,
                    id
                );

            }

        }

        return false;

    });

}


export function getNormalAlleles(
    pool,
    locus = null
) {

    return filterRegularAlleles(
        pool.normal,
        locus
    );

}


export function getRareAlleles(
    pool,
    locus = null
) {

    const normal = getNormalAlleles(
        pool,
        locus
    );

    return filterRegularAlleles(
        pool.rare,
        locus
    ).filter(id => !normal.includes(id));

}


export function getAllowedAlleles(
    pool,
    locus = null
) {

    return [

        ...getNormalAlleles(pool, locus),

        ...getRareAlleles(pool, locus)

    ];

}


// ==================================================
// 4. 随机生成
// ==================================================

export function usesColorRarity(source, locus) {

    return (

        GAME_CONFIG.genetics.rareColorSources
            .includes(source) &&

        isColorLocus(locus)

    );

}


export function generateAllele(
    pool,
    locus = null,
    source = "starter"
) {

    const normal = getNormalAlleles(
        pool,
        locus
    );

    const rare = getRareAlleles(
        pool,
        locus
    );

    const allowed = [
        ...normal,
        ...rare
    ];

    if (allowed.length === 0) {

        throw new Error(
            `${locus ?? "未知"} 位点没有合法常规基因。`
        );

    }

    // 非市场、探索来源使用等概率抽取
    if (!usesColorRarity(source, locus)) {

        return createAllele(
            randomChoice(allowed)
        );

    }

    if (rare.length === 0) {

        return createAllele(
            randomChoice(normal)
        );

    }

    if (normal.length === 0) {

        return createAllele(
            randomChoice(rare)
        );

    }

    // 先抽普通或稀有类别
    const selectedPool = weightedChoice([

        {
            value: normal,
            weight:
                GAME_CONFIG.genetics.normalColorRate
        },

        {
            value: rare,
            weight:
                GAME_CONFIG.genetics.rareColorRate
        }

    ]);

    // 类别内部等概率
    return createAllele(
        randomChoice(selectedPool)
    );

}


export function generateGenotype(
    breedId,
    source = "starter"
) {

    if (source === "breeding") {

        throw new Error(
            "繁育犬只必须通过父母遗传生成基因型。"
        );

    }

    const pools = getBreedAppearance(breedId);

    if (!pools) {

        throw new Error(
            `犬种 ${breedId} 缺少基因池。`
        );

    }

    const genotype = {};

    for (
        const locus of
        Object.keys(APPEARANCE_LOCI)
    ) {

        if (!pools[locus]) {

            throw new Error(
                `缺少 ${locus} 位点基因池。`
            );

        }

        genotype[locus] = [

            generateAllele(
                pools[locus],
                locus,
                source
            ),

            generateAllele(
                pools[locus],
                locus,
                source
            )

        ];

    }

    validateGenotype(genotype);

    return genotype;

}


// ==================================================
// 5. 基因型校验
// ==================================================

export function validateGenotype(genotype) {

    if (!genotype || typeof genotype !== "object") {

        throw new Error(
            "基因型不存在或格式错误。"
        );

    }

    const loci = Object.keys(APPEARANCE_LOCI);

    if (
        Object.keys(genotype).length !== loci.length
    ) {

        throw new Error(
            "基因型必须包含五个遗传位点。"
        );

    }

    for (const locus of loci) {

        const alleles = genotype[locus];

        if (
            !Array.isArray(alleles) ||
            alleles.length !== 2
        ) {

            throw new Error(
                `${locus} 必须包含两个等位基因。`
            );

        }

        for (const allele of alleles) {

            if (!allele || !allele.allele) {

                throw new Error(
                    `${locus} 存在无效等位基因。`
                );

            }

            const gene = getGene(
                locus,
                allele.allele
            );

            if (!gene) {

                throw new Error(
                    `未知基因：${allele.allele}`
                );

            }

            if (!Number.isFinite(gene.dominance)) {

                throw new Error(
                    `${allele.allele} 缺少显性等级。`
                );

            }

            if (typeof allele.mutated !== "boolean") {

                throw new Error(
                    "mutated 必须是布尔值。"
                );

            }

            const mutationOnly =
                gene.mutationOnly === true;

            // 专属突变色必须具有突变标记
            if (mutationOnly && !allele.mutated) {

                throw new Error(
                    `${allele.allele} 缺少突变标记。`
                );

            }

            // 非颜色位点不得标记为突变
            if (allele.mutated && !isMutableLocus(locus)) {

                throw new Error(
                    `${allele.allele} 不允许突变。`
                );

            }

            // P、L禁止突变
            if (
                allele.mutated &&
                !isMutableLocus(locus)
            ) {

                throw new Error(
                    `${locus} 不允许突变。`
                );

            }

            if (allele.mutated) {

                if (
                    typeof allele.mutationOrigin
                        !== "string" ||

                    !allele.mutationOrigin.trim()
                ) {

                    throw new Error(
                        `${allele.allele} 缺少突变来源。`
                    );

                }

            } else if (
                allele.mutationOrigin !== null
            ) {

                throw new Error(
                    "普通基因不能具有突变来源。"
                );

            }

        }

    }

    return true;

}


// ==================================================
// 6. 显隐性判断
// ==================================================

export function getDominantAllele(
    locus,
    alleles
) {

    const first = alleles[0];

    const second = alleles[1];

    const gene1 = getGene(
        locus,
        first.allele
    );

    const gene2 = getGene(
        locus,
        second.allele
    );

    if (!gene1 || !gene2) {

        throw new Error(
            `${locus} 存在未知基因。`
        );

    }

    if (gene1.dominance < gene2.dominance) {

        return first;

    }

    if (gene2.dominance < gene1.dominance) {

        return second;

    }

    // 不同基因不应具有相同显性等级
    if (first.allele !== second.allele) {

        throw new Error(
            `${locus} 存在重复的显性等级。`
        );

    }

    return first;

}


// ==================================================
// 7. 表现型计算
// ==================================================

export function calculatePhenotype(genotype) {

    validateGenotype(genotype);

    const phenotype = {};

    for (
        const locus of
        Object.keys(APPEARANCE_LOCI)
    ) {

        const dominant = getDominantAllele(
            locus,
            genotype[locus]
        );

        const gene = getGene(
            locus,
            dominant.allele
        );

        phenotype[locus] = {

            allele: dominant.allele,

            name: gene.name,

            hex: gene.hex ?? null,

            mutated: dominant.mutated,

            mutationOrigin:
                dominant.mutationOrigin

        };

    }

    const isSolid =
        phenotype.pattern.name === "纯色";

    const isSameColor =

        phenotype.coatColor.hex.toLowerCase() ===

        phenotype.patternColor.hex.toLowerCase();

    phenotype.patternVisible =
        !isSolid && !isSameColor;

    phenotype.displayPattern =
        phenotype.patternVisible

            ? phenotype.pattern.name

            : "纯色";

    return phenotype;

}


// ==================================================
// 8. 亲本等位基因遗传
// ==================================================

export function inheritAllele(alleles) {

    if (
        !Array.isArray(alleles) ||
        alleles.length !== 2
    ) {

        throw new Error(
            "亲本必须具有两个等位基因。"
        );

    }

    return cloneAllele(
        randomChoice(alleles)
    );

}


// ==================================================
// 9. 跨犬种基因修正
// ==================================================

export function correctInheritedAllele(
    allele,
    pool,
    locus
) {

    // 已有颜色突变允许跨犬种遗传
    if (

        allele.mutated &&

        isMutableLocus(locus)

    ) {

        return cloneAllele(allele);

    }

    const allowed = getAllowedAlleles(
        pool,
        locus
    );

    if (allowed.length === 0) {

        throw new Error(
            `${locus} 母系常规基因池为空。`
        );

    }

    if (allowed.includes(allele.allele)) {

        return cloneAllele(allele);

    }

    // 不符合母系基因池时等概率重抽
    // 不使用80%/20%规则
    return createAllele(
        randomChoice(allowed)
    );

}


// ==================================================
// 10. 完整外貌基因遗传
// ==================================================

export function inheritGenotype(
    mother,
    father
) {

    if (!mother || !father) {

        throw new Error(
            "必须提供两个亲本。"
        );

    }

    if (mother.sex !== "female") {

        throw new Error(
            "母本必须是母犬。"
        );

    }

    if (father.sex !== "male") {

        throw new Error(
            "父本必须是公犬。"
        );

    }

    validateGenotype(mother.genotype);

    validateGenotype(father.genotype);

    const pools = getBreedAppearance(
        mother.breedId
    );

    if (!pools) {

        throw new Error(
            "找不到母系犬种基因池。"
        );

    }

    const offspring = {};

    for (
        const locus of
        Object.keys(APPEARANCE_LOCI)
    ) {

        const pool = pools[locus];

        if (!pool) {

            throw new Error(
                `缺少母系 ${locus} 位点基因池。`
            );

        }

        const maternal = inheritAllele(
            mother.genotype[locus]
        );

        const paternal = inheritAllele(
            father.genotype[locus]
        );

        // 固定顺序：母系在前，父系在后
        offspring[locus] = [

            correctInheritedAllele(
                maternal,
                pool,
                locus
            ),

            correctInheritedAllele(
                paternal,
                pool,
                locus
            )

        ];

    }

    validateGenotype(offspring);

    return offspring;

}


// ==================================================
// 11. 纯合、杂合
// ==================================================

export function isHomozygous(genotype, locus) {

    const alleles = genotype[locus];

    return (

        alleles[0].allele ===
        alleles[1].allele

    );

}


export function isHeterozygous(genotype, locus) {

    return !isHomozygous(
        genotype,
        locus
    );

}


// ==================================================
// 12. 突变状态
// ==================================================

export function hasMutation(genotype) {

    return Object.values(genotype).some(

        alleles => alleles.some(

            allele => allele.mutated === true

        )

    );

}


export function hasVisibleMutation(phenotype) {

    for (
        const locus of
        GAME_CONFIG.genetics.mutableLoci
    ) {

        if (

            locus === "patternColor" &&

            !phenotype.patternVisible

        ) {

            continue;

        }

        if (phenotype[locus]?.mutated) {

            return true;

        }

    }

    return false;

}


export function getMutationRecords(genotype) {

    const records = [];

    for (
        const locus of
        Object.keys(APPEARANCE_LOCI)
    ) {

        genotype[locus].forEach(

            (allele, index) => {

                if (!allele.mutated) {
                    return;
                }

                records.push({

                    locus,

                    alleleIndex: index,

                    allele: allele.allele,

                    name: getGene(
                        locus,
                        allele.allele
                    ).name,

                    mutationOrigin:
                        allele.mutationOrigin

                });

            }

        );

    }

    return records;

}