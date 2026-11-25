
// 获取当前现实时间戳（毫秒）
export function getCurrentTime() {
    return Date.now();
}

// 格式化现实时间
export function formatTime(timestamp) {
    return new Date(timestamp).toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    });
}

// 计算经过的时间（毫秒）
export function getElapsedTime(startTime, endTime = getCurrentTime()) {
    return Math.max(0, endTime - startTime);
}

// 时间单位
export const TIME = {
    SECOND: 1000,
    MINUTE: 60 * 1000,
    HOUR: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000
};
