# 启动核验记录

核验日期：2026-10-13（Asia/Shanghai）。范围：当前项目目录与用户明确提供的文件，不扫描其他私人目录。

## 资料与仓库

| 项目 | 已知事实 |
| --- | --- |
| 工作区 | DeutschLab 项目根目录（本机路径因设备而异） |
| 初始仓库 | 只有 `.git`；分支 `main`，尚无提交，无应用或历史资料 |
| 本次资料 | 已读取 Downloads 中用户指定的 DeutschLab 项目启动 Prompt，原文保存在 [sources](sources/PROJECT_STARTUP_PROMPT.md) |
| 项目级约束 | 当前目录及已检查父目录未发现 `AGENTS.md` |
| 产品报告、阶段报告、课程目录、自学框架 | 当前仓库不存在；未声称已阅读，暂无冲突可比对 |
| 教材及录播讲义 | 未提供；没有抓取或生成声称来自 Studio21 的章节 |

## 实测开发环境

| 项目 | 实测结果 | 解释 |
| --- | --- | --- |
| 系统 | macOS 27.0，build 26A428；Darwin，arm64 | 当前 Apple Silicon Mac；版本仅记录系统返回值 |
| Node.js | v24.14.0 | 开发机 Node，不等同 Electron 自带 Node |
| npm | 11.9.0 | 可作为建议包管理器 |
| Python | 3.14.0 | 可用于文档/数据辅助，应用运行不拟依赖 Python |
| SQLite CLI | 3.54.0 | 命令可运行；不证明未来应用驱动已兼容 |
| Xcode 路径 | `/Applications/Xcode.app/Contents/Developer` | `xcode-select -p` 返回；编译、许可和签名尚未验证 |
| Swift | `/usr/bin/swift` 路径存在 | 未编译 SwiftUI 应用 |
| Rust / Cargo | 当前 PATH 未找到 | 不断言整台机器完全未安装；Tauri 实施前需处理 |
| Git | `/usr/bin/git`，状态命令可运行 | 未提交、建分支或修改 Git 历史 |

技术事实已查阅官方 Electron、Tauri、SQLite、SwiftUI 文档；引用见[架构](ARCHITECTURE.md)。未安装依赖，未验证下载、Electron 启动、SQLite 驱动、macOS 打包或签名。

## 本轮交付和检查

本轮创建 README、六份核心/核验文档、验收说明、内容说明、启动资料副本与 `.gitignore`。架构目录为下一阶段建议，不代表已有代码。

文档检查通过：10 份 Markdown 文件，17 个本地链接均有效；概念模型覆盖全部 16 个必需概念（含 ContentVersion 和 Revision）；S0–S8 与 A01–A15 均已列出；原文副本 SHA-256 与用户指定文件一致；生成文档代码围栏成对且无行末空格。Mermaid 图已人工核对关系，尚未进行渲染器验证。

应用离线、持久化、正式剧情隔离、恢复和课程复用的功能验收均未执行，见[验收说明](ACCEPTANCE.md)。

## 后续核验顺序

1. 用户确认技术建议后，在 S1 验证依赖、arm64 桌面启动、SQLite 驱动和本地打包。
2. 同一 S1 验证打包产物断网打开和用户记录关闭重开保留。
3. 提供材料后核对真实章节与框架映射，并记录与当前基线的差异。
