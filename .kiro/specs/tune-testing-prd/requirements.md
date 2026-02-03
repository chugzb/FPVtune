# Requirements Document

## Introduction

本文档定义了 FPVtune BBL 解码和 AI 调参分析功能的系统化测试需求。FPVtune 是一个 FPV 无人机 PID 调参服务，用户上传 BBL (Betaflight Blackbox Log) 文件和 CLI 配置，系统解析数据后通过 GPT 分析并生成优化的 PID 参数。

测试目标是验证 BBL 解码器的正确性、多 log 选择逻辑、采样率优先级、完整用户流程以及 AI 返回结果的质量。

## Glossary

- **BBL_Decoder**: BBL 文件解码服务，将二进制 Betaflight Blackbox Log 转换为结构化 JSON 数据
- **BBL_File**: Betaflight Blackbox Log 文件，包含飞行数据记录（陀螺仪、电机输出、PID 响应等）
- **CLI_Dump**: Betaflight CLI 配置导出文件，通过 `diff all` 命令生成
- **Multi_Log_File**: 包含多个飞行记录的 BBL 文件
- **Sample_Rate**: 数据采样率，单位 Hz
- **AI_Analyzer**: GPT 分析服务，基于解码数据生成 PID 优化建议
- **PID_Values**: 比例-积分-微分控制参数（P、I、D、F）
- **Test_Runner**: 自动化测试执行器
- **Tune_Wizard**: 用户上传和配置界面

## Requirements

### Requirement 1: BBL 文件解码

**User Story:** As a tester, I want to verify BBL decoder can correctly parse various BBL files, so that I can ensure data extraction reliability.

#### Acceptance Criteria

1. WHEN a valid BBL file is uploaded, THE BBL_Decoder SHALL return a JSON object containing meta, stats, cli, and frames sections
2. WHEN a BBL file smaller than 1MB is processed, THE BBL_Decoder SHALL complete decoding within 5 seconds
3. WHEN a BBL file between 1MB and 10MB is processed, THE BBL_Decoder SHALL complete decoding within 30 seconds
4. IF a corrupted or invalid BBL file is uploaded, THEN THE BBL_Decoder SHALL return an error response with descriptive message
5. WHEN decoding completes, THE BBL_Decoder SHALL output data not exceeding 500K characters

### Requirement 2: Multi-Log 文件处理

**User Story:** As a tester, I want to verify the decoder correctly handles multi-log BBL files, so that I can ensure the longest flight record is selected.

#### Acceptance Criteria

1. WHEN a BBL file contains multiple logs, THE BBL_Decoder SHALL identify all available logs and their durations
2. WHEN multiple logs exist, THE BBL_Decoder SHALL automatically select the log with the longest duration
3. WHEN the selected log is processed, THE BBL_Decoder SHALL include logs_found, log_used, and duration_s in meta section
4. WHEN btfl_all.bbl (5 logs) is processed, THE BBL_Decoder SHALL return logs_found=5 and select the longest log (log_used should indicate the longest)
5. WHEN BTFL_cli_CRANE_SHADOW O4.BBL (2 logs) is processed, THE BBL_Decoder SHALL return logs_found=2 and select the longest log
6. THE Test_Runner SHALL verify that log_used corresponds to the log with maximum duration by comparing individual log durations

### Requirement 3: 采样率选择逻辑

**User Story:** As a tester, I want to verify the sample rate selection follows the defined priority, so that I can ensure optimal data quality.

#### Acceptance Criteria

1. WHEN decoding a BBL file, THE BBL_Decoder SHALL detect the original sample rate from header
2. WHEN output exceeds size limit, THE BBL_Decoder SHALL downsample following priority: 1000Hz > 500Hz > 250Hz > 200Hz > 150Hz > 100Hz > 50Hz
3. THE BBL_Decoder SHALL maintain minimum sample rate of 500Hz (不低于 500Hz)
4. WHEN downsampling occurs, THE BBL_Decoder SHALL report the final sample rate in meta.sample_rate_hz
5. WHEN a high-frequency log is processed, THE BBL_Decoder SHALL maintain data integrity during downsampling
6. WHEN btfl_all.bbl is processed, THE BBL_Decoder SHALL output sample_rate_hz >= 500

### Requirement 4: 完整用户流程

**User Story:** As a tester, I want to verify the complete user flow from upload to result display, so that I can ensure end-to-end functionality.

#### Acceptance Criteria

1. WHEN a user uploads BBL and CLI files, THE Tune_Wizard SHALL accept both files and proceed to configuration
2. WHEN user completes configuration (problems, goals, style, frame), THE Tune_Wizard SHALL submit data for analysis
3. WHEN analysis request is submitted with valid test code, THE AI_Analyzer SHALL process the request
4. WHEN analysis completes, THE Tune_Wizard SHALL display results including summary, issues, recommendations, and CLI commands
5. IF analysis fails, THEN THE Tune_Wizard SHALL display an error message and allow retry

### Requirement 5: AI 分析结果质量

**User Story:** As a tester, I want to verify GPT returns optimized PID values rather than copying original values, so that I can ensure analysis provides real value.

#### Acceptance Criteria

1. WHEN AI analysis completes, THE AI_Analyzer SHALL return PID values that differ from the original configuration
2. WHEN issues are detected (oscillation, propwash), THE AI_Analyzer SHALL adjust corresponding PID parameters
3. WHEN analysis result is returned, THE AI_Analyzer SHALL include 2-4 specific issues in analysis.issues
4. WHEN analysis result is returned, THE AI_Analyzer SHALL include 2-4 actionable recommendations
5. WHEN CLI commands are generated, THE AI_Analyzer SHALL produce valid Betaflight CLI syntax

### Requirement 6: 测试数据覆盖

**User Story:** As a tester, I want to test with various BBL files of different sizes and configurations, so that I can ensure comprehensive coverage.

#### 测试文件清单

| 序号 | BBL 文件名 | 大小 | Logs 数量 | 飞行时长 | 采样率 | 对应 CLI 文件 |
|------|-----------|------|----------|---------|--------|--------------|
| 1 | btfl_all.bbl | 9.8MB | 5 logs | 74.8s | 100Hz | BTFL_cli_DARWINFPV_20260120_170512_DARWINF435.txt |
| 2 | BTFL_cli_CRANE_SHADOW O4_20260127_165659_MAMBAF722_2022B.BBL | 5.5MB | 2 logs | 57.6s | 500Hz | BTFL_cli_CRANE_SHADOW O4_20260127_165659_MAMBAF722_2022B.txt |
| 3 | BTFL_cli_20260127_163654_TMH7.bbl | 4.2MB | 1 log | 51.5s | 500Hz | BTFL_cli_20260127_163654_TMH7.txt |
| 4 | BTFL_cli_20260127_162350_GREATMOUNTAINRCF435.bbl | 2.5MB | 1 log | 42.1s | 500Hz | BTFL_cli_20260127_162350_GREATMOUNTAINRCF435.txt |
| 5 | BTFL_BLACKBOX_LOG_20260113_154353_JHEF745V2五寸竞速胶带.BBL | 1.0MB | 1 log | 12.4s | 1000Hz | BTFL_cli_20260113_154510_JHEF745V2五寸竞速胶带.txt |

#### Acceptance Criteria

1. THE Test_Runner SHALL test btfl_all.bbl and verify logs_found=5, log_used=5, duration_s≈74.8s
2. THE Test_Runner SHALL test BTFL_cli_CRANE_SHADOW O4_20260127_165659_MAMBAF722_2022B.BBL and verify logs_found=2, log_used=2, duration_s≈57.6s
3. THE Test_Runner SHALL test BTFL_cli_20260127_163654_TMH7.bbl and verify logs_found=1, log_used=1, duration_s≈51.5s
4. THE Test_Runner SHALL test BTFL_cli_20260127_162350_GREATMOUNTAINRCF435.bbl and verify logs_found=1, log_used=1, duration_s≈42.1s
5. THE Test_Runner SHALL test BTFL_BLACKBOX_LOG_20260113_154353_JHEF745V2五寸竞速胶带.BBL and verify logs_found=1, log_used=1, duration_s≈12.4s
6. WHEN testing each BBL file, THE Test_Runner SHALL use the corresponding CLI dump file as listed above

### Requirement 7: 错误处理和边界条件

**User Story:** As a tester, I want to verify error handling for edge cases, so that I can ensure system robustness.

#### Acceptance Criteria

1. IF BBL file is empty or zero bytes, THEN THE BBL_Decoder SHALL return appropriate error
2. IF CLI dump file is missing, THEN THE AI_Analyzer SHALL still provide analysis based on BBL data alone
3. IF BBL decoder service is unavailable, THEN THE Tune_Wizard SHALL display connection error message
4. IF AI analysis times out (>60s), THEN THE Tune_Wizard SHALL allow user to retry
5. IF invalid test code is provided, THEN THE Tune_Wizard SHALL reject the request with authentication error

### Requirement 8: 性能基准

**User Story:** As a tester, I want to establish performance benchmarks, so that I can monitor system performance over time.

#### Acceptance Criteria

1. WHEN processing a 5MB BBL file, THE BBL_Decoder SHALL complete within 15 seconds
2. WHEN AI analysis is requested, THE AI_Analyzer SHALL return results within 45 seconds
3. WHEN complete flow is executed, THE Tune_Wizard SHALL complete from upload to result within 90 seconds
4. THE BBL_Decoder SHALL handle concurrent requests without degradation (up to 3 simultaneous)
