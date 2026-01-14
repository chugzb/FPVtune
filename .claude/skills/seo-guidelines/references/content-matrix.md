# 内容矩阵策略

## 主站主题

**Ruxa.ai**: AI API Platform

所有内页都应围绕这个主题扩展，形成内容矩阵。

## 内容矩阵结构

```
主站 (AI API Platform)
├── 模型页面 (Model APIs)
│   ├── nano-banana-pro (Image Generation API)
│   ├── sora-2 (Video Generation API)
│   ├── gpt-4o-image (Multimodal API)
│   └── ... (其他模型)
│
├── 功能页面 (Feature Pages)
│   ├── text-to-image (Text to Image API)
│   ├── text-to-video (Text to Video API)
│   ├── image-editing (Image Editing API)
│   └── ... (其他功能)
│
├── 资源页面 (Resource Pages)
│   ├── pricing (API Pricing)
│   ├── docs (API Documentation)
│   ├── tutorials (API Tutorials)
│   └── blog (API Use Cases)
│
└── 对比页面 (Comparison Pages)
    ├── nano-banana-vs-dalle (Model Comparison)
    └── ... (其他对比)
```

## 内链策略

### 权重传递路径

```
首页 (最高权重)
  ↓
频道页 (高权重)
  ↓
内容页 (中等权重)
  ↓
详情页 (低权重)
```

### 内链规则

1. **从高权重页面指向目标页面**
   - 首页 → 核心模型页面
   - 频道页 → 相关功能页面

2. **相关内容互链**
   - 模型页面 ↔ 功能页面
   - 功能页面 ↔ 教程页面

3. **锚文本优化**
   - 使用目标关键词作为锚文本
   - 避免"点击这里"等通用文本

### 示例

**首页内链**:
```html
<a href="/models/nano-banana-pro">Nano Banana Pro API</a>
<a href="/features/text-to-image">Text to Image API</a>
```

**模型页面内链**:
```html
<a href="/features/text-to-image">Learn more about Text to Image</a>
<a href="/docs/nano-banana-pro">View Documentation</a>
```

## 外链建设策略

### 优质外链来源

1. **技术博客**: Dev.to, Medium, Hashnode
2. **开发者社区**: GitHub, Stack Overflow
3. **行业媒体**: TechCrunch, Product Hunt
4. **合作伙伴**: 相关 API 平台、工具网站

### 外链建设方法

1. **内容营销**
   - 发布高质量技术文章
   - 分享使用案例和教程

2. **社区参与**
   - 回答相关问题
   - 分享有价值的资源

3. **合作交换**
   - 与相关网站交换链接
   - 参与行业活动

### 外链质量评估

- **相关性**: 链接来源与主题相关
- **权威性**: 来源网站的域名权重
- **自然性**: 链接获取方式自然

## 内容更新策略

### 更新频率

- **核心页面**: 每月更新一次
- **博客文章**: 每周发布 1-2 篇
- **文档页面**: 随产品更新而更新

### 更新内容

1. **及时性**
   - 更新最新的模型信息
   - 添加新功能说明

2. **权威性**
   - 引用官方数据
   - 添加实际案例

3. **信息量**
   - 补充详细说明
   - 添加使用示例

## 持续优化任务

- [ ] 定期更新内容保持及时性
- [ ] 监控关键词排名变化
- [ ] 分析竞品页面，找差距
- [ ] 持续建设外链（3-4个月见效）
- [ ] 补充经验修正、边界条件、反直觉结论类内容
