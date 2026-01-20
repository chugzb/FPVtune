#!/usr/bin/env node

/**
 * 测试环境变量是否正确配置
 */

import 'dotenv/config';

console.log('🔍 检查环境变量配置...\n');

const requiredVars = {
  数据库: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
  'Resend (邮件)': {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  },
  'Creem (支付)': {
    CREEM_API_KEY: process.env.CREEM_API_KEY,
    CREEM_WEBHOOK_SECRET: process.env.CREEM_WEBHOOK_SECRET,
    CREEM_PRODUCT_ID: process.env.CREEM_PRODUCT_ID,
  },
  OpenAI: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
  },
  'R2 Storage': {
    STORAGE_REGION: process.env.STORAGE_REGION,
    STORAGE_BUCKET_NAME: process.env.STORAGE_BUCKET_NAME,
    STORAGE_ACCESS_KEY_ID: process.env.STORAGE_ACCESS_KEY_ID,
    STORAGE_SECRET_ACCESS_KEY: process.env.STORAGE_SECRET_ACCESS_KEY,
    STORAGE_ENDPOINT: process.env.STORAGE_ENDPOINT,
  },
};

let allConfigured = true;

for (const [category, vars] of Object.entries(requiredVars)) {
  console.log(`\n📦 ${category}:`);
  for (const [key, value] of Object.entries(vars)) {
    const isConfigured = !!value;
    const status = isConfigured ? '✅' : '❌';
    const displayValue = value
      ? value.length > 50
        ? `${value.substring(0, 30)}...${value.substring(value.length - 10)}`
        : value
      : '未配置';

    console.log(`  ${status} ${key}: ${displayValue}`);

    if (!isConfigured) {
      allConfigured = false;
    }
  }
}

console.log('\n' + '='.repeat(60));
if (allConfigured) {
  console.log('✅ 所有环境变量都已配置');
} else {
  console.log('❌ 有环境变量未配置');
  process.exit(1);
}
