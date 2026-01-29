# BBL Decoder Service

Betaflight Blackbox Log (BBL) 解码服务，使用 Python + orangebox 库解析 BBL 文件。

## 技术栈

- **Cloudflare Workers (Python)** - Serverless 运行环境
- **FastAPI** - HTTP 框架
- **orangebox** - BBL 解析库

## 本地开发

### 前置条件

- Python 3.12+
- [uv](https://github.com/astral-sh/uv) 包管理器

### 安装依赖

```bash
cd workers/bbl-decoder
uv sync
```

### 启动开发服务器

```bash
uv run pywrangler dev
```

服务将在 `http://localhost:8787` 启动。

### 测试解码

```bash
# 使用 curl 测试
curl -X POST http://localhost:8787/decode \
  -H "Content-Type: application/octet-stream" \
  --data-binary @/path/to/your/file.BBL
```

## API 接口

### POST /decode

解码 BBL 文件并返回结构化 JSON。

**请求**:
- Content-Type: `application/octet-stream`
- Body: BBL 文件二进制内容

**响应**:
```json
{
  "task": "diagnose",
  "meta": {
    "firmwareVersion": "4.5.2",
    "board": "JHEF745V2",
    "looptime_us": 125,
    "pid_process_denom": 2,
    "gyro_sync_denom": 1,
    "log_duration_s": 62.3,
    "total_frames": 24607
  },
  "config": {
    "pid": {
      "roll": {"p": 45, "i": 80, "d": 40, "f": 120},
      "pitch": {"p": 47, "i": 84, "d": 46, "f": 125},
      "yaw": {"p": 45, "i": 80, "d": 0, "f": 120}
    },
    "filters": {
      "gyro_lpf_hz": [250, 500],
      "dyn_notch": {"count": 1, "min_hz": 100, "max_hz": 600, "q": 500},
      "dterm_lpf_hz": [75, 150]
    },
    "throttle": {
      "min_throttle": 1070,
      "max_throttle": 2000,
      "throttle_limit_percent": 70,
      "digital_idle": 550
    }
  },
  "features": {
    "gyro": {
      "rms": {"roll": 12.3, "pitch": 15.1, "yaw": 8.2},
      "peak_hz": {"roll": 120.5, "pitch": 135.2, "yaw": 45.0}
    },
    "motor": {
      "saturation_ratio": 0.02,
      "imbalance_ratio": 0.05
    },
    "battery": {
      "vbat_min": 14.2,
      "vbat_sag": 0.8
    }
  },
  "samples": {
    "time_ms": [0, 100, 200, ...],
    "gyro": {"roll": [...], "pitch": [...], "yaw": [...]},
    "setpoint": {"roll": [...], "pitch": [...], "yaw": [...]},
    "motor": {"m1": [...], "m2": [...], "m3": [...], "m4": [...]}
  }
}
```

### GET /health

健康检查接口。

**响应**:
```json
{"status": "ok", "service": "bbl-decoder"}
```

## 部署

```bash
uv run pywrangler deploy
```

## 与主服务集成

在主 Worker 中通过 Service Binding 或 HTTP 调用此服务：

```typescript
import { decodeBBLWithHTTP } from '@/lib/tune/bbl-decoder-client';

const result = await decodeBBLWithHTTP(
  process.env.BBL_DECODER_URL,
  bblArrayBuffer
);
```
