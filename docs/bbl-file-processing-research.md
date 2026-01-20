# BBL 文件处理调研报告

## 1. BBL 文件格式分析

### 1.1 文件结构

BBL (Betaflight Blackbox Log) 文件由两部分组成：

1. **头部区域 (Header Section)** - 纯 ASCII 文本
   - 以 `H Product:Blackbox flight data recorder by Nicholas Sherlock` 开始
   - 每行格式: `H fieldname:value\n`
   - 包含所有飞控配置参数（PID、滤波器、速率等）
   - 典型大小: 5-10KB

2. **数据区域 (Data Section)** - 二进制编码
   - 紧跟在头部之后，以 `I` 帧标记开始
   - 使用多种压缩编码（Variable Byte、ZigZag、Elias Delta 等）
   - 包含飞行时序数据（陀螺仪、电机输出、RC 输入等）
   - 典型采样率: 900Hz，约 25KB/s

### 1.2 帧类型

| 帧类型 | 名称 | 说明 |
|--------|------|------|
| I | Intra Frame | 关键帧，可独立解码 |
| P | Inter Frame | 差分帧，依赖前一帧 |
| G | GPS Frame | GPS 数据帧 |
| H | Home Frame | GPS 参考点帧 |
| S | Slow Frame | 低频状态帧（飞行模式等） |
| E | Event Frame | 事件帧（设置变更等） |

### 1.3 头部包含的关键配置

从测试文件分析，头部包含以下 PID 调参相关信息：

```
H Firmware revision:Betaflight 4.5.2 (024f8e13d) STM32F745
H Board information:JHEF JHEF745V2
H rollPID:45,80,40
H pitchPID:47,84,46
H yawPID:45,80,0
H d_min:30,34,0
H d_max_gain:37
H dterm_lpf1_static_hz:75
H dterm_lpf1_dyn_hz:75,150
H dterm_lpf2_static_hz:150
H gyro_lpf1_static_hz:250
H gyro_lpf1_dyn_hz:250,500
H tpa_rate:65
H tpa_breakpoint:1350
H ff_weight:120,125,120
H feedforward_smooth_factor:25
H feedforward_jitter_factor:7
H iterm_relax_cutoff:15
H anti_gravity_gain:80
... (更多配置)
```

## 2. 可用解析工具对比

### 2.1 blackbox-log (npm)

- **状态**: 已弃用 (deprecated)
- **语言**: TypeScript + WebAssembly (Rust 编译)
- **特点**:
  - 完整解析头部和数据
  - 浏览器和 Node.js 兼容
  - 无外部依赖
- **问题**:
  - 不再维护
  - 每周下载量仅 4 次
- **结论**: 不推荐使用

### 2.2 orangebox (Python)

- **状态**: 活跃维护
- **语言**: Python 3
- **特点**:
  - 纯 Python 实现，无外部依赖
  - 与官方 Blackbox Log Viewer 输出一致
  - 完整文档
- **安装**: `pip install orangebox`
- **用法**:
  ```python
  from orangebox import Parser
  parser = Parser.load("flight.bbl")
  for frame in parser.frames():
      print(frame)
  ```
- **结论**: 适合 Python 后端，但不适合 Node.js/Cloudflare Workers

### 2.3 blackbox_decode (官方 CLI)

- **状态**: 官方工具
- **语言**: C
- **特点**:
  - 将 BBL 转换为 CSV
  - 最权威的解析实现
- **问题**:
  - 需要编译安装
  - 不适合 serverless 环境
- **结论**: 适合本地开发，不适合生产环境

### 2.4 telemetry-parser (Rust)

- **状态**: 活跃维护
- **语言**: Rust
- **特点**:
  - 支持多种格式（GoPro、Insta360、BBL 等）
  - 高性能
  - 可编译为 WASM
- **结论**: 如需完整解析，可考虑编译为 WASM 使用

### 2.5 blackbox-log (Rust)

- **状态**: 活跃维护
- **语言**: Rust
- **特点**:
  - 专门针对 Betaflight/INAV
  - 有 TypeScript 绑定 (blackbox-log-ts)
- **结论**: 最专业的选择，但 TS 绑定已弃用

## 3. FPVTune 场景分析

### 3.1 AI 分析需要什么数据？

对于 PID 调参 AI 分析，主要需要：

1. **必需 - 头部配置数据**:
   - 当前 PID 值 (rollPID, pitchPID, yawPID)
   - 滤波器设置 (dterm_lpf, gyro_lpf)
   - TPA 设置
   - Feedforward 设置
   - 固件版本和飞控型号
   - 机架信息

2. **可选 - 时序数据**:
   - 陀螺仪噪声分析
   - 电机输出波动
   - RC 响应延迟
   - 振动频谱分析

### 3.2 关键发现

**头部数据已包含所有配置信息**，这些是 AI 分析的主要输入。时序数据主要用于：
- 噪声频谱分析
- 振动诊断
- 响应曲线分析

对于基础的 PID 调参建议，**仅头部数据就足够了**。

## 4. 推荐方案

### 方案 A: 仅提取头部 (推荐)

**原理**: BBL 头部是纯 ASCII 文本，可以直接提取，无需复杂解析。

**实现**:
```typescript
function extractBBLHeader(buffer: Buffer): string {
  // 头部以 "H Product:" 开始，以第一个非 "H " 开头的行结束
  const content = buffer.toString('utf-8');
  const lines = content.split('\n');
  const headerLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith('H ')) {
      headerLines.push(line);
    } else if (headerLines.length > 0 && !line.startsWith('H')) {
      // 遇到非头部行，停止
      break;
    }
  }

  return headerLines.join('\n');
}
```

**优点**:
- 实现简单，无外部依赖
- 适合 Cloudflare Workers 环境
- 头部数据足够 AI 分析
- 数据量小（5-10KB vs 1MB+）

**缺点**:
- 无法进行噪声频谱分析
- 无法分析实际飞行数据

### 方案 B: 使用 WASM 解析器

**原理**: 将 Rust 解析器编译为 WASM，在 Node.js/Workers 中运行。

**实现**:
1. 使用 blackbox-log Rust 库
2. 编译为 WASM
3. 在 TypeScript 中调用

**优点**:
- 完整解析所有数据
- 可进行频谱分析

**缺点**:
- 实现复杂
- WASM 文件较大（~500KB）
- Cloudflare Workers 有 WASM 限制

### 方案 C: 外部服务解析

**原理**: 部署独立的解析服务，通过 API 调用。

**实现**:
1. 部署 Python 服务（使用 orangebox）
2. 或部署 Rust 服务
3. 通过 HTTP API 调用

**优点**:
- 完整功能
- 不受 Workers 限制

**缺点**:
- 增加架构复杂度
- 额外的服务成本
- 网络延迟

## 5. 实施建议

### 5.1 短期方案 (推荐立即实施)

采用 **方案 A: 仅提取头部**

修改 `process-order.ts`:

```typescript
function extractBBLHeader(base64Content: string): string {
  const buffer = Buffer.from(base64Content, 'base64');
  const content = buffer.toString('utf-8');
  const lines = content.split('\n');
  const headerLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith('H ')) {
      headerLines.push(line);
    } else if (headerLines.length > 0 && !line.startsWith('H')) {
      break;
    }
  }

  return headerLines.join('\n');
}

// 在 runAIAnalysis 中使用
const blackboxHeader = extractBBLHeader(order.blackboxContent);
```

### 5.2 中期方案

如果需要更深入的分析（噪声频谱等）：

1. 评估是否真的需要时序数据
2. 如需要，考虑部署独立的 Python 解析服务
3. 或研究将 blackbox-log Rust 库编译为 WASM

### 5.3 数据存储优化

当前存储完整 BBL 文件（Base64）到数据库是合理的：
- 保留原始数据用于未来分析
- 可以随时重新处理

但可以考虑：
- 同时存储提取的头部（便于快速查询）
- 设置数据保留策略（如 30 天后删除原始文件）

## 6. 结论

1. **BBL 文件头部是纯 ASCII 文本**，包含所有 PID/滤波器配置
2. **对于 AI 调参分析，头部数据已足够**
3. **推荐方案**: 仅提取头部，避免复杂的二进制解析
4. **当前问题根因**: 之前代码将二进制数据当作 UTF-8 处理导致损坏
5. **修复方案**: 使用 Base64 存储原始数据，提取头部时再转换

## 7. 参考资料

- [Betaflight Blackbox Internals](https://betaflight.com/docs/development/Blackbox-Internals)
- [blackbox-log (Rust)](https://github.com/blackbox-log/blackbox-log)
- [orangebox (Python)](https://github.com/atomgomba/orangebox)
- [telemetry-parser](https://github.com/AdrianEddy/telemetry-parser)


---

## 8. 实施记录

### 2026-01-19 实施完成

已按照方案 A 实施 BBL 头部提取功能：

**修改文件**: `src/lib/tune/process-order.ts`

**新增函数**:
1. `extractBBLHeader(buffer: Buffer)` - 从 BBL 二进制文件中提取 ASCII 头部
2. `isBBLFormat(content: string)` - 检测文件是否为 BBL 格式

**处理流程**:
1. 从数据库读取 Base64 编码的文件内容
2. 解码为 Buffer
3. 检测是否为 BBL 格式（以 "H Product:Blackbox" 开头）
4. 如果是 BBL 格式，提取头部配置信息
5. 如果不是 BBL 格式，直接使用完整内容（兼容 CSV 等格式）
6. 将提取的内容发送给 AI 分析

**部署状态**: 已部署到 Cloudflare Workers

**待验证**: 需要进行完整支付流程测试，确认 BBL 文件处理正常
