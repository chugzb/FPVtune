#!/usr/bin/env node

import { resolve } from 'path';
import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { config } from 'dotenv';

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

async function listFiles(prefix = '') {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
    });

    const response = await s3Client.send(command);

    if (!response.Contents || response.Contents.length === 0) {
      console.log(`没有找到文件 (前缀: ${prefix || '(根目录)'})`);
      return;
    }

    console.log(`\n找到 ${response.Contents.length} 个文件:\n`);

    response.Contents.forEach((item, index) => {
      const size = (item.Size / 1024).toFixed(2);
      const url = `${PUBLIC_URL}/${item.Key}`;
      console.log(`${index + 1}. ${item.Key}`);
      console.log(`   大小: ${size} KB`);
      console.log(`   修改时间: ${item.LastModified.toLocaleString()}`);
      console.log(`   URL: ${url}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ 列出文件失败:', error.message);
    process.exit(1);
  }
}

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--prefix') {
      options.prefix = args[++i];
    }
  }

  return options;
}

async function main() {
  const options = parseArgs();
  await listFiles(options.prefix || '');
}

main();
