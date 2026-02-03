#!/usr/bin/env node
/**
 * 创建测试码脚本
 *
 * 用法:
 *   node scripts/create-promo-code.mjs                    # 创建一次性码
 *   node scripts/create-promo-code.mjs --type unlimited   # 创建永久码
 *   node scripts/create-promo-code.mjs --type limited --max 10  # 创建限次码（10次）
 *   node scripts/create-promo-code.mjs --code MYCODE      # 使用自定义码
 *   node scripts/create-promo-code.mjs --days 30          # 30天有效期
 *   node scripts/create-promo-code.mjs --note "给测试用户"  # 添加备注
 */

import 'dotenv/config';

const API_URL = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const ADMIN_KEY = process.env.ADMIN_API_KEY;

if (!ADMIN_KEY) {
  console.error('错误: 请在 .env 中设置 ADMIN_API_KEY');
  process.exit(1);
}

// 解析命令行参数
const args = process.argv.slice(2);
const params = {};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--type' && args[i + 1]) {
    params.type = args[++i];
  } else if (arg === '--code' && args[i + 1]) {
    params.code = args[++i];
  } else if (arg === '--max' && args[i + 1]) {
    params.maxUses = parseInt(args[++i], 10);
  } else if (arg === '--days' && args[i + 1]) {
    params.validDays = parseInt(args[++i], 10);
  } else if (arg === '--note' && args[i + 1]) {
    params.note = args[++i];
  } else if (arg === '--help' || arg === '-h') {
    console.log(`
创建测试码脚本

用法:
  node scripts/create-promo-code.mjs [选项]

选项:
  --type <type>    码类型: single(一次性), unlimited(永久), limited(限次)
  --code <code>    自定义码（不指定则自动生成）
  --max <number>   最大使用次数（仅 limited 类型）
  --days <number>  有效天数（不指定则永久有效）
  --note <text>    备注信息
  --help, -h       显示帮助

示例:
  node scripts/create-promo-code.mjs                           # 一次性码
  node scripts/create-promo-code.mjs --type unlimited          # 永久码
  node scripts/create-promo-code.mjs --type limited --max 5    # 5次使用限制
  node scripts/create-promo-code.mjs --code BETA2026 --days 30 # 自定义码，30天有效
`);
    process.exit(0);
  }
}

async function createPromoCode() {
  try {
    const response = await fetch(`${API_URL}/api/promo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': ADMIN_KEY,
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('创建失败:', data.error);
      process.exit(1);
    }

    const code = data.code;
    console.log('\n测试码创建成功!');
    console.log('================');
    console.log(`码: ${code.code}`);
    console.log(`类型: ${code.type === 'single' ? '一次性' : code.type === 'unlimited' ? '永久' : '限次'}`);
    if (code.type === 'limited') {
      console.log(`最大使用次数: ${code.maxUses}`);
    }
    if (code.validUntil) {
      console.log(`有效期至: ${new Date(code.validUntil).toLocaleString()}`);
    } else {
      console.log(`有效期: 永久`);
    }
    if (code.note) {
      console.log(`备注: ${code.note}`);
    }
    console.log('================\n');

  } catch (error) {
    console.error('请求失败:', error.message);
    process.exit(1);
  }
}

createPromoCode();
