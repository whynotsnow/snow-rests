# 项目来源与维护边界

## 当前定位

`Snow Rests` 是独立维护的 Astro + Svelte 个人博客系统，当前的内容管线、服务层、Design System、浏览器运行时模块、
部署治理、Agent Workspace 和 sidecar planning 均以本仓库为唯一实现与维护边界。

项目早期源自 [Mizuki 8.2](https://github.com/LyraVoid/Mizuki/tree/8.2)，并吸收、演进了 8.2 之后的部分能力。
经过长期重构和优化后，已经与 Mizuki 原项目形成技术路线分叉。工程化重构规模接近原有 Mizuki 9.0.0 级别的目标，
但这不是对上游 Mizuki 9.0.0 发布状态的声明，也不是版本兼容承诺。Mizuki 是历史来源，不是当前项目的技术上游；
本项目不跟随 Mizuki 的版本、架构或发布节奏。

## 历史来源

- 历史来源：Mizuki 8.2。
- 当前项目：`whynotsnow/snow-rests`。
- 当前项目名称：`Snow Rests`。
- 当前 package：`snow-rests`，独立版本线从 `1.0.0` 开始。
- 正式说明：`Where thoughts settle and stories remain.` / `雪憩，让思绪沉淀，让故事留下`。
- 当前 Git remote：只使用项目自己的 `origin`；不保留日常同步用的 `upstream`。

历史 Git 提交保留，用于来源追溯、许可证审计和理解架构演进；本项目不会通过重写历史来抹除早期来源。

## 架构分叉

当前项目与原始 Mizuki 的差异已经达到技术路线分叉，主要体现在：

- **内容架构不同**：从页面直接读取内容，变成 `src/services/core`、Content Store、Route Index、Taxonomy 和详情渲染队列组成的内容工程管线。
- **页面架构不同**：从传统主题页面和 Widget 组织，变成薄路由、页面服务、View Model 和展示组件分层。
- **运行时架构不同**：Activity Center、Floating Tools、Music Player、Live2D Companion、Shell Panels 等已经形成独立 runtime modules。
- **视觉架构不同**：已经形成独立的 Design System，包括 tokens、themes、patterns 和 compatibility layer。
- **部署体系不同**：已经接入 Snow Base Admin、Candidate、selected-artifact、artifact digest、approval 和 run-bound smoke，不再是普通博客主题的部署模式。
- **内容和规划治理不同**：外部内容仓库、Agent Workspace Spec、impact-based testing、sidecar planning 都属于本项目自己的工程系统。
- **维护目标不同**：上游面向通用主题，当前项目面向个人站点、长期维护和 Coding Agent 协作。

这些差异来自 Mizuki 8.2 基线之后的持续工程化演进，而不是简单的配置或样式调整。

因此，新代码必须遵守本仓库的服务层、Design System、runtime module 和 sidecar 边界；不能因为历史来源而直接恢复
Mizuki 的 Widget placement、旧配置模式或页面逻辑。

## 许可证与归属

仓库继续保留适用的 [Apache License 2.0](../../LICENSE) 和 [MIT License](../../LICENSE.MIT) 文件。它们的适用范围
应以具体文件来源和原始许可证要求为准：

- 不删除或覆盖早期来源所需的版权与许可证声明。
- 新增的项目代码、配置、文档、内容和站点资产应按其实际作者和许可证归属维护。
- 不把个人内容、私有配置、站点数据或本项目新增实现误标为 Mizuki 内容。
- 参考外部项目实现前，先检查许可证、版权声明和修改义务，再按本项目架构重新实现。

本文件是项目维护边界说明，不替代法律意见；涉及再分发或许可证冲突时，应进行单独的许可证审计。

## 维护政策

1. 不从 Mizuki 上游 merge、rebase 或批量同步代码。
2. 外部参考只通过逐项审计和重新实现进入本项目。
3. 保持当前服务层、Design System 和 runtime module 边界优先于历史目录兼容。
4. 通过本仓库的 CI、impact-based testing、Agent Workspace validation 和 sidecar 记录变更。
5. 版本、架构、部署和内容行为以本仓库文档和实现为准。
