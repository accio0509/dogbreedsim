# 狗狗育种模拟器 V1.0.0-RC1

覆盖原项目后用原来的 Live Server 地址启动，避免因 origin 改变看不到旧存档。也可使用 Windows 启动游戏.bat（要求 Python 3、5500端口可用，关闭服务窗口可停止）。不同地址、端口、浏览器配置的存档独立；通过游戏设置导出/导入 JSON 迁移。导入会验证存档并备份之前的原始存档到对应 localStorage 键的 :backup 后缀；损坏存档不会自动覆盖，错误页面可导出原始存档。新游戏页面也可导入。备份不会自动恢复，必要时通过开发者工具手动读取备份。

## 更新
- 电脑盒子：筛选、按犬种/名称/性别/年龄/IV排序显示（不移动犬只）。
- 活动选择器：默认折叠筛选；展开筛选结果，悬停查看毛色、花纹色、瞳色等位基因及六维实际能力。原生下拉框悬停支持取决于浏览器，使用下方结果列表更可靠。
- 购买市场与租借市场各自4小时现实时间付费刷新冷却，跨日保留；开发者快进仍影响测试市场时间。
- 探索过程文字，隐藏具体掉落率，奖励规则不变。
- 独立道具仓库；显示全部23种及来源、库存，库存为0灰色。犬舍经营只展示商店12种。
- 图鉴网格及色块、精简常用页面说明。
- 新存档版本 1.0.0-rc.1，兼容0.10.0。

## 测试
node --experimental-default-type=module tests/run-v100.mjs
node --experimental-default-type=module tests/balance-test.mjs
node --experimental-default-type=module tests/family-items-test.mjs
node --experimental-default-type=module tests/witch-routing-test.mjs
node --experimental-default-type=module tests/database-test.mjs
node --experimental-default-type=module tests/rc1-test.mjs

浏览器本地访问在开发环境中被策略拦截，需要用户本地验收。此版不是最终正式版。

## RC1 界面补丁
探索移除奖励预告；训练和比赛新增任务进度条；商店卡片网格；导航按用途分组。存档版本不变。新增 tests/rc1-ui-test.mjs。
