export const GAME_CONFIG = {

    version: "1.0.2",

    initialMoney: 1000,

    // 设施容量
    capacity: {
        nursery: 10,
        computer: 60,

        breedingInitial: 1,
        breedingMax: 5,

        incubationInitial: 1,
        incubationMax: 5
    },

    // 成长系统
    growth: {

        expPerHour: 30,

        juvenileExp: 240,
        adultExp: 720,

        offlineMaxHours: 48,

        stageMultiplier: {
            puppy: 0.4,
            juvenile: 0.7,
            adult: 1.0
        },

        weightMultiplier: {
            puppy: 0.2,
            juvenile: 0.6,
            adult: 1.0
        }
    },

    // 能力值系统
    stats: {

        ivMin: 0,
        ivMax: 10,

        evMin: 0,
        evMax: 100,
        evTotalMax: 300,

        ivMultiplier: 2,
        evMultiplier: 0.2,

        inheritedIVCount: 3
    },

    // 繁育系统
    breeding: {

        // 暂时保留旧版产蛋尝试间隔
        checkIntervalMinutes: 30,

        incubationHours: 24,

        cooldownHours: 24,

        lifetimeMaxBreedings: 10,

        eggsPerSuccess: 1,

        offspringPerEgg: 1,

        moneyCost: 0,

        weightVariation: 10,

        allowInbreeding: true,

        // 正式近交惩罚
        // maxF为该档位包含的最大近交系数
        inbreedingPenalties: [

            {
                maxF: 0.0625,
                penalty: 0
            },

            {
                maxF: 0.125,
                penalty: 0.05
            },

            {
                maxF: 0.25,
                penalty: 0.10
            },

            {
                maxF: 1,
                penalty: 0.20
            }

        ],

        sameBreed: {

            successRate: 0.30,

            mutationRate: 0.05

        },

        differentBreed: {

            0: {
                successRate: 0.20,
                mutationRate: 0.08
            },

            1: {
                successRate: 0.15,
                mutationRate: 0.12
            },

            2: {
                successRate: 0.10,
                mutationRate: 0.18
            },

            3: {
                successRate: 0.05,
                mutationRate: 0.25
            }

        }

    },

    // 遗传系统
    genetics: {

        normalColorRate: 0.80,

        rareColorRate: 0.20,

        rareColorSources: [
            "market",
            "exploration"
        ],

        colorLoci: [
            "coatColor",
            "patternColor",
            "eyeColor"
        ],

        mutableLoci: [
            "coatColor",
            "patternColor",
            "eyeColor"
        ],

        mutationMaxPerEgg: 1,

        personalityInheritance: {

            mother: 0.10,

            father: 0.10,

            random: 0.80

        }

    }

};