#!/usr/bin/env node

import { readFileSync, statSync } from 'fs';
import { resolve } from 'path';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
config({ path: resolve(process.cwd(), '.env.local') });

// 配置 S3 客户端
const s3Client = new S3Client({
  region: process.env.STORAGE_REGION || 'auto',
  endpoint: process.env.STORAGE_ENDPOINT,
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY_ID,
    secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.STORAGE_BUCKET_NAME;
const PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

// 根据文件扩展名获取 Content-Type
function getContentType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const types = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    mp4: 'video/mp4',
    webm: 'video/webm',
    pdf: 'application/pdf',
    txt: 'text/plain',
    json: 'application/json',
    bbl: 'application/octet-stream',
  };
  return types[ext] || 'application/octet-stream';
}

// 上传单个文件
async function uploadFile(localPath, r2Key) {
  try {
    const fileContent = readFileSync(localPath);
    const stats = statSync(localPath);
    const contentType = getContentType(localPath);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: r2Key,
      Body: fileContent,
      ContentType: contentType,
    });

    await s3Client.send(command);

    const publicUrl = `${PUBLIC_URL}/${r2Key}`;

    console.log('✅ 上传成功:');
    console.log(`   本地路径: ${localPath}`);
    console.log(`   R2 Key: ${r2Key}`);
    console.log(`   公共 URL: ${publicUrl}`);
    console.log(`   文件大小: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`   Content-Type: ${contentType}`);
    console.log('');

    return { success: true, url: publicUrl, key: r2Key };
  } catch (error) {
    console.error('❌ 上传失败:', error.message);
    return { success: false, error: error.message };
  }
}

// 批量上传
async function batchUpload(configPath) {
  try {
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    const results = [];

    console.log(`开始批量上传 ${config.files.length} 个文件...\n`);

    for (const file of config.files) {
      const result = await uploadFile(file.localPath, file.r2Key);
      results.push(result);
    }

    const successCount = results.filter((r) => r.success).length;
    console.log(`\n批量上传完成: ${successCount}/${results.length} 成功`);

    return results;
  } catch (error) {
    console.error('❌ 批量上传失败:', error.message);
    process.exit(1);
  }
}

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file') {
      options.file = args[++i];
    } else if (args[i] === '--key') {
      options.key = args[++i];
    } else if (args[i] === '--batch') {
      options.batch = true;
    } else if (args[i] === '--config') {
      options.config = args[++i];
    }
  }

  return options;
}

// 主函数
async function main() {
  const options = parseArgs();

  // 检查环境变量
  if (!BUCKET_NAME || !PUBLIC_URL) {
    console.error('❌ 错误: 缺少必要的环境变量');
    console.error('请确保 .env.local 中配置了:');
    console.error('  - STORAGE_BUCKET_NAME');
    console.error('  - STORAGE_ACCESS_KEY_ID');
    console.error('  - STORAGE_SECRET_ACCESS_KEY');
    console.error('  - STORAGE_ENDPOINT');
    console.error('  - NEXT_PUBLIC_R2_PUBLIC_URL');
    process.exit(1);
  }

  if (options.batch) {
    if (!options.config) {
      console.error('❌ 错误: 批量上传需要 --config 参数');
      process.exit(1);
    }
    await batchUpload(options.config);
  } else {
    if (!options.file || !options.key) {
      console.error('❌ 错误: 需要 --file 和 --key 参数');
      console.error('');
      console.error('使用方法:');
      console.error('  单文件上传:');
      console.error(
        '    node upload.mjs --file /path/to/file.png --key fpvtune/guides/image.png'
      );
      console.error('');
      console.error('  批量上传:');
      console.error(
        '    node upload.mjs --batch --config /path/to/config.json'
      );
      process.exit(1);
    }
    await uploadFile(options.file, options.key);
  }
}

main();
