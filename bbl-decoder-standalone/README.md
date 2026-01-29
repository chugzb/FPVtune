# BBL Decoder 独立部署包

Betaflight Blackbox Log (BBL) 解码服务，输出标准化 JSON 供 AI 分析。

## 快速开始

### Docker 部署 (推荐)

```bash
# 构建并启动
docker-compose up -d

# 或手动构建
docker build -t bbl-decoder .
docker run -d -p 8080:8080 --name bbl-decoder bbl-decoder
```

### 直接运行

```bash
# 安装依赖
pip install -r requirements.txt

# 启动服务
uvicorn src.entry:app --host 0.0.0.0 --port 8080
```

## API 接口

### POST /decode

解码 BBL 文件。

```bash
# 二进制上传
curl -X POST http://localhost:8080/decode \
  -H "Content-Type: application/octet-stream" \
  --data-binary @file.BBL

# Base64 JSON
curl -X POST http://localhost:8080/decode \
  -H "Content-Type: application/json" \
  -d '{"bbl_base64": "BASE64_DATA"}'
```

### GET /health

健康检查。

```bash
curl http://localhost:8080/health
```

## 文件结构

```
bbl-decoder-standalone/
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── README.md
└── src/
    ├── __init__.py
    └── entry.py
```

## 系统要求

- Python 3.12+
- 内存: 512MB+
