export const SPEEDS=[1,2,3,5,10];
export function gameNow(state,real=Date.now()) {const c=state.gameClock;return c?c.gameAt+Math.max(0,real-c.realAt)*c.speed:real;}
export function validateClock(c){if(c!==null&&(!c||!SPEEDS.includes(c.speed)||!Number.isSafeInteger(c.gameAt)||!Number.isSafeInteger(c.realAt)||c.gameAt<0||c.realAt<0))throw Error('游戏时钟异常');}
export function changeSpeed(state,speed,real=Date.now()){if(!SPEEDS.includes(speed))throw Error('无效倍速');state.gameClock={gameAt:Math.floor(gameNow(state,real)),realAt:Math.max(real,state.gameClock?.realAt??real),speed};return state.gameClock;}
