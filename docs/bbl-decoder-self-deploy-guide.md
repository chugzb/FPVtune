# BBL Decoder 自部署教程

本文档介绍如何将 BBL Decoder 服务部署到自己的服务器。

## 项目概述

BBL Decoder 是一个 Python FastAPI 服务，用于解析 Betaflight Blackbox Log (BBL) 文件，输出标准化 JSON 供 AI 分析。

### 核心依赖

- Python 3.12+
- FastAPI - HTTP 框架
- uvicorn - ASGI 服务器
- orangebox - BBL 解析库

## 方式一: Docker 部署 (推荐)

### 1. 准备文件

创建项目目录并添加以下文件:

```bash
mkdir bbl-decoder && cd bbl-decoder
```

### 2. 创建 requirements.txt

```txt
fastapi==0.115.0
uvicorn==0.30.0
orangebox==0.4.0
```

### 3. 创建 Dockerfile

```dockerfile
FROM python:3.12-slim

WORKDIR /app

# 安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY src/ ./src/

# 暴露端口
EXPOSE 8080

# 启动命令
CMD ["uvicorn", "src.entry:app", "--host", "0.0.0.0", "--port", "8080"]
```

### 4. 创建源代码目录

```bash
mkdir -p src
touch src/__init__.py
```

### 5. 创建 src/entry.py

将下面的完整代码保存到 `src/entry.py`:

```python
"""
BBL (Betaflight Blackbox Log) Decoder Service
输出标准化 JSON 供 AI 分析，payload <= 100K chars
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import Response
import base64
import json
import math
from typing import Any

app = FastAPI()

MAX_PAYLOAD_CHARS = 100000
MAX_OUTPUT_POINTS = 750
TARGET_HZ_LIST = [250, 200, 150, 100, 50, 25, 10]


def safe_int(val, default=0):
    if val is None or val == '':
        return default
    try:
        return int(val)
    except (ValueError, TypeError):
        return default


def safe_float(val, default=0.0):
    if val is None or val == '':
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default


def calculate_rms(values: list[float]) -> float:
    if not values:
        return 0.0
    squared = [v * v for v in values]
    return math.sqrt(sum(squared) / len(squared))


def calculate_peak_frequency(values: list[float], sample_rate: float) -> float:
    if len(values) < 10:
        return 0.0
    zero_crossings = 0
    for i in range(1, len(values)):
        if (values[i-1] >= 0 and values[i] < 0) or (values[i-1] < 0 and values[i] >= 0):
            zero_crossings += 1
    duration = len(values) / sample_rate
    if duration > 0:
        return zero_crossings / (2 * duration)
    return 0.0
```

```python
# CLI 字段白名单
CLI_A_CORE = {
    'firmwareType', 'firmware', 'firmwarePatch', 'firmwareVersion',
    'Firmware revision', 'Firmware date', 'Board information', 'Craft name',
    'looptime', 'gyro_sync_denom', 'pid_process_denom',
    'frameIntervalI', 'frameIntervalPNum', 'frameIntervalPDenom',
    'gyro_scale', 'acc_1G', 'vbatscale', 'vbatref',
    'currentMeterOffset', 'currentMeterScale',
    'minthrottle', 'maxthrottle', 'motorOutput',
    'motor_output_limit', 'throttle_limit_type', 'throttle_limit_percent',
    'dshot_idle_value', 'dshot_bidir', 'motor_poles',
}

CLI_B_FILTERS = {
    'rollPID', 'pitchPID', 'yawPID', 'pidSumLimit', 'pidSumLimitYaw', 'pidAtMinThrottle',
    'd_max_gain', 'd_max_advance',
    'dterm_filter_type', 'dterm_lpf_hz', 'dterm_lpf1_dyn_hz', 'dterm_lpf_dyn_expo',
    'dterm_filter2_type', 'dterm_lpf2_hz', 'dterm_notch_hz', 'dterm_notch_cutoff', 'yaw_lpf_hz',
    'gyro_lpf', 'gyro_soft_type', 'gyro_lowpass_hz', 'gyro_lpf1_dyn_hz', 'gyro_lowpass_dyn_expo',
    'gyro_soft2_type', 'gyro_lowpass2_hz', 'gyro_notch_hz', 'gyro_notch_cutoff',
    'gyro_rpm_notch_harmonics', 'gyro_rpm_notch_q', 'gyro_rpm_notch_min',
    'rpm_filter_fade_range_hz', 'rpm_notch_lpf',
    'dyn_notch_count', 'dyn_notch_min_hz', 'dyn_notch_max_hz', 'dyn_notch_q',
    'ff_weight',
}

CLI_C_CONTROLS = {
    'thrMid', 'thrExpo', 'rc_rates', 'rc_expo', 'rates', 'rate_limits', 'rates_type',
    'deadband', 'yaw_deadband',
    'itermWindupPointPercent', 'iterm_relax', 'iterm_relax_type', 'iterm_relax_cutoff',
    'anti_gravity_gain', 'anti_gravity_cutoff_hz', 'anti_gravity_p_gain',
    'abs_control_gain', 'use_integrated_yaw',
    'ff_transition', 'ff_averaging', 'ff_smooth_factor', 'ff_jitter_factor',
    'ff_boost', 'ff_max_rate_limit', 'yawRateAccelLimit', 'rateAccelLimit',
}

CLI_D_CONTEXT = {
    'Log start datetime', 'mixer_type', 'acc_lpf_hz', 'acc_hardware', 'baro_hardware',
    'gyro_cal_on_first_arm', 'airmode_activate_throttle', 'serialrx_provider',
    'unsynced_fast_pwm', 'fast_pwm_protocol', 'motor_pwm_rate', 'features',
    'fields_disabled_mask', 'blackbox_high_resolution', 'vbat_sag_compensation',
    'dynamic_idle_min_rpm', 'dyn_idle_p_gain', 'dyn_idle_i_gain', 'dyn_idle_d_gain',
    'dyn_idle_max_increase', 'dyn_idle_start_increase',
    'rc_smoothing_mode', 'rc_smoothing_feedforward_hz', 'rc_smoothing_setpoint_hz',
    'rc_smoothing_throttle_hz',
    'simplified_pids_mode', 'simplified_master_multiplier', 'simplified_i_gain',
    'simplified_d_gain', 'simplified_pi_gain', 'simplified_d_max_gain',
    'simplified_feedforward_gain', 'simplified_pitch_d_gain', 'simplified_pitch_pi_gain',
    'simplified_dterm_filter', 'simplified_dterm_filter_multiplier',
    'simplified_gyro_filter', 'simplified_gyro_filter_multiplier',
    'throttle_boost', 'throttle_boost_cutoff', 'thrust_linear',
}
```

```python
def format_cli_value(val) -> str:
    """格式化 CLI 值"""
    if isinstance(val, list):
        return ','.join(str(v) for v in val)
    return str(val)


def build_cli_sections(headers: dict) -> dict:
    """构建 CLI 分级输出"""
    a_lines = []
    b_lines = []
    c_kv = {}
    d_kv = {}

    for key, val in headers.items():
        if val is None or val == '':
            continue

        if key in CLI_A_CORE:
            a_lines.append(f"set {key} = {format_cli_value(val)}")
        elif key in CLI_B_FILTERS:
            b_lines.append(f"set {key} = {format_cli_value(val)}")
        elif key in CLI_C_CONTROLS:
            c_kv[key] = val
        elif key in CLI_D_CONTEXT:
            d_kv[key] = val

    return {
        'A_core': '\n'.join(a_lines),
        'B_filters': '\n'.join(b_lines),
        'C_controls': c_kv,
        'D_context': d_kv,
    }


def parse_bbl_to_json(bbl_bytes: bytes, cli_text: str = None) -> dict[str, Any]:
    """解析 BBL 文件，输出 <= 100K chars 的 JSON"""
    from orangebox import Parser
    import tempfile
    import os

    with tempfile.NamedTemporaryFile(delete=False, suffix='.BBL') as tmp:
        tmp.write(bbl_bytes)
        tmp_path = tmp.name

    try:
        parser = Parser.load(tmp_path)
    finally:
        os.unlink(tmp_path)

    headers = parser.headers
    field_names = parser.field_names
    frames_list = list(parser.frames())
    field_idx = {name: i for i, name in enumerate(field_names)}

    # 计算采样率
    looptime = safe_int(headers.get('looptime'), 125)
    pid_process_denom = safe_int(headers.get('pid_process_denom'), 1)
    sample_interval_us = looptime * pid_process_denom
    sample_rate = 1_000_000 / sample_interval_us
```

```python
    # 收集所有帧数据
    all_time_us = []
    all_rc = [[], [], [], []]
    all_setpoint = [[], [], []]
    all_gyro = [[], [], []]
    all_axis_p = [[], []]
    all_axis_i = [[], []]
    all_axis_d = [[], []]
    all_axis_f = [[], []]
    all_motor = [[], [], [], []]
    all_erpm = [[], [], [], []]
    all_vbat = []
    all_amperage = []

    # 字段索引
    time_idx = field_idx.get('time', -1)
    gyro_idx = [field_idx.get(f'gyroADC[{i}]', -1) for i in range(3)]
    rc_idx = [field_idx.get(f'rcCommand[{i}]', -1) for i in range(4)]
    setpoint_idx = [field_idx.get(f'setpoint[{i}]', -1) for i in range(3)]
    axis_p_idx = [field_idx.get(f'axisP[{i}]', -1) for i in range(2)]
    axis_i_idx = [field_idx.get(f'axisI[{i}]', -1) for i in range(2)]
    axis_d_idx = [field_idx.get(f'axisD[{i}]', -1) for i in range(2)]
    axis_f_idx = [field_idx.get(f'axisF[{i}]', -1) for i in range(2)]
    motor_idx = [field_idx.get(f'motor[{i}]', -1) for i in range(4)]
    erpm_idx = [field_idx.get(f'eRPM[{i}]', -1) for i in range(4)]
    vbat_idx = field_idx.get('vbatLatest', -1)
    amperage_idx = field_idx.get('amperageLatest', -1)

    for idx, frame in enumerate(frames_list):
        data = frame.data

        if time_idx >= 0:
            try:
                all_time_us.append(int(data[time_idx]))
            except:
                all_time_us.append(idx * sample_interval_us)
        else:
            all_time_us.append(idx * sample_interval_us)

        for r in range(4):
            if rc_idx[r] >= 0:
                all_rc[r].append(safe_float(data[rc_idx[r]]))
        for s in range(3):
            if setpoint_idx[s] >= 0:
                all_setpoint[s].append(safe_float(data[setpoint_idx[s]]))
        for g in range(3):
            if gyro_idx[g] >= 0:
                all_gyro[g].append(safe_float(data[gyro_idx[g]]))
        for p in range(2):
            if axis_p_idx[p] >= 0:
                all_axis_p[p].append(safe_float(data[axis_p_idx[p]]))
            if axis_i_idx[p] >= 0:
                all_axis_i[p].append(safe_float(data[axis_i_idx[p]]))
            if axis_d_idx[p] >= 0:
                all_axis_d[p].append(safe_float(data[axis_d_idx[p]]))
            if axis_f_idx[p] >= 0:
                all_axis_f[p].append(safe_float(data[axis_f_idx[p]]))
        for m in range(4):
            if motor_idx[m] >= 0:
                all_motor[m].append(safe_float(data[motor_idx[m]]))
            if erpm_idx[m] >= 0:
                all_erpm[m].append(safe_float(data[erpm_idx[m]]))
        if vbat_idx >= 0:
            all_vbat.append(safe_float(data[vbat_idx]))
        if amperage_idx >= 0:
            all_amperage.append(safe_float(data[amperage_idx]))

    total_frames = len(all_time_us)
    duration_s = (all_time_us[-1] - all_time_us[0]) / 1_000_000 if all_time_us else 0
```

```python
    # 统计特征
    gyro_rms = {
        'r': round(calculate_rms(all_gyro[0]), 1),
        'p': round(calculate_rms(all_gyro[1]), 1),
        'y': round(calculate_rms(all_gyro[2]), 1) if all_gyro[2] else 0,
    }
    gyro_peak = {
        'r': round(calculate_peak_frequency(all_gyro[0], sample_rate), 0),
        'p': round(calculate_peak_frequency(all_gyro[1], sample_rate), 0),
        'y': round(calculate_peak_frequency(all_gyro[2], sample_rate), 0) if all_gyro[2] else 0,
    }

    motor_avgs = [sum(m)/len(m) if m else 0 for m in all_motor]
    motor_max = [max(m) if m else 0 for m in all_motor]
    avg_all = sum(motor_avgs) / 4 if motor_avgs else 0
    imbalance = max(abs(a - avg_all) / avg_all for a in motor_avgs) if avg_all > 0 else 0

    vbat_min = min(all_vbat) / 100 if all_vbat else 0
    vbat_max = max(all_vbat) / 100 if all_vbat else 0
    amp_max = max(all_amperage) / 100 if all_amperage else 0
    amp_avg = (sum(all_amperage) / len(all_amperage) / 100) if all_amperage else 0

    # CLI 分级
    cli = build_cli_sections(headers)

    # 构建基础结构（不含 frames）
    def build_result(target_hz: int) -> dict:
        step = max(1, int(sample_rate / target_hz))
        indices = list(range(0, total_frames, step))
        points = len(indices)

        # t: 转换为 ms，整数
        t_ms = [int(all_time_us[i] / 1000) for i in indices if i < len(all_time_us)]

        # frames 数组化
        frames = {
            't': t_ms,
            'rc': [
                [int(all_rc[0][i]), int(all_rc[1][i]), int(all_rc[2][i]), int(all_rc[3][i])]
                for i in indices if i < len(all_rc[0])
            ],
            'sp': [
                [round(all_setpoint[0][i], 1), round(all_setpoint[1][i], 1), round(all_setpoint[2][i], 1)]
                for i in indices if i < len(all_setpoint[0])
            ],
            'g': [
                [round(all_gyro[0][i], 1), round(all_gyro[1][i], 1), round(all_gyro[2][i], 1)]
                for i in indices if i < len(all_gyro[0])
            ],
            'p': [
                [
                    int(all_axis_p[0][i]) if i < len(all_axis_p[0]) else 0,
                    int(all_axis_i[0][i]) if i < len(all_axis_i[0]) else 0,
                    int(all_axis_d[0][i]) if i < len(all_axis_d[0]) else 0,
                    int(all_axis_f[0][i]) if i < len(all_axis_f[0]) else 0,
                    int(all_axis_p[1][i]) if i < len(all_axis_p[1]) else 0,
                    int(all_axis_i[1][i]) if i < len(all_axis_i[1]) else 0,
                    int(all_axis_d[1][i]) if i < len(all_axis_d[1]) else 0,
                    int(all_axis_f[1][i]) if i < len(all_axis_f[1]) else 0,
                ]
                for i in indices if i < len(all_axis_p[0])
            ],
            'm': [
                [int(all_motor[0][i]), int(all_motor[1][i]), int(all_motor[2][i]), int(all_motor[3][i])]
                for i in indices if i < len(all_motor[0])
            ],
            'rpm': [
                [int(all_erpm[0][i]) if i < len(all_erpm[0]) and all_erpm[0] else 0,
                 int(all_erpm[1][i]) if i < len(all_erpm[1]) and all_erpm[1] else 0,
                 int(all_erpm[2][i]) if i < len(all_erpm[2]) and all_erpm[2] else 0,
                 int(all_erpm[3][i]) if i < len(all_erpm[3]) and all_erpm[3] else 0]
                for i in indices if i < len(all_erpm[0]) or True
            ][:points] if all_erpm[0] else [],
            'v': [round(all_vbat[i] / 100, 2) for i in indices if i < len(all_vbat)] if all_vbat else [],
            'a': [round(all_amperage[i] / 100, 1) for i in indices if i < len(all_amperage)] if all_amperage else [],
        }

        return {
            'task': 'diagnose',
            'meta': {
                'fw': headers.get('Firmware revision', ''),
                'board': headers.get('Board information', ''),
                'craft': headers.get('Craft name', ''),
                'duration_s': round(duration_s, 1),
                'total_frames': total_frames,
                'sample_rate_hz': target_hz,
                'points': points,
            },
            'cli': cli,
            'stats': {
                'gyro_rms': gyro_rms,
                'gyro_peak_hz': gyro_peak,
                'motor_avg': [round(a, 0) for a in motor_avgs],
                'motor_max': [int(m) for m in motor_max],
                'motor_imbalance': round(imbalance, 3),
                'vbat': [round(vbat_min, 2), round(vbat_max, 2)],
                'amp': [round(amp_avg, 1), round(amp_max, 1)],
            },
            'schema': {
                'frames_order': ['t', 'rc', 'sp', 'g', 'p', 'm', 'rpm', 'v', 'a'],
                'rc_order': ['r', 'p', 'y', 't'],
                'axis_order': ['r', 'p', 'y'],
                'p_order': ['Pr', 'Ir', 'Dr', 'Fr', 'Pp', 'Ip', 'Dp', 'Fp'],
                'm_order': ['m1', 'm2', 'm3', 'm4'],
                'units': {'g': 'deg/s', 'sp': 'deg/s', 't': 'ms', 'v': 'V', 'a': 'A'},
                'quantize': {'g': 1, 'sp': 1, 'v': 2, 'a': 1, 'p': 0, 'm': 0, 'rpm': 0},
            },
            'frames': frames,
        }

    # 自动降采样直到 <= 100K chars
    for target_hz in TARGET_HZ_LIST:
        result = build_result(target_hz)
        compact = json.dumps(result, ensure_ascii=False, separators=(',', ':'))
        if len(compact) <= MAX_PAYLOAD_CHARS:
            return result

    # 如果最低采样率还是太大，强制截断
    result = build_result(TARGET_HZ_LIST[-1])
    frames = result['frames']

    if len(frames['t']) > MAX_OUTPUT_POINTS:
        frames['t'] = frames['t'][:MAX_OUTPUT_POINTS]
        frames['rc'] = frames['rc'][:MAX_OUTPUT_POINTS]
        frames['sp'] = frames['sp'][:MAX_OUTPUT_POINTS]
        frames['g'] = frames['g'][:MAX_OUTPUT_POINTS]
        frames['p'] = frames['p'][:MAX_OUTPUT_POINTS]
        frames['m'] = frames['m'][:MAX_OUTPUT_POINTS]
        if frames['rpm']:
            frames['rpm'] = frames['rpm'][:MAX_OUTPUT_POINTS]
        if frames['v']:
            frames['v'] = frames['v'][:MAX_OUTPUT_POINTS]
        if frames['a']:
            frames['a'] = frames['a'][:MAX_OUTPUT_POINTS]
        result['meta']['points'] = MAX_OUTPUT_POINTS

    return result
```

```python
@app.post("/decode")
async def decode_bbl(request: Request):
    """解码 BBL 文件"""
    try:
        content_type = request.headers.get('content-type', '')

        if 'application/json' in content_type:
            body = await request.json()
            bbl_base64 = body.get('bbl_base64')
            if not bbl_base64:
                raise HTTPException(status_code=400, detail="Missing bbl_base64 field")
            bbl_bytes = base64.b64decode(bbl_base64)
            cli_text = body.get('cli_text')
        else:
            bbl_bytes = await request.body()
            cli_text = None

        if not bbl_bytes:
            raise HTTPException(status_code=400, detail="Empty BBL data")

        result = parse_bbl_to_json(bbl_bytes, cli_text)
        compact_json = json.dumps(result, ensure_ascii=False, separators=(',', ':'))
        return Response(content=compact_json, media_type="application/json")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to decode BBL: {str(e)}")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "bbl-decoder"}
```

### 6. 构建并运行 Docker 容器

```bash
# 构建镜像
docker build -t bbl-decoder .

# 运行容器
docker run -d -p 8080:8080 --name bbl-decoder bbl-decoder

# 查看日志
docker logs -f bbl-decoder
```

### 7. 测试服务

```bash
# 健康检查
curl http://localhost:8080/health

# 解码 BBL 文件
curl -X POST http://localhost:8080/decode \
  -H "Content-Type: application/octet-stream" \
  --data-binary @/path/to/your/file.BBL
```

---

## 方式二: 直接运行 (无 Docker)

### 1. 安装 Python 3.12+

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3.12 python3.12-venv python3-pip

# macOS (使用 Homebrew)
brew install python@3.12
```

### 2. 创建项目目录

```bash
mkdir bbl-decoder && cd bbl-decoder
mkdir src
```

### 3. 创建虚拟环境

```bash
python3.12 -m venv venv
source venv/bin/activate  # Linux/macOS
# 或 Windows: venv\Scripts\activate
```

### 4. 安装依赖

```bash
pip install fastapi==0.115.0 uvicorn==0.30.0 orangebox==0.4.0
```

### 5. 创建源代码文件

将上面的 `src/__init__.py` 和 `src/entry.py` 代码保存到对应文件。

### 6. 启动服务

```bash
uvicorn src.entry:app --host 0.0.0.0 --port 8080
```

---

## 方式三: 使用 systemd 管理服务

### 1. 创建 systemd 服务文件

```bash
sudo nano /etc/systemd/system/bbl-decoder.service
```

内容:

```ini
[Unit]
Description=BBL Decoder Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/bbl-decoder
Environment="PATH=/opt/bbl-decoder/venv/bin"
ExecStart=/opt/bbl-decoder/venv/bin/uvicorn src.entry:app --host 0.0.0.0 --port 8080
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### 2. 启动服务

```bash
sudo systemctl daemon-reload
sudo systemctl enable bbl-decoder
sudo systemctl start bbl-decoder
sudo systemctl status bbl-decoder
```

---

## 方式四: 使用 Nginx 反向代理 + SSL

### 1. 安装 Nginx

```bash
sudo apt install nginx
```

### 2. 配置 Nginx

```bash
sudo nano /etc/nginx/sites-available/bbl-decoder
```

内容:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 50M;
    }
}
```

### 3. 启用配置

```bash
sudo ln -s /etc/nginx/sites-available/bbl-decoder /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. 配置 SSL (使用 Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## API 接口说明

### POST /decode

解码 BBL 文件并返回结构化 JSON。

**请求方式 1 - 二进制上传:**
```bash
curl -X POST https://your-domain.com/decode \
  -H "Content-Type: application/octet-stream" \
  --data-binary @file.BBL
```

**请求方式 2 - Base64 JSON:**
```bash
curl -X POST https://your-domain.com/decode \
  -H "Content-Type: application/json" \
  -d '{"bbl_base64": "BASE64_ENCODED_BBL_DATA"}'
```

**响应示例:**
```json
{
  "task": "diagnose",
  "meta": {
    "fw": "Betaflight 4.5.2",
    "board": "JHEF745V2",
    "craft": "MyQuad",
    "duration_s": 62.3,
    "total_frames": 24607,
    "sample_rate_hz": 100,
    "points": 623
  },
  "cli": {
    "A_core": "set looptime = 125\nset pid_process_denom = 2",
    "B_filters": "set gyro_lpf_hz = 250",
    "C_controls": {},
    "D_context": {}
  },
  "stats": {
    "gyro_rms": {"r": 12.3, "p": 15.1, "y": 8.2},
    "gyro_peak_hz": {"r": 120, "p": 135, "y": 45},
    "motor_avg": [1200, 1180, 1220, 1190],
    "motor_max": [1800, 1750, 1820, 1780],
    "motor_imbalance": 0.05,
    "vbat": [14.2, 16.8],
    "amp": [15.5, 45.2]
  },
  "frames": {
    "t": [0, 10, 20, ...],
    "g": [[12.3, 15.1, 8.2], ...],
    "m": [[1200, 1180, 1220, 1190], ...]
  }
}
```

### GET /health

健康检查接口。

```bash
curl https://your-domain.com/health
# {"status": "ok", "service": "bbl-decoder"}
```

---

## 环境变量配置 (可选)

如需自定义配置，可以添加环境变量:

```bash
# .env 文件
MAX_PAYLOAD_CHARS=100000
MAX_OUTPUT_POINTS=750
```

---

## 常见问题

### Q: orangebox 安装失败?

A: 确保使用 Python 3.12+，并安装编译依赖:
```bash
sudo apt install build-essential python3-dev
```

### Q: 内存不足?

A: BBL 文件较大时需要更多内存，建议至少 512MB RAM。

### Q: 如何限制请求大小?

A: 在 Nginx 配置中设置 `client_max_body_size`，或在 FastAPI 中添加中间件。

---

## 完整项目结构

```
bbl-decoder/
├── Dockerfile
├── requirements.txt
├── src/
│   ├── __init__.py
│   └── entry.py
└── venv/  (如果不用 Docker)
```
