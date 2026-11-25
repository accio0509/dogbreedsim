# V0.4.0 正式主页面接入补丁

将压缩包解压到原项目根目录（不是新建一层目录）。覆盖提示属于本次修改。不要覆盖 `.git`，补丁不包含 Git 历史。保留前五阶段及第六阶段原文件。

## 文件变更
- 覆盖 `config/game.js`, `index.html`, `storage/state.js`, `ui/main.js`, `ui/animalView.js`, `ui/breedingRoom.js`。
- 新增 `storage/save.js`, `engine/growth.js`, `engine/formalBreeding.js`, `tests/formal-checks.js`, `tests/formal-test.html`。
- 不改遗传、近交、突变、犬蛋、第五阶段领取引擎。

## 正式存档
使用 localStorage 的 `dogbreedsim:save`，与旧独立测试页面的键隔离。正式数据仍采用 activeAnimals 对象、pedigreeRecords 对象和 incubationTasks 数组，编号从 nextAnimalId 分配；产蛋、领取、事件和编号一次提交。旧版对象结构可迁移；未知旧任务格式或损坏存档不会自动清除。以前正式主页面没有持久化功能，因此不能恢复之前未保存的游戏会话。浏览器清理站点数据会删除本地存档；更换主机名、端口或浏览器时存档不共享。建议只打开一个正式游戏标签页。

## 规则与暂定行为
- 孵化/冷却24小时；初始孵化位1；免费即时产蛋；每犬终生10次。容量读取实际设施配置。繁育位不持续占用；升级功能未加入。旧配置内成功率/尝试间隔未用于即时产蛋，与第二阶段保持一致。
- 饲育屋空闲未退役幼犬每小时10经验，240为青年，720为成年；离线单次最多结算48小时；电脑盒子和等待安置不成长。幼犬领取后才开始成长。
- 新生犬出生免费命名一次，确认领取后锁定此免费改名；初始犬旧改名功能保留。等待安置可通过总览中的详情转入饲育屋或电脑盒子。
- 原始上传项目只有吉娃娃、柯基犬、金毛寻回犬、圣伯纳犬四个犬种；本次不增加其余犬种。

## 验收
1. 用 Live Server 打开 tests/formal-test.html，点击运行全部犬种测试。预期264项通过，0项失败（每种16+24+26）。
2. 用 Live Server 打开 index.html。创建犬舍后刷新，确认名称、金钱、初始两只犬仍在。
3. 繁育中心选择幼犬，确认不能繁育。饲育屋自然成长至成年后繁育，孵化室有犬蛋，刷新后仍在；满24小时后领取并命名；检查总览及血统家谱，再刷新确认保存。
4. 如不想等待真实时间，使用另一独立浏览器配置文件或测试站点 origin（例如不同 Live Server 端口），仅在可丢弃的测试存档上通过 DevTools Console 执行下列命令。不要在正式存档执行。

```js
// 第一次执行模拟过去48小时；刷新后再次执行模拟过去24小时。
{
  const s=JSON.parse(localStorage.getItem('dogbreedsim:save'));
  for(const a of Object.values(s.activeAnimals)) a.timestamps.lastGrowthAt=Date.now()-48*3600000;
  localStorage.setItem('dogbreedsim:save',JSON.stringify(s));
  location.reload();
}
```
第二次将 `48` 换成 `24`，即可让初始犬达到成年。成功产蛋后，在同一测试 origin 执行：

```js
{
  const s=JSON.parse(localStorage.getItem('dogbreedsim:save'));
  for(const e of s.incubationTasks){e.createdAt-=24*3600000;e.hatchAt-=24*3600000;}
  localStorage.setItem('dogbreedsim:save',JSON.stringify(s));
  location.reload();
}
```
进入孵化室领取幼犬。这个方法只用于测试犬蛋，不模拟正式亲本冷却。正式游戏没有时间加速按钮。

## Git
主页面人工验收通过后，在原仓库检查 `git status`、`git diff --stat`，确认本次文件后 `git add .`，`git diff --cached --stat`，`git commit -m "Release V0.4.0 - Breeding and incubation system"`，`git tag -a v0.4.0 -m "V0.4.0 stable release"`。不要提前打标签。

## 验证范围
真实源码的 Node 自动测试264项通过，JS语法检查通过。运行环境 Chromium 阻止网页导航，未完成实际主页面点击测试。需要本地 Live Server 最终确认。
