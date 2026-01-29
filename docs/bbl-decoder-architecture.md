# BBL Decoder 架构文档

## 整体流程

```
用户上传                    BBL Decoder                      AI 分析
┌─────────────┐            ┌─────────────┐                 ┌─────────────┐
│ BBL 文件    │───────────▶│ Python 服务  │────────────────▶│ GPT-5.1     │
│ (1-10MB)    │            │ (orangebox)  │                 │             │
├─────────────┤            ├─────────────┤                 │  分析数据   │
│ CLI Dump    │────────────┼─────────────┼────────────────▶│  +          │
│ (必选 ~27KB)│            │             │                 │  用户配置   │
└─────────────┘            │ 输出:       │                 │             │
                           │ - meta      │                 └──────┬──────┘
                           │ - stats     │                        │
                           │ - cli (4级) │                        ▼
                           │ - frames    │                 ┌─────────────┐
                           │ ≤100K chars │                 │AnalysisResult│
                           └─────────────┘                 │ - summary   │
                                                           │ - issues    │
                                                           │ - pid       │
                                                           │ - filters   │
                                                           │ - cli_cmds  │
                                                           └─────────────┘
```

## 数据流详情

### 1. 用户上传 (必选)

| 文件 | 格式 | 大小 | 说明 |
|------|------|------|------|
| BBL 文件 | .BBL | 1-10MB | Betaflight 黑匣子日志 |
| CLI Dump | .txt | ~27KB | `diff all` 命令导出 |

### 2. BBL Decoder 输出

```json
{
  "task": "diagnose",
  "meta": {
    "fw": "Betaflight 4.5.2",
    "board": "JHEF JHEF745V2",
    "duration_s": 12.4,
    "total_frames": 24607,
    "sample_rate_hz": 100,
    "points": 616
  },
  "cli": {
    "A_core": "set firmwareVersion = ...\nset looptime = ...",
    "B_filters": "set rollPID = ...\nset dterm_lpf1_dyn_hz = ...",
    "C_controls": { "rc_rates": [64,64,64], "deadband": 5 },
    "D_context": { "mixer_type": "LEGACY", "features": 268795912 }
  },
  "stats": {
    "gyro_rms": { "r": 13.6, "p": 26.8, "y": 7.0 },
    "gyro_peak_hz": { "r": 215, "p": 226, "y": 273 },
    "motor_avg": [456, 470, 463, 465],
    "motor_max": [1669, 1670, 1670, 1670],
    "motor_imbalance": 0.016,
    "vbat": [19.88, 23.49],
    "amp": [10.6, 31.8]
  },
  "schema": { ... },
  "frames": {
    "t": [25945, 25965, ...],
    "rc": [[0,0,0,1000], ...],
    "sp": [[0.0,0.0,0.0], ...],
    "g": [[0.0,-1.0,0.0], ...],
    "p": [[0,0,-3,0,1,0,1,0], ...],
    "m": [[169,165,162,158], ...],
    "rpm": [[232,237,232,232], ...],
    "v": [23.38, 23.34, ...],
    "a": [0.3, 0.2, ...]
  }
}
```

### 3. AI 返回格式 (AnalysisResult)

```json
{
  "analysis": {
    "summary": "分析摘要...",
    "issues": ["问题1", "问题2", ...],
    "recommendations": ["建议1", "建议2", ...]
  },
  "pid": {
    "roll": { "p": 52, "i": 80, "d": 36, "f": 120 },
    "pitch": { "p": 56, "i": 84, "d": 40, "f": 125 },
    "yaw": { "p": 50, "i": 85, "d": 0, "f": 120 }
  },
  "filters": {
    "gyro_lowpass_hz": 250,
    "gyro_lowpass2_hz": 500,
    "dterm_lowpass_hz": 90,
    "dterm_lowpass2_hz": 150,
    "dyn_notch_count": 2,
    "dyn_notch_q": 250,
    "dyn_notch_min_hz": 100,
    "dyn_notch_max_hz": 600
  },
  "other": {
    "dshot_bidir": true,
    "motor_output_limit": 100,
    "throttle_boost": 3,
    "anti_gravity_gain": 60
  },
  "cli_commands": "set p_roll = 52\nset i_roll = 80\n..."
}
```

## 关键参数

| 参数 | 值 | 说明 |
|------|-----|------|
| MAX_PAYLOAD_CHARS | 100,000 | Decoder 输出上限 |
| MAX_OUTPUT_POINTS | 750 | 最大采样点数 |
| 默认采样率 | 100Hz | V1 目标 |
| 自动降采样序列 | 250→200→150→100→50→25→10Hz | 超限时自动降级 |

## 测试结果

| 测试文件 | 大小 | 飞行时长 | Decoder 输出 | 采样率 | 点数 |
|----------|------|----------|--------------|--------|------|
| 1MB BBL | 1.0 MB | 12.4s | 78,542 chars | 100Hz | 616 |
| 10MB BBL | 9.8 MB | 1.6s | 50,087 chars | 250Hz | 415 |

## Token 使用统计

| 项目 | 值 |
|------|-----|
| BBL Decoder 输出 | ~78K chars |
| CLI Dump | ~27K chars |
| Prompt 总计 | ~107K chars |
| Prompt Tokens | ~60K |
| Completion Tokens | ~1.8K |
| Total Tokens | ~62K |

---

## 待解决问题

### 1. BBL Decoder 部署

**问题**: Cloudflare Workers 不支持 Python Worker 启动超时

```
Python Worker startup exceeded CPU limit 1882<=1000
```

**原因**: orangebox 库太大，启动时间超过 Cloudflare 限制

**解决方案**: 部署到 Fly.io

```bash
# 已有配置文件
workers/bbl-decoder/fly.toml
workers/bbl-decoder/Dockerfile

# 部署命令
fly deploy --config workers/bbl-decoder/fly.toml
```

**部署后需要更新**:
- `wrangler.jsonc` 中的 `BBL_DECODER_URL` 环境变量
- 指向 Fly.io 部署的 URL: `https://fpvtune-bbl-decoder.fly.dev`

### 2. process-order.ts 更新

当前代码使用旧的 decoder 输出格式，需要更新为新格式：

**文件**: `src/lib/tune/process-order.ts`

**需要修改**:
1. 使用新的 `BBLAnalysisData` 类型
2. 直接将 decoder JSON 输出发送给 AI
3. 不再需要 `generateAISummary()` 转换

### 3. 类型定义同步

**文件**: `src/lib/tune/bbl-decoder-client.ts`

已更新为新格式，包含:
- `BBLCliSections`
- `BBLStats`
- `BBLSchema`
- `BBLFrames`
- `BBLAnalysisData`

### 4. 前端验证

CLI Dump 已设为必选 (tune-wizard.tsx 第116行):
```typescript
case 1:
  return formData.blackboxFile !== null && formData.cliDumpFile !== null;
```

---

## 文件清单

| 文件 | 说明 |
|------|------|
| `workers/bbl-decoder/src/entry.py` | BBL Decoder 主代码 |
| `workers/bbl-decoder/fly.toml` | Fly.io 部署配置 |
| `workers/bbl-decoder/Dockerfile` | Docker 构建文件 |
| `src/lib/tune/bbl-decoder-client.ts` | TypeScript 类型定义 |
| `src/lib/tune/process-order.ts` | 订单处理逻辑 (待更新) |
| `src/lib/openai.ts` | AI Prompt 模板 |
| `docs/bbl-ai-test-result.json` | 完整测试数据 |

---

## 下一步行动

1. [ ] 部署 BBL Decoder 到 Fly.io
2. [ ] 更新 `BBL_DECODER_URL` 环境变量
3. [ ] 更新 `process-order.ts` 使用新格式
4. [ ] 端到端测试完整流程
5. [ ] 生产环境验证
workers/bbl-decoder/src/entry.py
