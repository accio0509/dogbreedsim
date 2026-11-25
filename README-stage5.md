# V0.4.0 第五阶段

解压到 dogbreedsim 根目录。覆盖 ui/breedingRoom.js、ui/incubationRoom.js（在第三、四阶段原版基础上新增可选参数，旧测试页仍可使用）。新增 engine/breedingLifecycle.js、tests/lifecycle-checks.js、tests/breeding-lifecycle-test.html。其余引擎不变。如已有自行修改的 UI 文件，先备份并合并改动，不要直接覆盖。

使用 Live Server 打开 tests/breeding-lifecycle-test.html，运行繁育与领取测试。独立 localStorage 键，不会读取或修改第四阶段存档、正式存档。测试默认幼犬放入饲育屋，名称最多20个字符，留空保留默认名；取消命名不领取。可通过 chooseLocation 适配已有容量逻辑，返回 nursery、computer、pending 或 null（拒绝领取）。

## 接入正式存档的接口示例（不是正式 main.js 的替换文件）

前提：正式状态提供可 JSON 序列化的 animals 数组、eggs 数组、pedigreeRecords 对象（键为犬只 ID，值为完整犬只快照）。若正式存档有其他结构，先写适配器，尤其不要覆盖已有家谱。旧存档仅缺少 eggs 时可初始化为 []；不要静默重建已有家谱。正式项目若另有全局编号计数器，应确保唯一性。保持现有 rename 规则，并在通用改名接口中按需检查 birthNamingUsed，不让领取后再次使用出生免费命名机会。

```js
import { breedAndSave, claimEgg } from './engine/breedingLifecycle.js';
import { mountBreedingRoom } from './ui/breedingRoom.js';
import { mountIncubationRoom } from './ui/incubationRoom.js';
// state 必须是正式游戏的实际状态；persist 必须同步、原子地写入整个候选存档。
// 写入失败应抛错或返回 false；不可先写部分字段，不可传异步函数。
// 示例中的 breedRoot, incubationRoot, persist, refreshOtherViews 由现有主页面提供。
const {animals, eggs, pedigreeRecords} = state;
const syncViews = () => { breeding.refresh(); incubation.refresh(); refreshOtherViews(); };
const breeding = mountBreedingRoom(breedRoot, {
  animals, eggs, pedigreeRecords,
  executeBreeding: ({mother,father,eggId,offspringId,now}) => breedAndSave({
    state,motherId:mother.id,fatherId:father.id,eggId,offspringId,now,persist
  }),
  onChange: syncViews
});
const incubation = mountIncubationRoom(incubationRoot, {
  eggs,
  onClaim: (eggId,name) => {
    const result = claimEgg({state,eggId,name,persist});
    if(result.success) syncViews();
    return result;
  }
});
// 正式界面请按已有容量规则传入纯 chooseLocation(state,egg) 函数。
// 销毁页面时调用 breeding.destroy() 和 incubation.destroy()。
```

事务层先在完整状态副本执行操作，存档成功才更新原数组和家谱对象；单页面内防止重复操作。请勿同时开启多个测试页/游戏标签页写同一存档；不提供跨标签并发锁或本地系统时间防作弊。事务假定状态和集合是普通可变对象、数组，且存档函数同步原子写入。正式 main.js/storage 实际代码未取得，因此未直接修改正式存档系统，不能视为已接入。

已进行语法检查和模拟引擎的26项测试。真实引擎的接口、遗传字段保持、家谱计算和实际浏览器运行需在本地验收。
