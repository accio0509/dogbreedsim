import {getStarterDogNames} from '../data/species/dog/names.js';
import {gameNow} from '../engine/gameClock.js';
import { settleGrowth } from "../engine/growth.js";
import { GAME_CONFIG } from "../config/game.js";

import {
    createAnimal,
    formatAnimalId,
    isBusy
} from "../engine/animal.js";

import {
    getBreed
} from "../data/species/dog/breeds.js";

import {
    getCurrentTime
} from "../engine/time.js";


// 创建空白游戏状态
export function createGameState() {
    return {
        version: GAME_CONFIG.version,

        initialized: false,
        gameClock: null,
        competitionTasks: [],

        kennelName: "未命名犬舍",

        money: GAME_CONFIG.initialMoney,

        nextAnimalId: 1,

        nextEventId: 1,

        facilities: {
            nursery: {
                capacity: GAME_CONFIG.capacity.nursery
            },

            computer: {
                capacity: GAME_CONFIG.capacity.computer
            },

            breeding: {
                capacity: GAME_CONFIG.capacity.breedingInitial
            },

            incubation: {
                capacity: GAME_CONFIG.capacity.incubationInitial
            }
        },

        // 每日市场库存及开发模式专用时间偏移
        market: {day: null, listings: []},
        rentalMarket: {day: null, listings: []},
        marketClockOffsetMs: 0,

        // 当前拥有的犬只
        activeAnimals: {},

        // 永久血统档案
        pedigreeRecords: {},

        // 繁育任务
        breedingTasks: [],

        // 孵化任务
        incubationTasks: [],

        // 探索任务
        explorationTasks: [],
        trainingTasks: [],

        // 比赛记录
        competitionRecords: [],

        // 道具仓库
        inventory: {},

        // 事件记录
        events: [],

        timestamps: {
            createdAt: getCurrentTime(),
            lastPlayedAt: getCurrentTime()
        }
    };
}


// 当前游戏状态
export const gameState = createGameState();


// 获取新的唯一犬只编号
export function allocateAnimalId() {
    const id = formatAnimalId(
        gameState.nextAnimalId
    );

    gameState.nextAnimalId++;

    return id;
}


// 添加事件记录
export function addEvent(message, type = "system") {
    gameState.events.unshift({
        id: gameState.nextEventId++,
        type: type,
        message: message,
        timestamp: getCurrentTime()
    });
}


// 添加犬只
export function addAnimal(animal) {
    if (
        gameState.activeAnimals[animal.id] ||
        gameState.pedigreeRecords[animal.id]
    ) {
        throw new Error("犬只编号重复");
    }

    gameState.activeAnimals[animal.id] = animal;

    // 保存独立的永久血统档案
    gameState.pedigreeRecords[animal.id] = {
        id: animal.id,
        name: animal.name,
        species: animal.species,
        breedId: animal.breedId,
        sex: animal.sex,

        genotype: structuredClone(animal.genotype),

        personality: animal.personality,
        weightGene: animal.weightGene,

        iv: structuredClone(animal.iv),

        pedigree: structuredClone(animal.pedigree),

        source: animal.source,

        createdAt: animal.timestamps.createdAt,
        hatchedAt: animal.timestamps.hatchedAt,

        retired: false,
        retiredAt: null,
        retiredStage: null
    };

    return animal;
}


// 获取全部现役犬只
export function getAnimals() {
    return Object.values(
        gameState.activeAnimals
    );
}


// 根据编号获取犬只
export function getAnimal(id) {
    return gameState.activeAnimals[id];
}


// 获取指定位置的犬只
export function getAnimalsByLocation(location) {
    return getAnimals().filter(
        animal => animal.location === location
    );
}


// 获取设施使用数量
export function getLocationCount(location) {
    return getAnimalsByLocation(location).length;
}


// 判断设施是否有空位
export function hasSpace(location) {
    const facility = gameState.facilities[location];

    if (!facility) {
        return false;
    }

    return getLocationCount(location) <
        facility.capacity;
}


// 初始化新游戏
export function initializeGame(kennelName, breedId, starterNames = null) {
    if (gameState.initialized) {
        return {
            success: false,
            message: "游戏已经初始化"
        };
    }

    const breed = getBreed(breedId);

    if (!breed) {
        return {
            success: false,
            message: "犬种不存在"
        };
    }

    const names = starterNames ?? getStarterDogNames();
    if (!Array.isArray(names) || names.length !== 2 || names.some(name => typeof name !== 'string' || !name.trim() || name.trim().length > 20)) {
        return {success:false,message:'犬只名称必须为1至20个字符'};
    }

    gameState.kennelName =
        kennelName.trim().slice(0, 20) || "我的犬舍";

    const female = createAnimal({
        id: allocateAnimalId(),
        breedId: breedId,
        name: names[0].trim(),
        sex: "female",
        source: "starter"
    });

    const male = createAnimal({
        id: allocateAnimalId(),
        breedId: breedId,
        name: names[1].trim(),
        sex: "male",
        source: "starter"
    });

    female.birthNamingUsed = true;
    male.birthNamingUsed = true;
    addAnimal(female);
    addAnimal(male);

    gameState.initialized = true;

    addEvent(
        `犬舍「${gameState.kennelName}」正式建立！`
    );

    addEvent(
        `获得两只${breed.name}幼犬。`,
        "acquisition"
    );

    return {
        success: true
    };
}


// 修改犬只名称
export function renameAnimal(id, newName) {
    const animal = getAnimal(id);

    if (!animal) {
        return {
            success: false,
            message: "犬只不存在"
        };
    }

    if (animal.source === "rental") return {success:false,message:"租借犬不可改名"};
    if (typeof newName !== "string") return {success:false,message:"名称格式无效"};

    const name = newName.trim();

    if (!name || [...name].length > 20 || /[\u0000-\u001f\u007f]/u.test(name)) {
        return {
            success: false,
            message: "名称长度必须为1至20个字符，不能含控制字符"
        };
    }

    const oldName = animal.name;

    animal.name = name;

    // 同步永久血统档案
    gameState.pedigreeRecords[id].name = name;
    for (const egg of gameState.incubationTasks) {
        if (egg.motherId === id) egg.motherName = name;
        if (egg.fatherId === id) egg.fatherName = name;
    }
    for (const record of gameState.competitionRecords) {
        if (record.animalId === id) record.name = name;
    }

    addEvent(
        `${oldName}更名为${name}。`
    );

    return {
        success: true
    };
}


// 移动犬只
export function moveAnimal(id, targetLocation) {
    const animal = getAnimal(id);

    if (!animal) {
        return {
            success: false,
            message: "犬只不存在"
        };
    }

    if (
        !["nursery", "computer"].includes(targetLocation) ||
        !["nursery", "computer", "pending"].includes(animal.location)
    ) {
        return {
            success: false,
            message: "无法移动至指定位置"
        };
    }

    if (animal.retired || isBusy(animal)) {
        return {
            success: false,
            message: "当前状态无法移动"
        };
    }

    if (animal.location === targetLocation) {
        return {
            success: false,
            message: "犬只已经位于该设施"
        };
    }

    if (!hasSpace(targetLocation)) {
        return {
            success: false,
            message: "目标设施容量已满"
        };
    }

    settleGrowth(gameState);
    animal.location = targetLocation;

    animal.timestamps.lastGrowthAt =
        gameNow(gameState);

    const locationName =
        targetLocation === "nursery"
            ? "饲育屋"
            : "电脑盒子";

    addEvent(
        `${animal.name}已移动至${locationName}。`,
        "movement"
    );

    return {
        success: true
    };
}