# 开发规范指南

## 语言和交流

- 使用中文回答所有问题
- 新建内容不使用 emoji
- 保持专业简洁

## 部署流程

1. 开发前检查端口占用，必要时释放
2. 执行 `pnpm dev` 启动开发服务器
3. 部署后使用 Playwright 进行功能验证

## 测试要求

- 测试前确保 3000 端口可用，被占用时需先释放
- 每次修改后必须进行验证
- 验证通过后才能确认修改完成
- 必要时编写单元测试和集成测试

## 代码质量

- 代码整洁精简
- 使用 TypeScript 确保类型安全
- 遵循最佳实践

## 工具使用规范

### 可用工具

| 工具 | 用途 |
|-----|-----|
| sequential-thinking | 复杂问题拆解、方案设计、根因分析 |
| playwright | 浏览器测试、UI 验证、访问网站获取内容 |
| shadcn-ui | 查询组件文档、安装组件 |
| context7 | 查询最新库/框架官方文档 |
| lighthouse | 网站性能/SEO/无障碍审计 |

### 使用原则

- 查技术文档：优先使用 context7 查询框架和库的最新文档
- 查组件用法：使用 shadcn-ui 查询和安装 UI 组件
- 访问网站：使用 playwright 获取完整内容和动态信息
- 性能检查：使用 lighthouse 进行性能、SEO、无障碍审计
- 复杂分析：使用 sequential-thinking 进行多步推理

## Skills 使用规范

### 常用 Skills

| Skill | 用途 |
|-------|-----|
| ruxa-dev | Ruxa 项目开发（页面、组件、API） |
| cf-deploy | Cloudflare 部署 |
| r2-storage | R2 存储和文件上传 |
| seo-guidelines | SEO 优化和关键词策略 |
| frontend-design | 前端界面设计 |
| web-artifacts-builder | 复杂 Web 组件构建 |
| webapp-testing | Web 应用测试 |
| mcp-builder | 创建 MCP 服务器 |
| doc-coauthoring | 文档协作编写 |

### 使用流程

1. 收到任务后先查看可用 skills 列表
2. 匹配到相关 skill 时立即加载
3. 按照 skill 中的指引完成任务

### 信息搜索流程

1. 技术问题先用 context7 查官方文档
2. 需要访问网站时用 playwright 获取完整内容
3. 可以用 web search 找目标链接，然后用 playwright 查看详情

## 调研规范

| 调研类型 | 方法 |
|---------|-----|
| 产品调研 | 使用 playwright 访问官网，获取产品信息、定价、功能列表 |
| 技术选型 | 用 context7 查看最新文档，对比不同方案的 API 和特性 |
| 竞品分析 | 用 playwright 访问竞品网站，截图保存关键页面 |
| 性能对比 | 用 lighthouse 审计不同产品的性能指标 |

调研输出：整理成结构化文档，包含截图、数据对比、结论建议

## 国际化

- 新功能必须支持国际化
- 使用 next-intl 框架
- 翻译文件放在 `/messages` 目录，格式为 `{locale}.json`
- 使用 JSON 嵌套结构组织翻译键（如 `Common.login`）
- 组件中使用 `useTranslations()` hook 获取翻译
- 服务端使用 `getLocale()` 获取当前语言

## 数据库

- 修改表结构前先检查兼容性
- 确保数据安全

## 静态资源

- 所有视频和图片存放在 Cloudflare R2
- 不要将媒体文件放在 public 目录

## 开发实践

- 优先使用包管理器
- 实现错误处理和用户反馈
- 遵循响应式设计

## 文档规范

- 调研报告使用 Markdown 格式
- 包含必要的截图和数据对比
- 技术方案要有清晰的实施步骤
- 重要决策要记录原因和权衡

## 项目规划

- 复杂需求先分析再实施
- 大型功能创建详细实施计划
