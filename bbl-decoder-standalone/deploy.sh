#!/bin/bash
# BBL Decoder 一键部署脚本
# 用法: ./deploy.sh [--init]
#   --init: 首次部署，创建虚拟环境并安装依赖

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 检查是否首次部署
if [ "$1" == "--init" ]; then
    log_info "首次部署，创建虚拟环境..."

    # 创建虚拟环境
    python3 -m venv venv
    log_info "虚拟环境创建完成"

    # 激活并安装依赖
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    pip install gunicorn
    log_info "依赖安装完成"
else
    log_info "更新部署（跳过虚拟环境创建）"
fi

# 停止旧进程
log_info "停止旧服务..."
pkill -f "gunicorn src.entry:app" 2>/dev/null || true
sleep 2

# 确保虚拟环境存在
if [ ! -d "venv" ]; then
    log_error "虚拟环境不存在，请先运行: ./deploy.sh --init"
    exit 1
fi

# 激活虚拟环境
source venv/bin/activate

# 确保依赖已安装
log_info "检查依赖..."
pip install -q -r requirements.txt
pip install -q gunicorn

# 启动服务
log_info "启动服务..."

# 后台启动 gunicorn
nohup venv/bin/gunicorn src.entry:app \
    --workers 1 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8080 \
    --timeout 300 \
    --access-logfile - \
    --error-logfile - \
    > logs/server.log 2>&1 &

# 创建日志目录
mkdir -p logs

sleep 3

# 检查服务状态
if curl -s http://localhost:8080/health | grep -q "ok"; then
    log_info "服务启动成功!"
    log_info "健康检查: http://localhost:8080/health"
    log_info "日志文件: logs/server.log"
else
    log_error "服务启动失败，查看日志: tail -f logs/server.log"
    exit 1
fi
