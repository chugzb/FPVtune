#!/usr/bin/env node

import { resolve } from 'path';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
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

async function deleteFile(key) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);

    console.log('✅ 删除成功:');
    console.log(`   R2 Key: ${key}`);
  } catch (error) {
    console.error('❌ 删除失败:', error.message);
    process.exit(1);
  }
}

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--key') {
      options.key = args[++i];
    }
  }

  return options;
}

async function main() {
  const options = parseArgs();

  if (!options.key) {
    console.error('❌ 错误: 需要 --key 参数');
    console.error('');
    console.error('使用方法:');
    console.error('  node delete.mjs --key fpvtune/guides/image.png');
    process.exit(1);
  }

  await deleteFile(options.key);
}

main();
