# SVG Avatar 1.4（独立扩展，适用于游戏 V1.0.4）

完整整合版：包含 V1.0–V1.4 所有头像模块，不需要安装旧头像补丁。

安装：备份项目中的 ui/animalView.js 和 ui/marketView.js，然后将 ZIP 解压到项目根目录，覆盖这两个文件。新增 ui/avatar/ 与 tests/avatar-*。不修改游戏版本号、存档、基因池、遗传或经济规则。若本地不是 V1.0.4，先安装此前的补丁。

接入：饲育屋/电脑盒子等使用 renderAnimalCard 的页面、犬只详情、市场/租借卡片、孵化预览（复用详情）。家谱节点、图鉴基因列表及下拉选择器暂未改动，以免影响布局。

关闭：编辑 ui/avatar/settings.js，将 SVG_AVATARS_ENABLED 改为 false；恢复原色块。不必删除模块。完全卸载可恢复备份的两个 UI 文件，再删除 ui/avatar 和新增测试文件。

未来手绘：保留 renderDogAvatar(animal,{large,phenotype}) 接口，在 renderer.js 中替换 SVG 为自己的分层图片；templates.js 保存 24 犬种轮廓参数，patterns.js 保存花纹形状。实际表现型由 getAnimalPhenotype 提供，所有颜色直接使用数据库 HEX。当前三色的第三色固定为白色（白底时用奶油色区分），仅为绘制约定，不新增基因。未增加花纹兼容限制。

预览：使用 Live Server 打开 tests/avatar-preview.html，可调整五种表现型参数。预览允许自由组合，不代表各犬种真实基因池。另提供可双击打开的独立 HTML（单独下载）。

V1.3：陨石纹分布在额头两侧及左右脸颊，中央保留底毛；保留新版覆色及长毛并集修复。24 犬种专属脸型、眼距、眼高、眼径、口鼻与毛发宽度。仍为卡通示意，不改变遗传。

V1.4：三色白色口鼻区域扩大；鼻子添加灰色细描边及高光，嘴线采用双层对比描边。其他花纹及脸型不变。

测试：Node 22 下运行 `node --experimental-default-type=module tests/avatar-test.mjs`。本版重新执行头像组合、卡片详情、数据不变性和独立头型测试；实际视觉效果仍需验收。
