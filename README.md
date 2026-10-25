# DeutschLab · 德语智慧学习系统

个人使用、电脑本地优先的德语学习工作台。跟随 Studio21 真实教材与录播课程逐步学习，以自学专题组织拓展与情境任务。

**当前阶段：Studio21 A1 第一单元与 Focus Mode，v0.3.0，2026-10-15。** 沿用 Electron + React/TypeScript + SQLite，在既有 A1 自学拓展框架与能力树上增加四个教材小节、18 张知识卡、18 道小节练习和 9 道原创综合检测题。

## 产品理解

先验证一个真实 A1 学习闭环，再用第二个单元验证内容复用。Studio21 主线负责核心词汇、基础语法与检测；专题拓展负责讲解和基础造句；副本提供有限情境训练。知识关联与能力树从学习证据生长，而非按日期自动点亮。

已提供 A1 框架与能力树 JSON，保留标题、顺序、原文及 ID。本次第一单元依据用户提供的课程概要整理，未获得教材照片或讲义原文，因此不声称逐页复核。其他 Studio21 单元、A2 框架及此前产品报告仍未提供；旧主线演示和副本 DEMO 不视为正式教材。

## 文档入口

| 文档 | 内容 |
| --- | --- |
| [产品基线](docs/PRODUCT_BASELINE.md) | 九个模块、四个副本维度、边界与待定事项 |
| [环境与资料核验](docs/STARTUP_AUDIT.md) | 实测环境、资料缺口、验证范围 |
| [技术与信息架构](docs/ARCHITECTURE.md) | 桌面技术对比、推荐方案、模块图与拟议目录 |
| [概念数据模型](docs/DATA_MODEL.md) | 稳定 ID、关键实体、多对多关系、版本和证据 |
| [任务路线图](docs/ROADMAP.md) | S0–S8 小阶段、依赖与退出标准 |
| [决策记录](docs/DECISIONS.md) | 产品约束、技术建议、待确认项与理由 |
| [验收说明](docs/ACCEPTANCE.md) | 后续自动测试重点和手工验收步骤 |
| [外壳交付与验收](docs/SHELL_ACCEPTANCE.md) | 外壳阶段历史实现、测试与文件清单 |
| [A1 骨架交付与验收](docs/A1_SCAFFOLD_ACCEPTANCE.md) | 新目录、能力树、非破坏性导入与双轴状态验证 |
| [开发进度](docs/DEVELOPMENT_PROGRESS.md) | 各阶段实现与验证记录 |
| [第一单元与专注模式验收](docs/STUDIO21_FOCUS_ACCEPTANCE.md) | 内容、交互、持久化及限制 |
| [内容准备说明](content/README.md) | 真实材料接入、DEMO 和来源规则 |
| [启动文档原文](docs/sources/PROJECT_STARTUP_PROMPT.md) | 用户提供的项目启动参考资料 |

## 运行与开发

当前本机交付：`release/DeutschLab-darwin-arm64/DeutschLab.app`。此目录为 Git 忽略的构建产物，重新构建命令如下。应用尚未做正式分发签名或公证，仅验证当前 Apple Silicon Mac。

开发需要 Node.js 24.14+、npm，首次安装依赖需要网络；已经生成的 `.app` 运行不需要 Node.js 或网络。

```sh
npm ci
npm run dev            # Vite 开发 UI + Electron 桌面窗口
npm start              # 构建后以本地资源启动 Electron
npm run package        # 生成本机 darwin/arm64 .app
npm test               # 类型检查、构建与数据/存储测试
npm run test:desktop   # Electron 桌面交互测试，需图形环境
```

首次安装会下载 Electron 运行文件。若 GitHub 下载失败，可按[官方安装说明](https://www.electronjs.org/docs/latest/tutorial/installation)使用镜像；保留官方校验，不切换为远程校验值：

```sh
ELECTRON_MIRROR='https://npmmirror.com/mirrors/electron/' ELECTRON_CUSTOM_DIR='{{ version }}' npm ci
ELECTRON_MIRROR='https://npmmirror.com/mirrors/electron/' ELECTRON_CUSTOM_DIR='{{ version }}' npm run package
```

`npm run dev` 的 UI 可热更新；主进程/preload 修改后需重启开发命令。`npm run preview` 仅用于网页界面预览，使用临时内存，不能代替桌面持久化验收。

源码启动使用 Git 忽略的 `data/local/deutschlab.sqlite`；独立 `.app` 使用 Electron 用户数据目录。测试设置独立临时目录，不读写个人档案。两种启动方式的档案不自动同步；设置页可查看实际存储位置。

## 文字大小设置

打开「个人设置 → 界面文字大小」，选择小号 12 px、标准 14 px、舒适大字 16 px、大号 18 px 或特大号 20 px。也可选择「自定义字号」，输入 12–24 的整数，按回车或点击「应用」。设置全局生效，在桌面应用关闭重开后保留；原来的标准/舒适大字设置继续兼容。标题、正文、辅助说明按比例缩放，品牌标识保留原样。

## Studio21 第一单元与专注模式

从「主线学习 → Lektion 1: Kaffee oder Tee?」进入。四个小节分别对应教材 16–17、18–19、20–21、22–23 页；24–30 页仍作为教材配套练习范围，31 页对应单元自测与总结。知识卡支持逐张学习、搜索与回看；小节练习和 9 题综合检测一次显示一道题，支持单选、匹配、填空和排序。练习时可以临时查看关联知识卡，已提交答案会独立保留。

录播课/教材状态由本人手动标记；知识卡浏览、答题和检测自动记录。练习正确率不自动改变 A1 能力树。第一单元专题链接引用现有 A1 框架 ID，仅说明涉及相关主题。

## 已实现与下一步

七个导航模块与原 DEMO 课程/专题/副本继续保留。A1 框架已有 8 板块、68 单元、207 条纲要，能力树独立保存双轴状态；本阶段增加 Studio21 第一单元学习内容和可复用专注页面。

“拓展学习”进入已有 A1 框架，“学习统计 → 德语能力树”进入同一专题的能力主题；“查看界面演示”保留旧 DEMO。启动校验并登记原有两份 A1 JSON 与新增第一单元内容包。数据库从 v1/v2 升至 v3 时保留旧设置和历史；A1 框架的学习覆盖默认未开始，能力运用默认未评估，目前仍没有手动点亮或能力认证入口。

后续可结合用户提供的教材原始材料核对页码与知识解释，再逐步接入其他 Studio21 单元。现有专题关联不自动表示专题内容已学完。

## 验证与限制

当前类型检查、构建、数据/迁移测试和桌面交互测试详见[第一单元与专注模式验收](docs/STUDIO21_FOCUS_ACCEPTANCE.md)；旧报告保留历史记录。演示浏览足迹不计为学习成绩。AI 评分、剧情、自动知识关联、备份恢复与同步仍未实现。
