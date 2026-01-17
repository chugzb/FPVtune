# 需求文档

## 简介

FPVtune 是一个 AI 驱动的 FPV 无人机调参工具，需要用户上传 Blackbox 日志文件和 CLI dump 文件进行分析。许多新手用户不知道如何导出这些必要的文件。本功能旨在创建完整的教程系统，包括详细的导出教程页面、教程索引、智能错误引导和用户反馈机制，指导用户完成文件导出过程，降低使用门槛，提高用户成功率和满意度。

## 术语表

- **System**: 文件导出教程系统
- **Blackbox_Log**: 飞控记录的飞行数据日志文件
- **CLI_Dump**: 通过命令行界面导出的飞控配置文件
- **Betaflight_Configurator**: 用于配置和管理飞控的桌面应用程序
- **Tutorial_Page**: 包含步骤说明、示例和故障排除的教程页面
- **Guides_Index_Page**: 列出所有可用教程的索引页面
- **User**: 使用 FPVtune 的 FPV 无人机操作者
- **Navigation_Link**: 从调参向导指向教程页面的链接
- **Feedback_Component**: 收集用户对教程反馈的组件
- **Welcome_Prompt**: 首次使用时显示的引导提示
- **Quick_Reference_Mode**: 只显示关键步骤的简洁模式
- **R2**: Cloudflare R2 对象存储服务

## 需求

### 需求 1: Blackbox 日志导出教程页面

**用户故事:** 作为一个 FPV 新手用户，我想要了解如何从飞控导出 Blackbox 日志文件，以便我可以上传到 FPVtune 进行分析。

#### 验收标准

1. WHEN 用户访问 `/guides/export-blackbox` 路径 THEN THE System SHALL 显示 Blackbox 日志导出教程页面
2. THE Tutorial_Page SHALL 包含 Blackbox 日志的定义和用途说明
3. THE Tutorial_Page SHALL 包含在 Betaflight 中启用 Blackbox 记录的步骤说明
4. THE Tutorial_Page SHALL 包含从 SD 卡导出日志文件的步骤说明
5. THE Tutorial_Page SHALL 包含从板载闪存导出日志文件的步骤说明
6. THE Tutorial_Page SHALL 列出支持的文件格式（.bbl, .bfl, .txt）
7. THE Tutorial_Page SHALL 包含常见问题排查部分
8. THE Tutorial_Page SHALL 包含面包屑导航组件

### 需求 2: CLI Dump 导出教程页面

**用户故事:** 作为一个 FPV 新手用户，我想要了解如何导出 CLI dump 配置文件，以便我可以上传到 FPVtune 进行配置分析。

#### 验收标准

1. WHEN 用户访问 `/guides/export-cli-dump` 路径 THEN THE System SHALL 显示 CLI dump 导出教程页面
2. THE Tutorial_Page SHALL 包含 CLI dump 的定义和用途说明
3. THE Tutorial_Page SHALL 包含连接 Betaflight Configurator 的步骤说明
4. THE Tutorial_Page SHALL 包含访问 CLI 标签的步骤说明
5. THE Tutorial_Page SHALL 包含执行 `dump` 命令的步骤说明
6. THE Tutorial_Page SHALL 包含保存输出为 .txt 文件的步骤说明
7. THE Tutorial_Page SHALL 包含常见问题排查部分
8. THE Tutorial_Page SHALL 包含面包屑导航组件

### 需求 3: 国际化支持

**用户故事:** 作为一个用户，我想要以我的首选语言查看教程内容，以便我可以更好地理解说明。

#### 验收标准

1. THE System SHALL 支持中文和英文两种语言
2. WHEN 用户切换语言 THEN THE Tutorial_Page SHALL 显示相应语言的内容
3. THE System SHALL 使用 next-intl 框架实现国际化
4. THE System SHALL 将翻译文件存储在 `/messages` 目录中

### 需求 4: 响应式设计

**用户故事:** 作为一个移动设备用户，我想要在手机或平板上查看教程，以便我可以在操作飞控时参考说明。

#### 验收标准

1. THE Tutorial_Page SHALL 在桌面设备上正确显示
2. THE Tutorial_Page SHALL 在平板设备上正确显示
3. THE Tutorial_Page SHALL 在移动设备上正确显示
4. WHEN 屏幕尺寸改变 THEN THE Tutorial_Page SHALL 自动调整布局

### 需求 5: 导航集成

**用户故事:** 作为一个用户，我想要在上传文件时快速访问导出教程，以便我可以学习如何获取所需文件。

#### 验收标准

1. THE System SHALL 在调参向导的 Blackbox 上传步骤中显示"如何导出 Blackbox 日志"链接
2. THE System SHALL 在调参向导的 CLI dump 上传步骤中显示"如何导出 CLI dump"链接
3. WHEN 用户点击导出教程链接 THEN THE System SHALL 在新标签页中打开相应的教程页面
4. THE Navigation_Link SHALL 具有清晰的视觉样式以吸引用户注意

### 需求 6: 内容结构

**用户故事:** 作为一个用户，我想要看到结构清晰的教程内容，以便我可以快速找到我需要的信息。

#### 验收标准

1. THE Tutorial_Page SHALL 使用标题层次结构组织内容
2. THE Tutorial_Page SHALL 使用编号步骤显示操作流程
3. THE Tutorial_Page SHALL 为截图预留占位符区域
4. THE Tutorial_Page SHALL 使用代码块显示命令示例
5. THE Tutorial_Page SHALL 使用警告或提示框突出显示重要信息

### 需求 7: 视觉元素

**用户故事:** 作为一个视觉学习者，我想要看到截图和示例，以便我可以更容易地理解步骤。

#### 验收标准

1. THE Tutorial_Page SHALL 为每个主要步骤包含截图占位符
2. THE Tutorial_Page SHALL 使用图标增强视觉吸引力
3. THE Tutorial_Page SHALL 使用一致的视觉样式与项目设计系统匹配
4. THE Tutorial_Page SHALL 为截图提供替代文本以支持无障碍访问

### 需求 8: SEO 和元数据

**用户故事:** 作为一个通过搜索引擎寻找帮助的用户，我想要能够找到这些教程页面，以便我可以解决我的问题。

#### 验收标准

1. THE Tutorial_Page SHALL 包含适当的页面标题
2. THE Tutorial_Page SHALL 包含描述性的 meta description
3. THE Tutorial_Page SHALL 使用语义化的 HTML 标签
4. THE Tutorial_Page SHALL 包含结构化数据标记（如适用）

### 需求 9: 媒体资源管理

**用户故事:** 作为系统管理员，我想要确保所有媒体资源正确存储在 Cloudflare R2，以便优化性能和降低成本。

#### 验收标准

1. THE System SHALL 将所有教程截图存储在 Cloudflare R2
2. THE System SHALL 将所有教程视频存储在 Cloudflare R2
3. THE System SHALL NOT 将媒体文件存储在 public 目录
4. THE Tutorial_Page SHALL 使用 R2 URL 加载所有图片和视频
5. THE System SHALL 为媒体资源提供适当的缓存策略
6. THE System SHALL 为图片提供响应式尺寸和格式优化

### 需求 10: 智能错误引导

**用户故事:** 作为一个遇到上传错误的用户，我想要获得相关的帮助链接，以便我可以快速解决问题。

#### 验收标准

1. WHEN 用户上传 Blackbox 文件失败 THEN THE System SHALL 显示"如何导出 Blackbox 日志"教程链接
2. WHEN 用户上传 CLI dump 文件失败 THEN THE System SHALL 显示"如何导出 CLI dump"教程链接
3. WHEN 文件格式不正确 THEN THE System SHALL 显示支持的文件格式说明和教程链接
4. THE System SHALL 在错误消息中使用清晰的视觉样式突出显示帮助链接
5. THE System SHALL 记录常见错误类型以优化教程内容

### 需求 11: 教程导航和索引

**用户故事:** 作为一个用户，我想要浏览所有可用的教程，以便我可以找到我需要的帮助。

#### 验收标准

1. THE System SHALL 提供 `/guides` 索引页面
2. THE Guides_Index_Page SHALL 列出所有可用的教程
3. THE Guides_Index_Page SHALL 为每个教程显示标题、描述和缩略图
4. THE Guides_Index_Page SHALL 按类别组织教程（入门、高级、故障排除等）
5. THE Guides_Index_Page SHALL 包含搜索功能
6. THE Guides_Index_Page SHALL 支持国际化
7. THE Guides_Index_Page SHALL 包含面包屑导航

### 需求 12: 用户反馈机制

**用户故事:** 作为产品团队成员，我想要收集用户对教程的反馈，以便我可以持续改进内容质量。

#### 验收标准

1. THE Tutorial_Page SHALL 在底部包含反馈组件
2. THE Feedback_Component SHALL 询问"这个教程有帮助吗？"
3. THE Feedback_Component SHALL 提供"有帮助"和"没帮助"选项
4. WHEN 用户选择"没帮助" THEN THE System SHALL 显示可选的文本框收集详细反馈
5. THE System SHALL 将反馈数据存储到数据库
6. THE System SHALL 防止同一用户重复提交反馈（使用 session 或 cookie）
7. THE System SHALL 在用户提交反馈后显示感谢消息

### 需求 13: 首次使用引导

**用户故事:** 作为一个首次使用 FPVtune 的用户，我想要获得引导提示，以便我可以快速了解如何准备所需文件。

#### 验收标准

1. WHEN 用户首次访问调参向导 THEN THE System SHALL 显示欢迎提示
2. THE Welcome_Prompt SHALL 简要说明需要准备的文件
3. THE Welcome_Prompt SHALL 包含指向导出教程的链接
4. THE System SHALL 使用 cookie 或 localStorage 记录用户已查看引导
5. THE System SHALL 提供"不再显示"选项
6. THE Welcome_Prompt SHALL 使用模态框或侧边栏形式显示
7. THE Welcome_Prompt SHALL 支持国际化

### 需求 14: 快速参考版本

**用户故事:** 作为一个有经验的用户，我想要查看简洁版的教程，以便我可以快速找到关键步骤和命令。

#### 验收标准

1. THE Tutorial_Page SHALL 提供"快速参考"切换选项
2. WHEN 用户启用快速参考模式 THEN THE System SHALL 只显示关键步骤和命令
3. THE Quick_Reference_Mode SHALL 隐藏详细说明和截图
4. THE Quick_Reference_Mode SHALL 使用紧凑的布局
5. THE System SHALL 使用 localStorage 记住用户的偏好设置
6. THE Quick_Reference_Mode SHALL 包含所有必要的命令和参数
7. THE Quick_Reference_Mode SHALL 提供"查看完整教程"链接
