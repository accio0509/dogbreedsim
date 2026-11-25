# V0.4.0 第六阶段：接入适配器与最终验收

先确认第五阶段修复补丁已覆盖。将本包解压到项目根目录；本包只新增文件。
用 Live Server 打开 tests/release-test.html。自动验收正常路径共24项（遇到上游失败可能提前终止或跳过依赖项），第五阶段回归26项。测试页使用独立 localStorage 键。

## 正式接入（需核对现有源码）

本包不是 main.js、storage/state.js 的替换文件。已知旧状态使用 activeAnimals，但其最新结构与实际保存函数未取得。适配器假定它是数组，家谱是对象；新字段 eggs 为数组。不会覆盖旧任务或重建家谱；发现旧任务非空且缺少 eggs 会拒绝自动迁移。请先备份正式存档。旧存档无需清空。

在实际主页面创建两个容器（ID可改，需保证不与现有页面冲突）：

```html
<section id="breeding-room"></section>
<section id="incubation-room"></section>
```

在正式 state 加载完成后，按照项目文件相对路径接入：

```js
import {mountBreedingFeature} from './ui/breedingFeature.js';
const feature = mountBreedingFeature({
  state, // 正式游戏实际状态
  breedRoot: document.querySelector('#breeding-room'),
  incubationRoot: document.querySelector('#incubation-room'),
  persist: candidate => saveWholeState(candidate), // 替换成实际同步原子保存接口；失败必须抛错或返回 false
  getCapacity: current => ({nursery:10,computer:60,incubation:1}), // 接实际设施等级，允许 1~5
  onChange: () => refreshOtherViews() // 替换成实际饲育屋、电脑盒子、家谱等刷新函数
});
```

上述 `state`、`saveWholeState`、`refreshOtherViews` 是占位名称，不可直接假定存在。若犬只数组名不是 activeAnimals，可传 animalsKey；若已有兼容的犬蛋数组可传 eggsKey。不能直接把未知格式的 incubationTasks 映射为 eggs。默认 UUID 编号；如正式系统要求序号，需适配 makeIds，保证所有犬只/犬蛋/家谱 ID 唯一，并在同一保存事务中更新正式编号计数器（当前适配器不改计数器）。如正式存档函数需要异步或不接受候选状态，必须调整事务实现，不能直接使用本示例。页面替换状态对象或退出时调用 feature.destroy()，重新挂载；其他犬只操作后调用 feature.refresh()。正式游戏不使用测试时间偏移。生长测试直接改变测试幼犬 stage，不改变正式成长机制。当前只实现即时产蛋，因此不模拟占用中的繁育位或设施升级。正式改名接口仍需检查 birthNamingUsed。

## 最终提交

真实主页面接入、旧档备份恢复、完整回归测试全部通过后才提交。检查 git status / git diff，按实际新增及修改文件执行 git add，git commit -m "Release V0.4.0 - Breeding and incubation system"，git tag -a v0.4.0 -m "V0.4.0 stable release"。不要提交测试存档或密钥。若标签已存在，不要覆盖。
