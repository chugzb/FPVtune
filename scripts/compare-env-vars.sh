#!/bin/bash

echo "🔍 比较 .env.local 和 wrangler.jsonc 中的环境变量..."
echo ""

# 关键环境变量列表
KEYS=(
  "DATABASE_URL"
  "RESEND_API_KEY"
  "CREEM_API_KEY"
  "CREEM_WEBHOOK_SECRET"
  "CREEM_PRODUCT_ID"
)

# 从 .env.local 读取
echo "📄 .env.local 中的值:"
for key in "${KEYS[@]}"; do
  value=$(grep "^${key}=" .env.local | cut -d'=' -f2- | tr -d '"')
  if [ -n "$value" ]; then
    # 只显示前30个字符和后10个字符
    if [ ${#value} -gt 50 ]; then
      display="${value:0:30}...${value: -10}"
    else
      display="$value"
    fi
    echo "  ✅ $key: $display"
  else
    echo "  ❌ $key: 未找到"
  fi
done

echo ""
echo "📄 wrangler.jsonc 中的值:"
for key in "${KEYS[@]}"; do
  value=$(grep "\"${key}\":" wrangler.jsonc | sed 's/.*: "\(.*\)".*/\1/' | tr -d ',')
  if [ -n "$value" ]; then
    # 只显示前30个字符和后10个字符
    if [ ${#value} -gt 50 ]; then
      display="${value:0:30}...${value: -10}"
    else
      display="$value"
    fi
    echo "  ✅ $key: $display"
  else
    echo "  ❌ $key: 未找到"
  fi
done

echo ""
echo "🔄 比较结果:"
all_match=true
for key in "${KEYS[@]}"; do
  env_value=$(grep "^${key}=" .env.local | cut -d'=' -f2- | tr -d '"')
  wrangler_value=$(grep "\"${key}\":" wrangler.jsonc | sed 's/.*: "\(.*\)".*/\1/' | tr -d ',')

  if [ "$env_value" = "$wrangler_value" ]; then
    echo "  ✅ $key: 匹配"
  else
    echo "  ❌ $key: 不匹配"
    all_match=false
  fi
done

echo ""
if [ "$all_match" = true ]; then
  echo "✅ 所有关键环境变量都已正确配置到 wrangler.jsonc"
else
  echo "❌ 有环境变量配置不一致"
fi
