# 页脚页面实施方案

## 需求分析

需要实现以下页面：
1. About Us（关于我们）
2. FAQ（常见问题）
3. Privacy Policy（隐私政策）✅ 已存在
4. Refund & Dispute Policy（退款与争议政策）
5. Contact Us（联系我们）
6. Terms of Service（用户条款）✅ 已存在
7. Cookie Policy（Cookie政策）✅ 已存在

## 现有架构分析

### 1. 已有页面结构
- **位置**: `src/app/[locale]/(marketing)/(legal)/`
- **已实现**: Privacy Policy, Terms of Service, Cookie Policy
- **实现方式**:
  - 使用 `CustomPage` 组件渲染 MDX 内容
  - 内容存储在 `content/pages/` 目录
  - 通过 `getPage()` 函数读取内容
  - 支持中英文国际化

### 2. 页脚配置
- **配置文件**: `src/config/footer-config.tsx`
- **当前结构**:
  ```
  - Product (产品)
    - Features
    - Pricing
    - FAQ
  - Resources (资源)
    - Blog
    - Docs
    - Changelog
    - Roadmap
  - Company (公司)
    - About
    - Contact
    - Waitlist
  - Legal (法律)
    - Cookie Policy ✅
    - Privacy Policy ✅
    - Terms of Service ✅
  ```

### 3. 路由配置
- **文件**: `src/routes.ts`
- **已定义路由**:
  - `/cookie` → Cookie Policy ✅
  - `/privacy` → Privacy Policy ✅
  - `/terms` → Terms of Service ✅
  - `/#faq` → FAQ (锚点)
  - `/about` → About (未实现)
  - `/contact` → Contact (未实现)

## 实施方案

### 方案 A: 统一使用 MDX 内容管理（推荐）

**优点**:
- 与现有架构一致
- 内容易于维护和更新
- 支持富文本格式
- SEO 友好
- 支持版本控制

**实施步骤**:

#### 1. 创建缺失的页面路由

```
src/app/[locale]/(marketing)/(legal)/
├── about/
│   └── page.tsx (新建)
├── contact/
│   └── page.tsx (新建)
├── refund/
│   └── page.tsx (新建)
├── faq/
│   └── page.tsx (新建)
├── cookie/ ✅
├── privacy/ ✅
└── terms/ ✅
```

#### 2. 创建 MDX 内容文件

```
content/pages/
├── about-us.mdx (新建)
├── about-us.zh.mdx (新建)
├── contact-us.mdx (新建)
├── contact-us.zh.mdx (新建)
├── refund-policy.mdx (新建)
├── refund-policy.zh.mdx (新建)
├── faq.mdx (新建)
├── faq.zh.mdx (新建)
├── cookie-policy.mdx ✅
├── cookie-policy.zh.mdx ✅
├── privacy-policy.mdx ✅
├── privacy-policy.zh.mdx ✅
├── terms-of-service.mdx ✅
└── terms-of-service.zh.mdx ✅
```

#### 3. 更新路由配置

**src/routes.ts**:
```typescript
export enum Routes {
  // ... 现有路由

  // 新增路由
  About = '/about',
  Contact = '/contact',
  FAQ = '/faq',
  RefundPolicy = '/refund',

  // 已存在
  CookiePolicy = '/cookie',
  PrivacyPolicy = '/privacy',
  TermsOfService = '/terms',
}
```

#### 4. 更新页脚配置

**src/config/footer-config.tsx**:
```typescript
{
  title: t('legal.title'),
  items: [
    {
      title: t('legal.items.privacyPolicy'),
      href: Routes.PrivacyPolicy,
      external: false,
    },
    {
      title: t('legal.items.termsOfService'),
      href: Routes.TermsOfService,
      external: false,
    },
    {
      title: t('legal.items.cookiePolicy'),
      href: Routes.CookiePolicy,
      external: false,
    },
    {
      title: t('legal.items.refundPolicy'), // 新增
      href: Routes.RefundPolicy,
      external: false,
    },
  ],
}
```

#### 5. 添加翻译

**messages/en.json**:
```json
{
  "Marketing": {
    "footer": {
      "legal": {
        "title": "Legal",
        "items": {
          "privacyPolicy": "Privacy Policy",
          "termsOfService": "Terms of Service",
          "cookiePolicy": "Cookie Policy",
          "refundPolicy": "Refund & Dispute Policy"
        }
      }
    }
  }
}
```

**messages/zh.json**:
```json
{
  "Marketing": {
    "footer": {
      "legal": {
        "title": "法律",
        "items": {
          "privacyPolicy": "隐私政策",
          "termsOfService": "用户条款",
          "cookiePolicy": "Cookie政策",
          "refundPolicy": "退款与争议政策"
        }
      }
    }
  }
}
```

### 方案 B: FAQ 使用专门组件

**考虑因素**:
- FAQ 可能需要折叠/展开交互
- 可能需要搜索功能
- 可能需要分类

**实施方式**:
1. 创建 `src/components/faq/faq-section.tsx` 组件
2. 使用 Accordion 组件（shadcn/ui）
3. FAQ 数据存储在翻译文件或单独的配置文件

### 方案 C: Contact 使用表单组件

**考虑因素**:
- 需要表单验证
- 需要发送邮件功能
- 可能需要验证码

**实施方式**:
1. 创建 `src/components/contact/contact-form.tsx`
2. 使用 React Hook Form + Zod 验证
3. 集成邮件服务（Resend/SendGrid）

## 推荐实施顺序

### Phase 1: 基础页面（1-2小时）
1. ✅ Privacy Policy (已完成)
2. ✅ Terms of Service (已完成)
3. ✅ Cookie Policy (已完成)
4. 创建 About Us 页面
5. 创建 Refund Policy 页面

### Phase 2: 交互页面（2-3小时）
6. 创建 FAQ 页面（带折叠功能）
7. 创建 Contact 页面（带表单）

### Phase 3: 优化（1小时）
8. 添加面包屑导航
9. 优化 SEO 元数据
10. 添加结构化数据（JSON-LD）

## 内容建议

### About Us 页面内容结构
```markdown
# About FPVTune

## Our Mission
- 为什么创建 FPVTune
- 解决什么问题

## Our Story
- 团队背景
- 发展历程

## Our Technology
- AI 技术说明
- 数据安全保障

## Contact Information
- 邮箱
- 社交媒体
```

### FAQ 页面内容结构
```markdown
# Frequently Asked Questions

## General Questions
- What is FPVTune?
- How does it work?
- Is it free?

## Technical Questions
- What file formats are supported?
- Which Betaflight versions are compatible?
- How accurate is the AI analysis?

## Account & Billing
- How do I create an account?
- What payment methods do you accept?
- Can I get a refund?

## Troubleshooting
- Upload failed
- Analysis error
- CLI commands not working
```

### Refund Policy 页面内容结构
```markdown
# Refund & Dispute Policy

## Refund Policy
- 退款条件
- 退款流程
- 退款时间

## Dispute Resolution
- 争议处理流程
- 联系方式
- 仲裁条款

## Exceptions
- 不可退款情况
```

### Contact Us 页面内容结构
```markdown
# Contact Us

## Get in Touch
- 联系表单
- 邮箱地址
- 社交媒体链接

## Support
- 技术支持邮箱
- 响应时间说明

## Business Inquiries
- 商务合作邮箱
```

## 技术实现细节

### 1. 页面模板代码

```typescript
// src/app/[locale]/(marketing)/(legal)/about/page.tsx
import { CustomPage } from '@/components/page/custom-page';
import { generatePageMetadata } from '@/lib/metadata';
import { getPage } from '@/lib/page/get-page';
import type { NextPageProps } from '@/types/next-page-props';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { notFound } from 'next/navigation';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata | undefined> {
  const { locale } = await params;
  const page = await getPage('about-us', locale);

  if (!page) {
    return {};
  }

  return generatePageMetadata({
    title: page.title,
    description: page.description,
    path: `/${locale}/about`,
    locale,
  });
}

export default async function AboutPage(props: NextPageProps) {
  const params = await props.params;
  if (!params) {
    notFound();
  }

  const locale = params.locale as string;
  const page = await getPage('about-us', locale);

  if (!page) {
    notFound();
  }

  return (
    <CustomPage
      title={page.title}
      description={page.description}
      date={page.date}
      content={page.body}
    />
  );
}
```

### 2. Content Collections 配置

需要在 `content-collections.ts` 中确保 pages 集合包含新页面：

```typescript
const pages = defineCollection({
  name: 'page',
  directory: 'content/pages',
  include: '**/*.mdx',
  schema: (z) => ({
    title: z.string(),
    description: z.string(),
    date: z.string().optional(),
  }),
  transform: async (page, ctx) => {
    const body = await ctx.cache(page.content);
    const slug = page._meta.path;

    return {
      ...page,
      slug,
      body,
    };
  },
});
```

## SEO 优化建议

### 1. 元数据优化
- 每个页面独立的 title 和 description
- 使用 canonical URL
- 添加 hreflang 标签

### 2. 结构化数据
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is FPVTune?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "FPVTune is an AI-powered..."
      }
    }
  ]
}
```

### 3. 内部链接
- 在相关页面之间添加链接
- 在首页添加指向重要页面的链接
- 在页脚保持一致的链接结构

## 测试清单

- [ ] 所有页面在中英文下正常显示
- [ ] 页脚链接正确跳转
- [ ] 移动端响应式正常
- [ ] SEO 元数据正确生成
- [ ] 面包屑导航正常工作
- [ ] 表单验证和提交正常（Contact 页面）
- [ ] FAQ 折叠展开正常工作
- [ ] 页面加载性能良好

## 预估工作量

| 任务 | 预估时间 |
|------|---------|
| About Us 页面 | 30分钟 |
| Refund Policy 页面 | 30分钟 |
| FAQ 页面（基础版） | 1小时 |
| FAQ 页面（交互版） | 2小时 |
| Contact 页面（基础版） | 1小时 |
| Contact 页面（表单版） | 2-3小时 |
| 翻译和内容编写 | 2-3小时 |
| 测试和优化 | 1小时 |
| **总计** | **8-12小时** |

## 下一步行动

1. 确认内容需求（是否需要我帮忙编写内容？）
2. 确认功能需求（FAQ 是否需要交互？Contact 是否需要表单？）
3. 开始实施 Phase 1（基础页面）
4. 逐步完成 Phase 2 和 Phase 3

请告诉我：
1. 是否需要我帮忙编写页面内容？
2. FAQ 页面是否需要折叠交互功能？
3. Contact 页面是否需要表单功能？还是只显示联系信息？
4. 是否有其他特殊需求？
