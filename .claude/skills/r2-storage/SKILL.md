# R2 Storage Skill

## 描述

用于上传文件到 Cloudflare R2 存储的工具。支持单文件和批量上传，自动处理文件路径和权限配置。

## 何时使用

- 需要上传图片、视频等媒体文件到 R2
- 批量上传多个文件
- 管理 R2 存储中的文件

## 环境要求

需要在 `.env.local` 中配置以下环境变量：

```bash
STORAGE_REGION="AUTO"
STORAGE_BUCKET_NAME="your-bucket-name"
STORAGE_ACCESS_KEY_ID="your-access-key"
STORAGE_SECRET_ACCESS_KEY="your-secret-key"
STORAGE_ENDPOINT="your-r2-endpoint"
NEXT_PUBLIC_R2_PUBLIC_URL="your-public-url"
```

## 使用方法

### 1. 上传单个文件

```bash
node .claude/skills/r2-storage/scripts/upload.mjs \
  --file /path/to/local/file.png \
  --key fpvtune/guides/blackbox/step1.png
```

### 2. 批量上传文件

```bash
node .claude/skills/r2-storage/scripts/upload.mjs \
  --batch \
  --config /path/to/upload-config.json
```

批量上传配置文件格式（JSON）：

```json
{
  "files": [
    {
      "localPath": "/path/to/file1.png",
      "r2Key": "fpvtune/guides/blackbox/step1.png"
    },
    {
      "localPath": "/path/to/file2.png",
      "r2Key": "fpvtune/guides/blackbox/step2.png"
    }
  ]
}
```

### 3. 列出 R2 中的文件

```bash
node .claude/skills/r2-storage/scripts/list.mjs \
  --prefix fpvtune/guides/
```

### 4. 删除文件

```bash
node .claude/skills/r2-storage/scripts/delete.mjs \
  --key fpvtune/guides/blackbox/step1.png
```

## 输出

上传成功后会返回：
- 文件的 R2 key
- 公共访问 URL
- 文件大小
- 上传时间

## 注意事项

- 确保本地文件路径正确
- R2 key 不要以 `/` 开头
- 上传前会自动检测文件类型并设置正确的 Content-Type
- 所有上传的文件默认设置为公共可读
