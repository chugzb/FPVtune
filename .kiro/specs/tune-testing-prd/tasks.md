# Implementation Plan: FPVtune BBL 解码和 AI 调参测试系统

## Overview

实现 FPVtune BBL 解码和 AI 调参分析功能的系统化测试方案，包括单元测试、集成测试和端到端测试。

## Tasks

- [x] 1. 创建测试基础设施
  - [x] 1.1 创建测试配置文件 `scripts/tune-test/config.ts`
    - 定义测试文件路径、预期值、环境变量
    - _Requirements: 6.1-6.6_
  - [x] 1.2 创建测试工具函数 `scripts/tune-test/utils.ts`
    - 实现 BBL 解码调用、结果验证、性能测量
    - _Requirements: 1.1-1.5, 2.1-2.6_

- [x] 2. 实现 BBL Decoder 单元测试
  - [x] 2.1 创建 `scripts/tune-test/decoder.test.ts`
    - 测试所有 5 个 BBL 文件的解码
    - 验证 JSON 结构完整性
    - _Requirements: 1.1, 2.3_
  - [ ]* 2.2 编写属性测试: JSON 结构完整性
    - **Property 1: JSON 结构完整性**
    - **Validates: Requirements 1.1, 2.3**
  - [x] 2.3 测试 Multi-Log 识别和选择
    - 验证 btfl_all.bbl 返回 logs_found=5
    - 验证 CRANE_SHADOW.BBL 返回 logs_found=2
    - _Requirements: 2.1, 2.4, 2.5_
  - [ ]* 2.4 编写属性测试: 最长 Log 选择
    - **Property 6: 最长 Log 选择**
    - **Validates: Requirements 2.2, 2.6**
  - [x] 2.5 测试采样率验证
    - 验证所有文件 sample_rate_hz >= 500
    - _Requirements: 3.3, 3.6_
  - [ ]* 2.6 编写属性测试: 采样率下限
    - **Property 7: 采样率下限**
    - **Validates: Requirements 3.3, 3.6**

- [x] 3. Checkpoint - 确保 BBL Decoder 测试通过
  - 运行所有 decoder 测试，确保通过
  - 如有问题，询问用户

- [ ] 4. 实现性能测试
  - [ ] 4.1 创建 `scripts/tune-test/performance.test.ts`
    - 测量各文件解码时间
    - 验证性能基准
    - _Requirements: 1.2, 1.3, 8.1_
  - [ ]* 4.2 编写属性测试: 解码性能
    - **Property 2: 解码性能**
    - **Validates: Requirements 1.2, 1.3, 8.1**
  - [ ] 4.3 测试输出大小限制
    - 验证所有文件输出 <= 500K chars
    - _Requirements: 1.5_
  - [ ]* 4.4 编写属性测试: 输出大小限制
    - **Property 3: 输出大小限制**
    - **Validates: Requirements 1.5**

- [ ] 5. 实现错误处理测试
  - [ ] 5.1 创建 `scripts/tune-test/error-handling.test.ts`
    - 测试空文件、无效格式、随机字节
    - _Requirements: 1.4, 7.1_
  - [ ]* 5.2 编写属性测试: 错误输入处理
    - **Property 4: 错误输入处理**
    - **Validates: Requirements 1.4**

- [ ] 6. 实现 AI 分析集成测试
  - [ ] 6.1 创建 `scripts/tune-test/ai-analysis.test.ts`
    - 测试完整 AI 分析流程
    - 使用测试码 JB_VIP_TEST
    - _Requirements: 4.3, 5.1-5.5_
  - [ ] 6.2 测试 PID 和滤波器优化验证
    - 验证返回的 PID/滤波器与原值不同，或明确说明已优化
    - _Requirements: 5.1, 5.2_
  - [ ]* 6.3 编写属性测试: PID 和滤波器优化
    - **Property 8: PID 和滤波器优化验证**
    - **Validates: Requirements 5.1, 5.2**
  - [ ] 6.4 测试分析结果结构
    - 验证 issues 2-4 个，recommendations 2-4 个
    - _Requirements: 5.3, 5.4_
  - [ ]* 6.5 编写属性测试: 分析结果结构
    - **Property 9: 分析结果结构**
    - **Validates: Requirements 5.3, 5.4**
  - [ ] 6.6 测试 CLI 命令语法
    - 验证生成的 CLI 命令格式正确
    - _Requirements: 5.5_
  - [ ]* 6.7 编写属性测试: CLI 语法验证
    - **Property 10: CLI 语法验证**
    - **Validates: Requirements 5.5**

- [ ] 7. Checkpoint - 确保集成测试通过
  - 运行所有集成测试，确保通过
  - 如有问题，询问用户

- [-] 8. 实现端到端测试
  - [x] 8.1 创建 `scripts/tune-test/e2e.test.ts`
    - 使用 Playwright 测试完整用户流程
    - _Requirements: 4.1-4.5_
  - [x] 8.2 测试文件上传流程
    - 上传 BBL 和 CLI 文件
    - _Requirements: 4.1_
  - [x] 8.3 测试配置步骤
    - 填写问题、目标、风格、机架
    - _Requirements: 4.2_
  - [x] 8.4 测试结果展示
    - 验证显示 summary、issues、recommendations、CLI commands
    - _Requirements: 4.4_
  - [ ] 8.5 测试错误处理 UI
    - 测试无效测试码、服务不可用场景
    - _Requirements: 4.5, 7.3, 7.5_

- [ ] 9. 实现并发测试
  - [ ] 9.1 创建 `scripts/tune-test/concurrent.test.ts`
    - 测试 3 个并发解码请求
    - _Requirements: 8.4_
  - [ ]* 9.2 编写属性测试: 并发处理
    - **Property 12: 并发处理**
    - **Validates: Requirements 8.4**

- [ ] 10. 创建测试运行脚本
  - [ ] 10.1 创建 `scripts/tune-test/run-all.ts`
    - 整合所有测试，生成报告
    - _Requirements: 6.1-6.6, 8.1-8.4_
  - [ ] 10.2 添加 package.json 脚本
    - 添加 `pnpm test:tune` 命令
    - _Requirements: 6.1-6.6_

- [ ] 11. Final Checkpoint - 确保所有测试通过
  - 运行完整测试套件
  - 生成测试报告
  - 如有问题，询问用户

## Notes

- Tasks marked with `*` are optional property-based tests
- 测试环境: localhost:3000 (App), localhost:8080 (BBL Decoder)
- 测试码: JB_VIP_TEST
- 所有测试文件位于 `public/test bll txt/`
- 测试方法: 多轮迭代测试，发现问题 -> 总结 -> 修复 -> 再测试，直到完整通过
