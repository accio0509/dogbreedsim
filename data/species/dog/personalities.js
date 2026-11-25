export const PERSONALITIES = {
    brave: {
        name: "勇敢",
        stats: { STR: 1.1, PER: 0.9 }
    },

    lively: {
        name: "活泼",
        stats: { SPD: 1.1, STA: 0.9 }
    },

    resilient: {
        name: "坚韧",
        stats: { STA: 1.1, SPD: 0.9 }
    },

    clever: {
        name: "机灵",
        stats: { AGI: 1.1, STR: 0.9 }
    },

    intelligent: {
        name: "聪慧",
        stats: { INT: 1.1, STR: 0.9 }
    },

    curious: {
        name: "好奇",
        stats: { PER: 1.1, STA: 0.9 }
    },

    diligent: {
        name: "勤奋",
        effects: { trainingEV: 1.2 }
    },

    foodie: {
        name: "贪吃",
        effects: { snackEXP: 1.2 }
    },

    playful: {
        name: "贪玩",
        effects: { toyEXP: 1.2 }
    },

    adventurous: {
        name: "冒险",
        effects: { explorationEXP: 1.2 }
    },

    competitive: {
        name: "好胜",
        effects: { competitionMoney: 1.1 }
    },

    lucky: {
        name: "幸运",
        effects: { rareDrop: 1.2 }
    },

    gentle: {
        name: "温顺",
        effects: { nurseryEXP: 1.2 }
    },

    relaxed: {
        name: "悠闲",
        effects: {}
    },

    calm: {
        name: "平和",
        effects: {}
    }
};

export function getPersonality(id) {
    return PERSONALITIES[id];
}

export function getRandomPersonality() {
    const ids = Object.keys(PERSONALITIES);

    return ids[
        Math.floor(Math.random() * ids.length)
    ];
}