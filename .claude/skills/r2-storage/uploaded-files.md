# FPVtune 教程图片 - R2 上传记录

上传时间: 2026-01-17

## Blackbox 日志导出教程

### 步骤图片

1. **连接飞控**
   - R2 Key: `fpvtune/guides/blackbox/step1-connect.png`
   - URL: https://pub-a43dfa5ee4c84353a038f71491cecbd9.r2.dev/fpvtune/guides/blackbox/step1-connect.png
   - 大小: 334.16 KB
   - 描述: 步骤1 - 连接飞控到 Betaflight Configurator

2. **进入 Blackbox 标签**
   - R2 Key: `fpvtune/guides/blackbox/step2-blackbox-tab.png`
   - URL: https://pub-a43dfa5ee4c84353a038f71491cecbd9.r2.dev/fpvtune/guides/blackbox/step2-blackbox-tab.png
   - 大小: 340.77 KB
   - 描述: 步骤2 - 进入 Blackbox 标签

3. **保存日志**
   - R2 Key: `fpvtune/guides/blackbox/step3-save.png`
   - URL: https://pub-a43dfa5ee4c84353a038f71491cecbd9.r2.dev/fpvtune/guides/blackbox/step3-save.png
   - 大小: 301.55 KB
   - 描述: 步骤3 - 保存 Blackbox 日志

### 示例文件

- **示例 BBL 文件**
  - R2 Key: `fpvtune/guides/blackbox/example-file.bbl`
  - URL: https://pub-a43dfa5ee4c84353a038f71491cecbd9.r2.dev/fpvtune/guides/blackbox/example-file.bbl
  - 大小: 1061.00 KB
  - 描述: Blackbox 日志示例文件

## CLI Dump 导出教程

### 步骤图片

1. **进入 CLI 标签**
   - R2 Key: `fpvtune/guides/cli-dump/step1-cli-tab.png`
   - URL: https://pub-a43dfa5ee4c84353a038f71491cecbd9.r2.dev/fpvtune/guides/cli-dump/step1-cli-tab.png
   - 大小: 162.83 KB
   - 描述: 步骤1 - 进入 CLI 标签

2. **保存输出**
   - R2 Key: `fpvtune/guides/cli-dump/step2-save.png`
   - URL: https://pub-a43dfa5ee4c84353a038f71491cecbd9.r2.dev/fpvtune/guides/cli-dump/step2-save.png
   - 大小: 183.49 KB
   - 描述: 步骤2 - 保存 CLI 输出

### 示例文件

- **示例 TXT 文件**
  - R2 Key: `fpvtune/guides/cli-dump/example-file.txt`
  - URL: https://pub-a43dfa5ee4c84353a038f71491cecbd9.r2.dev/fpvtune/guides/cli-dump/example-file.txt
  - 大小: 27.82 KB
  - 描述: CLI Dump 示例文件

## 使用方法

在代码中使用这些图片：

```typescript
import { getMediaUrl } from '@/lib/r2-client';

// Blackbox 教程图片
const step1 = getMediaUrl('fpvtune/guides/blackbox/step1-connect.png');
const step2 = getMediaUrl('fpvtune/guides/blackbox/step2-blackbox-tab.png');
const step3 = getMediaUrl('fpvtune/guides/blackbox/step3-save.png');

// CLI Dump 教程图片
const cliStep1 = getMediaUrl('fpvtune/guides/cli-dump/step1-cli-tab.png');
const cliStep2 = getMediaUrl('fpvtune/guides/cli-dump/step2-save.png');
```

## 总计

- 总文件数: 7
- 总大小: 2.38 MB
- 图片文件: 6 个 (1.48 MB)
- 示例文件: 2 个 (1.09 MB)
