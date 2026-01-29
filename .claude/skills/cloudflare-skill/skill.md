---
name: cloudflare-skill
description: 全面的 Cloudflare 服务管理技能，包括 Workers、KV Storage、R2、Pages、DNS 和 Routes 的部署和配置。当需要部署 Cloudflare 服务、管理 Worker 容器、配置 KV/R2 存储或设置 DNS/路由时使用。
---

# Cloudflare Manager

全面的 Cloudflare 服务管理技能，支持 Workers、KV Storage、R2 buckets、Pages、DNS 记录和路由的部署和配置。

## 核心功能

### 1. Workers 部署

```bash
# 部署 Worker
wrangler deploy

# 部署到特定环境
wrangler deploy --env production

# 本地开发
wrangler dev

# 查看 Worker 日志
wrangler tail
```

### 2. KV Storage 管理

```bash
# 创建 KV 命名空间
wrangler kv:namespace create "MY_KV"

# 列出所有命名空间
wrangler kv:namespace list

# 写入键值对
wrangler kv:key put --namespace-id=<id> "key" "value"

# 读取值
wrangler kv:key get --namespace-id=<id> "key"

# 删除键
wrangler kv:key delete --namespace-id=<id> "key"
```

### 3. R2 Storage 管理

```bash
# 创建 R2 bucket
wrangler r2 bucket create my-bucket

# 列出所有 buckets
wrangler r2 bucket list

# 上传文件
wrangler r2 object put my-bucket/path/file.txt --file=./local-file.txt

# 下载文件
wrangler r2 object get my-bucket/path/file.txt

# 删除文件
wrangler r2 object delete my-bucket/path/file.txt
```

### 4. Pages 部署

```bash
# 部署到 Pages
wrangler pages deploy ./dist

# 创建新项目
wrangler pages project create my-project

# 列出部署
wrangler pages deployment list --project-name=my-project
```

### 5. D1 数据库

```bash
# 创建数据库
wrangler d1 create my-database

# 执行 SQL
wrangler d1 execute my-database --command="SELECT * FROM users"

# 执行迁移文件
wrangler d1 execute my-database --file=./schema.sql
```

### 6. Secrets 管理

```bash
# 添加 secret
wrangler secret put MY_SECRET

# 列出 secrets
wrangler secret list

# 删除 secret
wrangler secret delete MY_SECRET
```

## wrangler.toml 配置示例

```toml
name = "my-worker"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
ENVIRONMENT = "production"

[[kv_namespaces]]
binding = "MY_KV"
id = "xxx"

[[r2_buckets]]
binding = "MY_BUCKET"
bucket_name = "my-bucket"

[[d1_databases]]
binding = "DB"
database_name = "my-database"
database_id = "xxx"

[triggers]
crons = ["0 * * * *"]
```

## Open Next 部署 (Next.js)

```bash
# 构建 Open Next
pnpm run cf:build

# 部署
pnpm run cf:deploy
```

## 环境变量配置

### 公开变量
在 `wrangler.toml` 的 `[vars]` 中配置：
```toml
[vars]
NEXT_PUBLIC_API_URL = "https://api.example.com"
```

### 私密变量
使用 secrets：
```bash
wrangler secret put DATABASE_URL
```

## 常见问题排查

### 部署失败
1. 检查 wrangler.toml 配置
2. 确认账户权限
3. 查看构建日志

### Worker 超时
- 免费版限制 10ms CPU 时间
- 付费版限制 50ms CPU 时间
- 使用 Durable Objects 处理长时间任务

### KV 延迟
- KV 是最终一致性
- 写入后可能需要 60 秒全球同步
- 对于实时数据使用 Durable Objects

## API Token 权限

创建 API Token 时需要的权限：
- Account > Workers Scripts > Edit
- Account > Workers KV Storage > Edit
- Account > Workers R2 Storage > Edit
- Account > Cloudflare Pages > Edit
- Zone > DNS > Edit (如使用自定义域名)

## 参考链接

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [Open Next Cloudflare](https://opennext.js.org/cloudflare)
