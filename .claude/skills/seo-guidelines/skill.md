---
name: seo-guidelines
description: SEO 优化工作流程和规范。当用户需要优化页面 SEO、编写 meta 标签、进行关键词策略规划、分析页面竞争力或创建 AI 友好内容时使用此技能。
---

# SEO 优化规范指南

## 快速开始

SEO 优化遵循五步检查法，确保页面具备排名竞争力。

### 核心原则

- **一个关键词一个页面**: 每个页面只围绕一个核心关键词优化
- **关键词自然出现**: 避免堆砌，保持内容可读性
- **围绕主题扩展**: 内页围绕主站主题，形成内容矩阵

## 五步检查法

### Step 1: On-Page SEO 是否做好？

- 页面内容是否瞄准关键词编写
- 主题是否聚焦（不分散）
- Title、Description、H1 是否优化

**详细规范**: 见 [references/title-description-templates.md](references/title-description-templates.md)

### Step 2: 页面竞争力是否足够？

竞争力三要素：
- **链接权重**: 内链 + 外链带来的权重
- **内容信息量**: 是否有实质性、有价值的内容
- **用户体验**: 页面体验是否良好

### Step 3: 竞品分析

- 搜索目标关键词，分析当前排名页面
- 评估哪些结果是你当前竞争力可以超越的

### Step 4: 如何提升竞争力？

1. **提升权重**: 从高权重页面添加内链
2. **外链建设**: 获取外部链接
3. **内容质量**: 保障及时性、权威性、信息量

### Step 5: 时间积累

- 新关键词：新页面也能拿到排名
- 老关键词：需要 3-4 个月持续优化见效

## AI 友好内容创作

要被 AI 采纳和推荐，内容需要具备：

1. **经验修正**: 基于实践纠正常见误解
2. **边界条件**: 明确适用场景和限制
3. **反直觉结论**: 提供非显而易见的洞察

## 页面类型与关键词策略

### 模型页面
- 核心关键词: `{Model Name} API`
- 示例: `Nano Banana Pro API`

### 功能页面
- 核心关键词: `{Feature} API`
- 示例: `AI Image Generation API`

**详细策略**: 见 [references/content-matrix.md](references/content-matrix.md)

## 新页面上线检查

使用检查清单确保 SEO 完整性：

```bash
# 复制检查清单模板
cp assets/seo-checklist-template.md ./seo-checklist.md
```

## 参考资料

- **Title/Description 模板**: [references/title-description-templates.md](references/title-description-templates.md)
- **关键词研究指南**: [references/keyword-research.md](references/keyword-research.md)
- **内容矩阵策略**: [references/content-matrix.md](references/content-matrix.md)
