---
name: cf-deploy
description: Cloudflare Pages 部署指南。当用户说"部署到 CF"、"CF 部署"、"Cloudflare 部署"或需要将项目部署到 Cloudflare Workers/Pages 时使用此技能。
---

# Cloudflare 部署

## 部署流程

1. 构建项目
```bash
pnpm run cf:build
```

2. 部署到 Cloudflare
```bash
pnpm run cf:deploy
```

## 部署前检查

- 确保代码已保存
- 确保没有 TypeScript 错误
- 如有翻译修改，确保中英文都已更新

## 部署后验证

部署成功后会显示：
- `Uploaded ruxa-frontend`
- `https://ruxa-frontend.ningainshop.workers.dev`

生产环境地址：https://ruxa.ai

## 环境变量

`NEXT_PUBLIC_` 开头的变量需要在 `wrangler.toml` 的 `[vars]` 中配置，不能用 secrets。

## 常见问题

构建失败时检查：
- 翻译文件是否完整
- TypeScript 类型是否正确
- 依赖是否安装完整
