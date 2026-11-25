# SVG Avatar 1.5（独立扩展，适用于游戏 V1.0.4）

本次为 V1.4 → V1.5 增量整合补丁，必须已安装 V1.4。

安装：备份游戏目录和存档，将 ZIP 解压到项目根目录并覆盖同名文件。游戏主版本仍为 V1.0.4；标记作为可选字段保存，旧存档无标记时按空处理。

接入：饲育屋/电脑盒子等使用 renderAnimalCard 的页面、犬只详情、市场/租借卡片、孵化预览（复用详情）。家谱节点及繁育外貌概率也已接入头像。图鉴基因列表及下拉选择器不变。

关闭：编辑 ui/avatar/settings.js，将 SVG_AVATARS_ENABLED 改为 false；恢复原色块。不必删除模块。回退本次更新请恢复安装前备份的源码。

未来手绘：保留 renderDogAvatar(animal,{large,phenotype}) 接口，在 renderer.js 中替换 SVG 为自己的分层图片；templates.js 保存 24 犬种轮廓参数，patterns.js 保存花纹形状。实际表现型由 getAnimalPhenotype 提供，所有颜色直接使用数据库 HEX。当前三色的第三色固定为白色（白底时用奶油色区分），仅为绘制约定，不新增基因。未增加花纹兼容限制。

预览：使用 Live Server 打开 tests/avatar-preview.html，可调整五种表现型参数。预览允许自由组合，不代表各犬种真实基因池。另提供可双击打开的独立 HTML（单独下载）。

V1.3：陨石纹分布在额头两侧及左右脸颊，中央保留底毛；保留新版覆色及长毛并集修复。24 犬种专属脸型、眼距、眼高、眼径、口鼻与毛发宽度。仍为卡通示意，不改变遗传。

V1.4：三色白色口鼻区域扩大；鼻子添加灰色细描边及高光，嘴线采用双层对比描边。其他花纹及脸型不变。

测试：Node 22 下运行 `node --experimental-default-type=module tests/avatar-test.mjs`。本版重新执行头像组合、卡片详情、数据不变性和独立头型测试；实际视觉效果仍需验收。

V1.5（合并原 V1.5、V1.6 和犬只标记）：24犬种独立耳廓、内耳及饰毛；杜宾立耳、蝴蝶犬连续耳缘、哈士奇大耳、拉布拉多窄脸、圣伯纳与纽芬兰独立脸型；家谱小头像、繁育联合外貌概率（未发生新突变时的条件概率，合并隐藏花纹，每页24项）。

犬只详情可自由添加或取消爱心、哑铃、DNA 标记，允许多选，仅自有犬。标记同步至血统档案，不遗传、不影响属性。标记犬退役需要额外勾选确认，退役档案保留标记。

测试：`node --experimental-default-type=module tests/dog-marks-test.mjs`；另有 avatar-test.mjs、avatar-prediction-test.mjs。
