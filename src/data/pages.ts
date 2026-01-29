export interface PageData {
  slug: string;
  title: string;
  description: string;
  content: string;
  date: string;
}

export const pagesData: Record<string, Record<string, PageData>> = {
  en: {
    about: {
      slug: 'about',
      title: 'About Us',
      description:
        'Learn about FPVTune and our mission to help FPV pilots optimize their drones',
      date: '2026-01-17',
      content: `
## Our Mission

FPVTune is dedicated to making drone tuning accessible to everyone. We believe that every pilot deserves a perfectly tuned drone, regardless of their technical expertise.

## What We Do

We provide neural network-powered analysis tools that help FPV pilots:

- **Analyze Flight Data**: Upload your Blackbox logs and CLI dumps for comprehensive analysis
- **Get Instant Recommendations**: Receive optimized PID settings tailored to your flying style
- **Learn and Improve**: Understand what each parameter does and why it matters
- **Save Time**: Skip hours of manual tuning and get flying faster

## Our Technology

FPVTune uses advanced neural network algorithms trained on thousands of flight logs to identify issues and suggest optimal settings. Our system understands:

- Different flight controller firmware (Betaflight, INAV, EmuFlight)
- Various drone configurations (freestyle, racing, cinematic)
- Common flight issues (oscillations, propwash, motor noise)
- Environmental factors affecting performance

## Why Choose FPVTune

- **Accurate Analysis**: Our neural network is trained on real-world flight data
- **Easy to Use**: Simple upload process, no technical knowledge required
- **Fast Results**: Get recommendations in seconds
- **Continuous Improvement**: We constantly update our algorithms based on user feedback

## Our Commitment

We are committed to:

- Protecting your privacy and data
- Providing accurate and reliable recommendations
- Supporting the FPV community
- Continuously improving our services

## Get in Touch

Have questions or feedback? We'd love to hear from you. Visit our [contact page](/contact) to get in touch.
      `,
    },
    contact: {
      slug: 'contact',
      title: 'Contact Us',
      description: 'Get in touch with our team',
      date: '2026-01-17',
      content: `
## Get in Touch

We'd love to hear from you! Whether you have questions, feedback, or need support, our team is here to help.

## Contact Information

- **Email**: support@fpvtune.com
- **Discord**: [Join our community](https://discord.gg/fpvtune)
- **GitHub**: [github.com/fpvtune](https://github.com/fpvtune)

## Support Hours

Our support team is available:
- Monday - Friday: 9:00 AM - 6:00 PM (UTC)
- Saturday - Sunday: 10:00 AM - 4:00 PM (UTC)

We typically respond within 24 hours during business days.

## Frequently Asked Questions

Before reaching out, you might find answers to common questions on our [FAQ page](/faq).

## Report a Bug

Found a bug? Please report it on our [GitHub Issues](https://github.com/fpvtune/issues) page with:
- A clear description of the issue
- Steps to reproduce
- Your browser and operating system
- Screenshots if applicable

## Feature Requests

Have an idea for a new feature? We'd love to hear it! Share your suggestions on our Discord community or GitHub Discussions.
      `,
    },
    faq: {
      slug: 'faq',
      title: 'Frequently Asked Questions',
      description: 'Find answers to common questions about FPVTune',
      date: '2026-01-17',
      content: `
## General Questions

### What is FPVTune?

FPVTune is a neural network-powered tuning assistant that analyzes your drone's flight data and provides optimized PID settings.

### How does it work?

Our neural network has been trained on thousands of flight logs. When you upload your data, it analyzes patterns and generates optimized settings.

### Is FPVTune free?

We offer both free and premium plans. The free plan includes basic analysis and recommendations.

## Using FPVTune

### What files do I need to upload?

You can upload:
- **Blackbox logs** (.bbl, .bfl files)
- **CLI dump** (.txt files)

### How long does analysis take?

Most analyses complete within 10-30 seconds.

### What firmware versions are supported?

We support:
- Betaflight 4.0 and newer
- INAV 2.0 and newer
- EmuFlight
- Other Betaflight-based firmware

## Account & Subscription

### Do I need an account?

Yes, a free account is required to save your analysis history.

### Can I cancel my subscription?

Yes, you can cancel anytime from your account settings.

## Technical Support

### My analysis failed. What should I do?

Ensure your log files are valid and not corrupted. If the problem persists, contact support.

### Can I share my analysis results?

Yes! Each analysis has a unique shareable link.

## Privacy & Security

### Is my flight data private?

Yes. Your uploaded files and analysis results are private by default.

### Do you sell my data?

Never. We do not sell, rent, or share your personal information.
      `,
    },
    cookie: {
      slug: 'cookie',
      title: 'Cookie Policy',
      description: 'How we use cookies and similar technologies',
      date: '2026-01-17',
      content: `
## Introduction

This Cookie Policy explains how we use cookies and similar technologies on our website.

## What Are Cookies

Cookies are small text files stored on your device when you visit a website.

## How We Use Cookies

We use cookies for:

- **Essential Cookies**: Necessary for the website to function
- **Performance Cookies**: Help us measure and improve performance
- **Functional Cookies**: Enable enhanced functionality
- **Targeting Cookies**: May be set by advertising partners

## Managing Cookies

Most web browsers allow you to control cookies through their settings. You can delete or block cookies.

## Contact Us

If you have questions about this Cookie Policy, please [contact us](/contact).
      `,
    },
    privacy: {
      slug: 'privacy',
      title: 'Privacy Policy',
      description: 'How we protect your privacy and data',
      date: '2026-01-17',
      content: `
## Introduction

This Privacy Policy describes how we collect, use, and protect your personal information.

## Information We Collect

We collect:
- Account information (email, name)
- Flight data you upload
- Usage data and analytics

## How We Use Your Information

We use your information to:
- Provide and improve our services
- Analyze flight data
- Communicate with you
- Ensure security

## Data Security

We implement industry-standard security measures to protect your data.

## Your Rights

You have the right to:
- Access your personal data
- Request data deletion
- Opt out of marketing communications

## Contact Us

For privacy-related questions, please [contact us](/contact).
      `,
    },
    refund: {
      slug: 'refund',
      title: 'Refund Policy',
      description: 'Our refund and dispute resolution policy',
      date: '2026-01-17',
      content: `
## Refund Policy

We want you to be satisfied with our service. This policy outlines our refund process.

## 30-Day Money-Back Guarantee

If you're not satisfied with our premium service, you can request a full refund within 30 days of purchase.

## How to Request a Refund

To request a refund:
1. Contact our support team at support@fpvtune.com
2. Provide your account email and reason for refund
3. We'll process your request within 5-7 business days

## Refund Eligibility

Refunds are available for:
- Premium subscriptions within 30 days
- Unused credits or services
- Technical issues preventing service use

## Non-Refundable Items

The following are not eligible for refunds:
- Free tier services
- Subscriptions after 30 days
- Services already consumed

## Disputes

If you have a dispute, please contact us first. We're committed to resolving issues fairly.

## Contact Us

For refund requests or questions, [contact us](/contact).
      `,
    },
    terms: {
      slug: 'terms',
      title: 'Terms of Service',
      description: 'Terms and conditions for using our services',
      date: '2026-01-17',
      content: `
## Introduction

These Terms of Service govern your use of our website and services.

## Use of Services

Our services are provided "as is" without warranties of any kind.

## User Accounts

You are responsible for safeguarding your account and all activities under it.

## Intellectual Property

All content and materials are owned by FPVTune or our licensors.

## Prohibited Activities

You may not:
- Violate any laws or regulations
- Infringe on intellectual property rights
- Transmit malicious code
- Attempt to gain unauthorized access

## Limitation of Liability

We are not liable for any indirect, incidental, or consequential damages.

## Changes to Terms

We may update these Terms from time to time. Continued use constitutes acceptance.

## Contact Us

For questions about these Terms, please [contact us](/contact).
      `,
    },
  },
  zh: {
    about: {
      slug: 'about',
      title: '关于我们',
      description: '了解 FPVTune 以及我们帮助 FPV 飞手优化无人机的使命',
      date: '2026-01-17',
      content: `
## 我们的使命

FPVTune 致力于让无人机调参变得人人可及。我们相信每位飞手都应该拥有一台完美调校的无人机。

## 我们做什么

我们提供神经网络驱动的分析工具，帮助 FPV 飞手：

- **分析飞行数据**：上传您的 Blackbox 日志和 CLI dump
- **获取即时建议**：获得针对您飞行风格的优化 PID 设置
- **学习和改进**：了解每个参数的作用
- **节省时间**：跳过数小时的手动调参

## 我们的技术

FPVTune 使用先进的神经网络算法，基于数千份飞行日志训练而成。

## 为什么选择 FPVTune

- **精准分析**：基于真实飞行数据训练
- **易于使用**：简单的上传流程
- **快速结果**：几秒钟内获得建议
- **持续改进**：根据用户反馈不断更新

## 联系我们

访问我们的[联系页面](/contact)与我们取得联系。
      `,
    },
    contact: {
      slug: 'contact',
      title: '联系我们',
      description: '与我们的团队取得联系',
      date: '2026-01-17',
      content: `
## 联系我们

我们很乐意听取您的意见！

## 联系方式

- **邮箱**: support@fpvtune.com
- **Discord**: [加入我们的社区](https://discord.gg/fpvtune)
- **GitHub**: [github.com/fpvtune](https://github.com/fpvtune)

## 支持时间

周一至周五：9:00 AM - 6:00 PM (UTC)
周六至周日：10:00 AM - 4:00 PM (UTC)

## 常见问题

访问我们的 [FAQ 页面](/faq) 查找常见问题的答案。
      `,
    },
    faq: {
      slug: 'faq',
      title: '常见问题',
      description: '查找关于 FPVTune 的常见问题答案',
      date: '2026-01-17',
      content: `
## 一般问题

### 什么是 FPVTune？

FPVTune 是一款神经网络驱动的调参助手，分析您的无人机飞行数据并提供优化的 PID 设置。

### 如何工作？

我们的神经网络基于数千份飞行日志训练。上传数据后，它会分析模式并生成优化设置。

### FPVTune 免费吗？

我们提供免费和付费计划。免费计划包含基础分析和建议。

## 使用 FPVTune

### 需要上传什么文件？

您可以上传：
- **Blackbox 日志** (.bbl, .bfl 文件)
- **CLI dump** (.txt 文件)

### 分析需要多长时间？

大多数分析在 10-30 秒内完成。

## 账户和订阅

### 需要账户吗？

是的，需要免费账户来保存分析历史。

### 可以取消订阅吗？

可以，您可以随时从账户设置中取消。

## 隐私和安全

### 我的飞行数据是私密的吗？

是的。您上传的文件和分析结果默认是私密的。

### 你们会出售我的数据吗？

绝不会。我们不会出售、出租或分享您的个人信息。
      `,
    },
    cookie: {
      slug: 'cookie',
      title: 'Cookie 政策',
      description: '我们如何使用 Cookie 和类似技术',
      date: '2026-01-17',
      content: `
## 简介

本 Cookie 政策说明我们如何在网站上使用 Cookie 和类似技术。

## 什么是 Cookie

Cookie 是访问网站时存储在您设备上的小文本文件。

## 我们如何使用 Cookie

我们使用 Cookie 用于：

- **必要 Cookie**：网站正常运行所必需
- **性能 Cookie**：帮助我们衡量和改进性能
- **功能 Cookie**：启用增强功能
- **定向 Cookie**：可能由广告合作伙伴设置

## 管理 Cookie

大多数网络浏览器允许您通过设置控制 Cookie。

## 联系我们

如有关于本 Cookie 政策的问题，请[联系我们](/contact)。
      `,
    },
    privacy: {
      slug: 'privacy',
      title: '隐私政策',
      description: '我们如何保护您的隐私和数据',
      date: '2026-01-17',
      content: `
## 简介

本隐私政策描述我们如何收集、使用和保护您的个人信息。

## 我们收集的信息

我们收集：
- 账户信息（邮箱、姓名）
- 您上传的飞行数据
- 使用数据和分析

## 如何使用您的信息

我们使用您的信息来：
- 提供和改进服务
- 分析飞行数据
- 与您沟通
- 确保安全

## 数据安全

我们实施行业标准的安全措施来保护您的数据。

## 您的权利

您有权：
- 访问您的个人数据
- 请求删除数据
- 选择退出营销通信

## 联系我们

有关隐私问题，请[联系我们](/contact)。
      `,
    },
    refund: {
      slug: 'refund',
      title: '退款政策',
      description: '我们的退款和争议解决政策',
      date: '2026-01-17',
      content: `
## 退款政策

我们希望您对我们的服务感到满意。本政策概述了我们的退款流程。

## 30 天退款保证

如果您对我们的付费服务不满意，可以在购买后 30 天内申请全额退款。

## 如何申请退款

申请退款：
1. 联系我们的支持团队 support@fpvtune.com
2. 提供您的账户邮箱和退款原因
3. 我们将在 5-7 个工作日内处理您的请求

## 退款资格

以下情况可以退款：
- 30 天内的付费订阅
- 未使用的积分或服务
- 技术问题导致无法使用服务

## 不可退款项目

以下不符合退款条件：
- 免费服务
- 30 天后的订阅
- 已消费的服务

## 争议

如有争议，请先联系我们。我们致力于公平解决问题。

## 联系我们

有关退款请求或问题，请[联系我们](/contact)。
      `,
    },
    terms: {
      slug: 'terms',
      title: '服务条款',
      description: '使用我们服务的条款和条件',
      date: '2026-01-17',
      content: `
## 简介

这些服务条款管理您对我们网站和服务的使用。

## 服务使用

我们的服务按"原样"提供，不提供任何形式的保证。

## 用户账户

您负责保护您的账户以及账户下的所有活动。

## 知识产权

所有内容和材料均由 FPVTune 或我们的许可方拥有。

## 禁止活动

您不得：
- 违反任何法律或法规
- 侵犯知识产权
- 传输恶意代码
- 尝试未经授权的访问

## 责任限制

我们不对任何间接、附带或后果性损害承担责任。

## 条款变更

我们可能会不时更新这些条款。继续使用即表示接受。

## 联系我们

有关这些条款的问题，请[联系我们](/contact)。
      `,
    },
  },
};
