# BBL 完整帧数据解析方案调研

## 当前问题

目前 FPVtune 只发送 BBL 文件的头部配置给 OpenAI，缺少实际飞行数据（gyro、setpoint、motor 输出等），这限制了 AI 分析振动、propwash 等问题的能力。

## 调研发现

### 1. Cloudflare Workers 支持 WASM

根据 Cloudflare 官方文档，Workers 完全支持 WebAssembly：
- 可以导入 `.wasm` 文件
- 使用 `WebAssembly.instantiate()` 实例化
- Wrangler 会自动打包 `.wasm` 文件

### 2. Betaflight Blackbox Explorer 使用纯 JavaScript

查看 betaflight/blackbox-log-viewer 源码发现：
- `flightlog_parser.js` - 核心解析器，纯 JavaScript 实现
- `decoders.js` - 解码器
- `datastream.js` - 数据流处理

这意味着**不需要 WASM**，可以直接使用纯 JavaScript 解析 BBL 文件。

### 3. blackbox-log npm 包

npm 上有 `blackbox-log` 包，但它使用 WASM（Rust 编译）。在 Cloudflare Workers 中可能需要特殊配置。

## 可行方案

### 方案 A：移植 Betaflight Blackbox Explorer 的 JavaScript 解析器（推荐）

优点：
- 纯 JavaScript，无需 WASM
- 经过大量用户验证，稳定可靠
- 完全兼容 Cloudflare Workers

缺点：
- 需要移植和适配代码
- 代码量较大（约 3000+ 行）

实施步骤：
1. 从 betaflight/blackbox-log-viewer 提取核心文件：
   - `flightlog_parser.js`
   - `decoders.js`
   - `datastream.js`
   - `flightlog_fielddefs.js`
2. 适配为 ES Module 格式
3. 移除 DOM 依赖
4. 集成到 FPVtune

### 方案 B：在 Cloudflare Workers 中使用 WASM

优点：
- 性能更好
- 可以使用现有的 `blackbox-log` npm 包

缺点：
- 需要配置 WASM 打包
- 可能有兼容性问题
- 调试困难

实施步骤：
1. 配置 wrangler.jsonc 支持 WASM
2. 测试 `blackbox-log` 包在 Workers 中的兼容性
3. 如果不兼容，可能需要自己编译 WASM

### 方案 C：使用外部服务处理

优点：
- 不受 Workers 限制
- 可以使用任何技术栈

缺点：
- 增加延迟
- 增加成本
- 架构复杂

实施方式：
1. 部署一个 Node.js/Python 服务专门处理 BBL 解析
2. Workers 调用该服务获取解析结果
3. 可以使用 AWS Lambda、Google Cloud Functions 等

### 方案 D：前端解析 + 后端分析

优点：
- 利用浏览器的计算能力
- 减轻服务器负担

缺点：
- 需要修改前端流程
- 用户体验可能受影响

实施方式：
1. 在前端使用 Blackbox Explorer 的解析器
2. 提取关键数据（gyro、setpoint 等）
3. 将提取的数据发送到后端进行 AI 分析

## 推荐方案

**方案 A（移植纯 JavaScript 解析器）** 是最佳选择：

1. 完全兼容 Cloudflare Workers
2. 无需额外服务或配置
3. 代码成熟稳定
4. 可以按需提取数据，控制发送给 AI 的数据量

## 下一步行动

1. 从 betaflight/blackbox-log-viewer 提取解析器代码
2. 适配为 ES Module
3. 测试在 Cloudflare Workers 中的运行
4. 实现数据采样（每秒采样 N 帧，避免数据过大）
5. 更新 AI prompt，利用帧数据进行更深入的分析

## 参考资源

- [Betaflight Blackbox Log Viewer](https://github.com/betaflight/blackbox-log-viewer)
- [Cloudflare Workers WASM 文档](https://developers.cloudflare.com/workers/runtime-apis/webassembly/javascript/)
- [blackbox-log npm 包](https://www.npmjs.com/package/blackbox-log)
- [Blackbox Logging Internals](http://betaflight.com/docs/development/Blackbox-Internals)
