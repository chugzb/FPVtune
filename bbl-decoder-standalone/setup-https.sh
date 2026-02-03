#!/bin/bash
# BBL Decoder HTTPS 配置脚本
# 使用 Cloudflare Tunnel 或 nginx + Let's Encrypt

set -e

echo "=== BBL Decoder HTTPS 配置 ==="
echo ""
echo "选择配置方式:"
echo "1) Cloudflare Tunnel (推荐，无需域名证书)"
echo "2) nginx + Let's Encrypt (需要域名)"
echo ""
read -p "请选择 [1/2]: " choice

case $choice in
  1)
    echo ""
    echo "=== 配置 Cloudflare Tunnel ==="
    echo ""

    # 检查 cloudflared 是否安装
    if ! command -v cloudflared &> /dev/null; then
      echo "安装 cloudflared..."
      curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
      sudo dpkg -i cloudflared.deb
      rm cloudflared.deb
    fi

    echo ""
    echo "请按以下步骤操作:"
    echo "1. 登录 Cloudflare Dashboard: https://dash.cloudflare.com"
    echo "2. 进入 Zero Trust > Access > Tunnels"
    echo "3. 创建新 Tunnel，名称: bbl-decoder"
    echo "4. 复制 Tunnel Token"
    echo ""
    read -p "请输入 Tunnel Token: " TUNNEL_TOKEN

    # 安装并启动 tunnel
    sudo cloudflared service install $TUNNEL_TOKEN
    sudo systemctl start cloudflared
    sudo systemctl enable cloudflared

    echo ""
    echo "Cloudflare Tunnel 已配置!"
    echo "请在 Cloudflare Dashboard 中配置 Public Hostname:"
    echo "  - Subdomain: bbl-decoder"
    echo "  - Domain: 你的域名"
    echo "  - Service: http://localhost:8080"
    echo ""
    echo "配置完成后，更新 wrangler.jsonc 中的 BBL_DECODER_URL 为:"
    echo "  https://bbl-decoder.你的域名.com"
    ;;

  2)
    echo ""
    echo "=== 配置 nginx + Let's Encrypt ==="
    echo ""
    read -p "请输入域名 (例如 bbl.fpvtune.com): " DOMAIN

    # 安装 nginx 和 certbot
    sudo apt update
    sudo apt install -y nginx certbot python3-certbot-nginx

    # 创建 nginx 配置
    sudo tee /etc/nginx/sites-available/bbl-decoder << EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # 增加超时时间，BBL 解码可能需要较长时间
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        proxy_read_timeout 300;

        # 增加请求体大小限制
        client_max_body_size 100M;
    }
}
EOF

    # 启用站点
    sudo ln -sf /etc/nginx/sites-available/bbl-decoder /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl reload nginx

    # 获取 SSL 证书
    echo ""
    echo "正在获取 SSL 证书..."
    sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@fpvtune.com

    echo ""
    echo "HTTPS 配置完成!"
    echo "BBL Decoder 现在可以通过 https://$DOMAIN 访问"
    echo ""
    echo "请更新 wrangler.jsonc 中的 BBL_DECODER_URL 为:"
    echo "  https://$DOMAIN"
    ;;

  *)
    echo "无效选择"
    exit 1
    ;;
esac

echo ""
echo "=== 配置完成 ==="
