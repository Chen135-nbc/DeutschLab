# 桌面外壳交付与验收

日期：2026-10-14（Asia/Shanghai）。应用 v0.1.0；演示包 `deutschlab.demo.shell@1.0.0`。本阶段实现 UI 外壳，不宣称完整教学闭环完成。

## 用户验收项

| 要求 | 实现与证据 | 结果 |
| --- | --- | --- |
| 应用正常启动 | Electron 源码入口与最终 macOS arm64 `.app` 都运行真实窗口测试 | 通过 |
| 主要页面切换 | 七个主导航、课程/专题/章节/副本详情、表达集合/采集占位页、未知路由 | 通过 |
| 导航状态正确 | 列表及详情所属一级导航均高亮，`aria-current` 与路由一致 | 通过 |
| 布局一致、无明显溢出 | 统一设计规范/共享组件；三种窗口尺寸的大字模式检测主页面无横向溢出；首页与副本截图人工检查 | 通过；仅当前 Mac |
| 演示课程进入详情 | 两个 A1 单元各自独立对象、详情与返回目录；A2/B1/B2 明确待扩展 | 通过 |
| 同一副本双入口 | 课内与副本库均按 `demo.quest.bakery` 查询同一对象，修订均为 `1` | 通过 |
| 未实现功能占位 | 教学按钮禁用且标未实现；无假成绩、假学习时长或假剧情记录 | 通过 |
| 保留项目资料与原则 | 原启动资料未改；现有文档更新实施状态；没有删除原文件或改写 Git 历史 | 通过 |

## 实际功能

首页展示个人等级、Studio21 演示目录状态、真实的最近浏览课程、拓展/副本/统计入口。主线与拓展有列表及详情，章节有独立路由。副本中心搜索标题、德语标题和描述，提供等级筛选及空结果清除；副本详情可切换玩法预览与教学备注，无剧情变更或语言评分。

知识星系是手工 DEMO 节点占位，可选择节点与跳转关联课程；没有自动关联算法。统计显示真实学习数据尚缺，另列浏览记录。设置支持等级、标准/大字、减少动效，保存成功提示；失败回退。数据管理目前只有位置查看与明确禁用的导入/备份入口。

视觉采用固定左侧导航、暖白背景、深绿主卡、浅绿/砂色标签、统一卡片和宋体/Georgia 点缀；字体来自系统，插画为本地 SVG 组件，无 CDN、远程字体或网络图片。最小窗口为 960×640，允许纵向滚动。

## 自动验证结果

| 验证 | 结果 |
| --- | --- |
| `npm test` | TypeScript 检查 + 生产构建 + 4 个内容/SQLite 测试通过 |
| `npm run test:desktop` | 源码入口 8/8 通过 |
| `npm run package` | 生成 `.app` 成功，使用匹配的 Electron 44.7.0 arm64 运行文件 |
| 对 `.app` 设置 DEUTSCHLAB_EXECUTABLE 后运行桌面测试 | 同一套 8/8 通过 |

最终 `.app` 本机磁盘占用约 287 MB（`du -sh`，不是压缩安装包大小）。文档最终检查：12 份 Markdown、21 个本地链接均有效，原启动资料字节未变；生产 CSP 未放开 inline 脚本；缓存的 Electron ZIP 已独立按 npm 包提供的 SHA-256 复核。构建、测试、应用产物和本地数据库均被 Git 忽略。

4 项底层测试覆盖内容 ID/引用及复用、关闭连接后重读、非法值不修改档案、较新数据库版本不被降级重置。8 项桌面测试覆盖七页导航、两课程详情、专题章节/副本身份、搜索/占位模块、知识/统计、设置退出重开、三种窗口与大字、离线加载/无页面异常及远程请求。

离线测试使用 Electron 浏览器上下文的 offline 状态并重新加载，记录的 HTTP(S) 请求为空；不是整台电脑物理断网测试。设置与浏览记录使用临时档案，测试不修改真实学习数据。正文截图需关闭动画并等待页面可见，避免把入场动画首帧误当最终画面。

首次运行文件下载失败：通过官方文档支持的镜像安装，并保留 Electron npm 包提供的校验值。首次桌面测试发现异步保存前开关未立即改变：已实现即时反馈与失败回退，复测通过。打包脚本已适配当前 packager 的具名导出。

## 新增文件

| 分类 | 文件 |
| --- | --- |
| 工程 | `package.json`、`package-lock.json`、`tsconfig.json`、`vite.config.ts`、`playwright.config.ts` |
| 构建/运行 | `scripts/build-electron.mjs`、`scripts/dev.mjs`、`scripts/start.mjs`、`scripts/package.mjs` |
| 内容与合约 | `content/demo/catalog.json`、`src/domain/catalog.ts`、`src/shared/contracts.ts` |
| Electron | `src/main/index.ts`、`src/main/store.ts`、`src/preload/index.ts` |
| UI 基础 | `src/renderer/index.html`、`main.tsx`、`App.tsx`、`profile.tsx`、`components.tsx`、`styles.css` |
| 页面 | `src/renderer/pages/Home.tsx`、`Learning.tsx`、`Quests.tsx`、`Workspace.tsx` |
| 测试 | `tests/data-store.test.mjs`、`tests/desktop.spec.ts` |
| 进度/交付 | `docs/DEVELOPMENT_PROGRESS.md`、`docs/SHELL_ACCEPTANCE.md` |

同步更新 README、产品基线的实施记录、架构、概念模型的实现边界、路线图、决策、原验收状态、内容说明与 `.gitignore`。构建输出 `dist/`、`release/`，测试截图 `test-results/`，均不纳入 Git。首页截图为 `test-results/deutschlab-home.png`，副本截图为 `test-results/deutschlab-quest.png`；重新测试会生成。

## 未实现与验证限制

完整练习与判分、真实 Studio21 讲义导入、真实框架映射、AI/语音、完整剧情及正式/重玩状态服务、外部教练任务卡/摘要录入、表达/文本内容保存、自动关联、复杂技能树、版本导入、备份恢复、iCloud 和跨设备同步都未实现。

SQLite 当前只有设置与浏览表；没有完整 PracticeAttempt 或 CourseProgress。副本切换的是预览 UI，不是已实现的剧情引擎。两个 DEMO 单元的数据复用不能替代两个真实 A1 单元的教学复用验收。

未验证 Windows/Linux/Intel Mac、正式分发签名/公证、整机物理断网、内存与启动性能预算。开发服务器热更新需后续开发使用时继续验证；本轮主要验收生产本地资源与最终 `.app`。
