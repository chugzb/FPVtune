# 文件导出教程系统 - 交付文档

## 📋 项目概述

为 FPVtune 创建了完整的文件导出教程系统，帮助新手用户了解如何导出 Blackbox 日志和 CLI dump 配置文件。

**交付日期**: 2026-01-17

---

## ✅ 已完成功能

### 1. 核心组件 (100%)

#### 1.1 教程布局组件
- **文件**: `src/components/guides/tutorial-layout.tsx`
- **功能**:
  - 响应式教程页面布局
  - 快速参考模式切换（隐藏详细说明，只显示关键步骤）
  - 面包屑导航
  - localStorage 保存用户偏好
  - 支持国际化

#### 1.2 教程步骤组件
- **文件**: `src/components/guides/tutorial-step.tsx`
- **功能**:
  - 步骤编号和标题显示
  - 支持快速参考模式过滤
  - 清晰的视觉层次

#### 1.3 图片加载组件
- **文件**: `src/components/guides/tutorial-image.tsx`
- **功能**:
  - R2 图片加载和显示
  - 加载状态指示
  - 错误处理
  - 响应式图片
  - 无障碍支持（alt 文本）

#### 1.4 面包屑导航
- **文件**: `src/components/guides/breadcrumb.tsx`
- **功能**:
  - 层级导航显示
  - 支持链接和当前页面
  - 响应式设计

#### 1.5 快速参考切换按钮
- **文件**: `src/components/guides/quick-reference-toggle.tsx`
- **功能**:
  - 切换快速参考模式
  - 视觉反馈
  - 状态持久化

### 2. 教程页面 (100%)

#### 2.1 教程索引页面
- **文件**: `src/app/[locale]/guides/page.tsx`
- **功能**:
  - 显示所有可用教程
  - 按类别组织（入门指南）
  - 教程卡片（标题、描述、链接）
  - 面包屑导航
  - SEO 元数据

#### 2.2 Blackbox 导出教程
- **文件**: `src/app/[locale]/guides/export-blackbox/page.tsx`
- **功能**:
  - 什么是 Blackbox 日志说明
  - 3 个详细步骤（连接飞控、进入 Blackbox 标签、导出文件）
  - SD 卡和板载闪存两种导出方式
  - 支持的文件格式列表（.bbl、.bfl、.txt）
  - 常见问题排查（3 个问题）
  - 配套截图（3 张）
  - SEO 元数据

#### 2.3 CLI Dump 导出教程
- **文件**: `src/app/[locale]/guides/export-cli-dump/page.tsx`
- **功能**:
  - 什么是 CLI Dump 说明
  - 4 个详细步骤（连接飞控、进入 CLI、执行命令、保存文件）
  - CLI 命令示例
  - 文件命名建议
  - 常见问题排查（3 个问题）
  - 配套截图（2 张）
  - SEO 元数据

### 3. R2 存储配置 (100%)

#### 3.1 环境配置
- **文件**: `.env.local`
- **配置项**:
  ```
  STORAGE_REGION="auto"
  STORAGE_ACCOUNT_ID="[已配置]"
  STORAGE_ACCESS_KEY_ID="[已配置]"
  STORAGE_SECRET_ACCESS_KEY="[已配置]"
  STORAGE_BUCKET_NAME="[已配置]"
  STORAGE_PUBLIC_URL="https://pub-a43dfa5ee4c84353a038f71491cecbd9.r2.dev"
  ```

#### 3.2 Next.js 图片配置
- **文件**: `next.config.ts`
- **配置**: 已添加 R2 域名到 `images.remotePatterns`

#### 3.3 R2 客户端工具
- **文件**: `src/lib/r2-client.ts`
- **功能**: 提供 `getMediaUrl()` 函数生成 R2 图片 URL

### 4. R2 Storage Skill (100%)

#### 4.1 Skill 文档
- **文件**: `.claude/skills/r2-storage/SKILL.md`
- **内容**: 完整的使用文档和最佳实践

#### 4.2 上传脚本
- **文件**: `.claude/skills/r2-storage/scripts/upload.mjs`
- **功能**: 批量上传文件到 R2，自动生成文档

#### 4.3 列表脚本
- **文件**: `.claude/skills/r2-storage/scripts/list.mjs`
- **功能**: 列出 R2 存储桶中的所有文件

#### 4.4 删除脚本
- **文件**: `.claude/skills/r2-storage/scripts/delete.mjs`
- **功能**: 删除 R2 中的文件

#### 4.5 配置文件
- **文件**: `.claude/skills/r2-storage/upload-guides-config.json`
- **内容**: 教程图片上传配置

### 5. 教程图片资源 (100%)

已上传 7 个文件到 R2（总大小: 2.5 MB）：

#### Blackbox 教程图片
1. `fpvtune/guides/blackbox/step1-connect.png` (334 KB)
   - URL: https://pub-a43dfa5ee4c84353a038f71491cecbd9.r2.dev/fpvtune/guides/blackbox/step1-connect.png

2. `fpvtune/guides/blackbox/step2-connect.png` (341 KB)
   - URL: https://pub-a43dfa5ee4c84353a038f71491cecbd9.r2.dev/fpvtune/guides/blackbox/step2-connect.png

3. `fpvtune/guides/blackbox/step3-save.png` (302 KB)
   - URL: https://pub-a43dfa5ee4c84353a038f71491cecbd9.r2.dev/fpvtune/guides/blackbox/step3-save.png

4. `fpvtune/guides/blackbox/example-file.bbl` (1061 KB)
   - URL: https://pub-a43dfa5ee4c84353a038f71491cecbd9.r2.dev/fpvtune/guides/blackbox/example-file.bbl

#### CLI Dump 教程图片
5. `fpvtune/guides/cli-dump/step1-save.png` (163 KB)
   - URL: https://pub-a43dfa5ee4c84353a038f71491cecbd9.r2.dev/fpvtune/guides/cli-dump/step1-save.png

6. `fpvtune/guides/cli-dump/step2-save.png` (183 KB)
   - URL: https://pub-a43dfa5ee4c84353a038f71491cecbd9.r2.dev/fpvtune/guides/cli-dump/step2-save.png

7. `fpvtune/guides/cli-dump/example-file.txt` (28 KB)
   - URL: https://pub-a43dfa5ee4c84353a038f71491cecbd9.r2.dev/fpvtune/guides/cli-dump/example-file.txt

### 6. 国际化翻译 (100%)

#### 6.1 中文翻译
- **文件**: `messages/zh.json`
- **内容**:
  - 教程索引页面翻译
  - Blackbox 教程完整翻译
  - CLI Dump 教程完整翻译
  - 所有 UI 元素翻译

#### 6.2 英文翻译
- **文件**: `messages/en.json`
- **内容**:
  - 教程索引页面翻译
  - Blackbox 教程完整翻译
  - CLI Dump 教程完整翻译
  - 所有 UI 元素翻译

### 7. 测试验证 (100%)

#### 7.1 Playwright 测试
- ✅ 教程索引页面正常显示
- ✅ Blackbox 教程页面正常渲染（所有 3 张图片正常加载）
- ✅ CLI Dump 教程页面正常渲染（所有 2 张图片正常加载）
- ✅ 页面结构完整
- ✅ 面包屑导航正常工作
- ✅ 快速参考按钮正常工作
- ✅ 快速参考模式切换功能正常（隐藏详细说明，只显示关键步骤）

#### 7.2 图片路径修复
- ✅ 修复了 Blackbox 教程步骤 2 的图片路径
- ✅ 修复了 CLI Dump 教程步骤 1 和 2 的图片路径
- ✅ 所有图片 URL 与 R2 上传的文件名匹配

#### 7.3 Next.js 15 兼容性
- ✅ 修复了 params 需要 await 的问题
- ✅ 所有页面正常编译

### 7.4 调参向导集成测试
- ✅ 修复了"如何导出？"链接的 z-index 问题
- ✅ Blackbox 教程链接可以正常点击并在新标签页打开
- ✅ CLI Dump 教程链接可以正常点击并在新标签页打开
- ✅ 链接使用 `relative z-20` 和 `pointer-events-auto` 确保在文件上传 input 之上

---

## 📁 文件结构

```
src/
├── components/
│   └── guides/
│       ├── tutorial-layout.tsx       # 教程布局组件
│       ├── tutorial-step.tsx         # 教程步骤组件
│       ├── tutorial-image.tsx        # R2 图片组件
│       ├── breadcrumb.tsx            # 面包屑导航
│       └── quick-reference-toggle.tsx # 快速参考切换
│
├── app/
│   └── [locale]/
│       └── guides/
│           ├── page.tsx              # 教程索引页面
│           ├── export-blackbox/
│           │   └── page.tsx          # Blackbox 教程
│           └── export-cli-dump/
│               └── page.tsx          # CLI Dump 教程
│
└── lib/
    └── r2-client.ts                  # R2 客户端工具

messages/
├── zh.json                           # 中文翻译
└── en.json                           # 英文翻译

.claude/skills/r2-storage/
├── SKILL.md                          # Skill 文档
├── scripts/
│   ├── upload.mjs                    # 上传脚本
│   ├── list.mjs                      # 列表脚本
│   └── delete.mjs                    # 删除脚本
├── upload-guides-config.json         # 上传配置
└── uploaded-files.md                 # 已上传文件清单

.kiro/specs/file-export-guides/
├── requirements.md                   # 需求文档
├── design.md                         # 设计文档
├── tasks.md                          # 任务列表
└── DELIVERY.md                       # 本交付文档
```

---

## 🚀 使用说明

### 访问教程

1. **教程索引页面**: `/guides`
   - 显示所有可用教程
   - 按类别组织

2. **Blackbox 教程**: `/guides/export-blackbox`
   - 详细的 Blackbox 日志导出步骤
   - 配套截图和说明

3. **CLI Dump 教程**: `/guides/export-cli-dump`
   - 详细的 CLI Dump 导出步骤
   - 配套截图和说明

### 快速参考模式

用户可以点击页面右上角的"快速参考"按钮，切换到简化视图：
- 隐藏详细说明
- 只显示关键步骤
- 适合已经熟悉流程的用户

### 添加新教程

1. 在 `src/app/[locale]/guides/` 下创建新文件夹
2. 创建 `page.tsx` 文件
3. 使用 `TutorialLayout` 和 `TutorialStep` 组件
4. 在 `messages/zh.json` 和 `messages/en.json` 添加翻译
5. 在教程索引页面添加链接

### 上传新图片到 R2

使用 r2-storage skill：

```bash
# 1. 准备图片文件
# 2. 创建或更新配置文件
# 3. 运行上传脚本
node .claude/skills/r2-storage/scripts/upload.mjs
```

---

## 📊 任务完成情况

根据 `tasks.md` 中的任务列表：

### 已完成任务 (6/17)

- ✅ **任务 1**: 设置基础架构和共享组件
- ✅ **任务 2.1**: 创建 TutorialLayout 组件
- ✅ **任务 2.2**: 创建 TutorialStep 组件
- ✅ **任务 2.3**: 创建 TutorialImage 组件
- ✅ **任务 3**: 创建 Blackbox 导出教程页面（包括翻译）
- ✅ **任务 4**: 创建 CLI Dump 导出教程页面（包括翻译）

### 待完成任务 (11/17)

#### 调参向导集成
- ✅ **任务 12.1**: 在 StepUpload 组件添加教程链接（已完成）
  - 已在 Blackbox 上传区域添加"如何导出？"链接
  - 已在 CLI dump 上传区域添加"如何导出？"链接
  - 链接在新标签页打开
  - 修复了 z-index 问题，链接可以正常点击
- ⏳ **任务 12.2**: 编写导航链接单元测试

#### 测试任务
- ⏳ **任务 2.4**: 编写 TutorialLayout 属性测试
- ⏳ **任务 2.5**: 编写 TutorialImage 属性测试
- ⏳ **任务 4.3**: 编写语言切换属性测试

#### 反馈系统
- ⏳ **任务 6**: 实现反馈系统
  - 创建 FeedbackWidget 组件
  - 创建反馈 API 路由
  - 实现反馈服务层
  - 创建数据库表
  - 编写测试
- ⏳ **任务 7**: 集成反馈组件到教程页面

#### 错误引导
- ⏳ **任务 8**: 实现错误引导组件
  - 创建 ErrorGuidance 组件
  - 集成到调参向导的文件上传步骤
  - 编写测试

#### 欢迎提示
- ⏳ **任务 10**: 实现欢迎提示组件
  - 创建 WelcomePrompt 组件
  - 集成到调参向导
  - 添加翻译
  - 编写测试

#### 教程索引增强
- ⏳ **任务 11**: 实现教程索引页面增强
  - 创建 SearchBar 组件
  - 添加搜索功能
  - 添加缩略图
  - 编写测试

#### 调参向导集成
- ⏳ **任务 12**: 添加导航链接到调参向导
  - 在 StepUpload 组件添加教程链接
  - 编写测试

#### SEO 和端到端测试
- ⏳ **任务 14**: SEO 和元数据优化
- ⏳ **任务 16**: 端到端测试

---

## 🔧 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **国际化**: next-intl
- **样式**: Tailwind CSS
- **图标**: lucide-react
- **存储**: Cloudflare R2
- **测试**: Playwright (已验证)

---

## 📝 注意事项

### 1. 图片显示

所有教程图片已成功上传到 R2 并正常显示：
- Blackbox 教程：3 张截图 + 1 个示例文件
- CLI Dump 教程：2 张截图 + 1 个示例文件
- 图片路径已修复并验证通过
- 在生产环境中会正常显示

### 2. Next.js 15 兼容性

所有页面组件都已更新为 Next.js 15 的异步 params 模式：
```typescript
export default async function Page({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  // ...
}
```

### 3. 国际化

所有文本内容都已国际化，支持中英文切换。翻译键使用嵌套结构：
```typescript
const t = useTranslations('Guides.exportBlackbox');
t('title'); // 访问翻译
```

### 4. R2 存储结构

所有教程相关的媒体文件都存储在 `fpvtune/guides/` 目录下：
```
fpvtune/
└── guides/
    ├── blackbox/
    │   ├── step1-connect.png
    │   ├── step2-connect.png
    │   ├── step3-save.png
    │   └── example-file.bbl
    └── cli-dump/
        ├── step1-save.png
        ├── step2-save.png
        └── example-file.txt
```

---

## 🎯 下一步建议

### 优先级 1 - 核心功能完善

1. **实现反馈系统** (任务 6-7)
   - 让用户可以对教程提供反馈
   - 收集改进建议
   - 预计工作量: 4-6 小时

2. **实现错误引导** (任务 8)
   - 在调参向导中集成教程链接
   - 上传失败时引导用户查看教程
   - 预计工作量: 2-3 小时

3. **实现欢迎提示** (任务 10)
   - 首次访问调参向导时显示提示
   - 引导用户准备文件
   - 预计工作量: 2-3 小时

### 优先级 2 - 用户体验优化

4. **添加搜索功能** (任务 11)
   - 在教程索引页面添加搜索
   - 方便用户快速找到需要的教程
   - 预计工作量: 2-3 小时

5. **添加缩略图**
   - 为每个教程创建缩略图
   - 提升视觉吸引力
   - 预计工作量: 1-2 小时

### 优先级 3 - 测试和优化

6. **编写测试** (任务 2.4, 2.5, 4.3, 14.2, 16)
   - 属性测试
   - 单元测试
   - 端到端测试
   - 预计工作量: 6-8 小时

7. **SEO 优化** (任务 14)
   - 添加结构化数据
   - 优化元数据
   - 预计工作量: 2-3 小时

---

## 📞 支持

如有问题或需要进一步开发，请参考：
- 需求文档: `.kiro/specs/file-export-guides/requirements.md`
- 设计文档: `.kiro/specs/file-export-guides/design.md`
- 任务列表: `.kiro/specs/file-export-guides/tasks.md`
- R2 Storage Skill: `.claude/skills/r2-storage/SKILL.md`

---

**交付状态**: ✅ 核心功能已完成，可以投入使用

**完成度**: 35% (6/17 任务完成)

**建议**: 优先完成反馈系统和错误引导功能，以提升用户体验
