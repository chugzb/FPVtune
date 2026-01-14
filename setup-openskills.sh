#!/bin/bash

# OpenSkills 一键安装脚本
# 用法: ./setup-openskills.sh [skills-repo]
# 示例: ./setup-openskills.sh anthropics/skills

set -e

SKILLS_REPO="${1:-anthropics/skills}"

echo "🚀 开始安装 OpenSkills..."

# 1. 全局安装 openskills
echo "📦 安装 openskills CLI..."
npm i -g openskills

# 2. 确保 AGENTS.md 存在
if [ ! -f "AGENTS.md" ]; then
    echo "📝 创建 AGENTS.md 文件..."
    touch AGENTS.md
    echo "# Agent Instructions" > AGENTS.md
fi

# 3. 安装技能
echo "🔧 安装技能: $SKILLS_REPO..."
openskills install "$SKILLS_REPO"

# 4. 同步到 AGENTS.md
echo "🔄 同步技能到 AGENTS.md..."
openskills sync

echo "✅ 完成！OpenSkills 已安装并同步到 AGENTS.md"
