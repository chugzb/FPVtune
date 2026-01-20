# 需求文档

## 简介

本文档定义了 FPVTune 网站 Creem 支付流程的端到端测试需求。测试目标是验证完整的支付流程，包括文件上传、表单提交、Creem 支付处理、Webhook 触发订单处理、AI 分析生成和邮件发送。通过 10 轮不同参数组合的测试，确保系统在各种场景下都能正常工作。

## 术语表

- **System**: FPVTune 支付测试系统
- **Creem**: 第三方支付服务提供商
- **Webhook**: Creem 支付成功后触发的回调通知
- **Blackbox_File**: FPV 飞控记录的飞行数据日志文件（.BBL 格式）
- **CLI_Dump**: 通过命令行界面导出的飞控配置文件（.txt 格式）
- **Tune_Page**: FPVTune 调参向导页面
- **Order**: 用户提交的调参订单
- **AI_Analysis**: 系统生成的 AI 调参分析报告
- **Test_Round**: 单轮完整的支付流程测试
- **Test_Card**: Creem 测试模式下使用的测试信用卡（卡号 4242）

## 需求

### 需求 1: 测试环境准备

**用户故事:** 作为测试人员，我想要准备好测试环境和测试数据，以便我可以执行完整的支付流程测试。

#### 验收标准

1. THE System SHALL 使用生产环境网站 https://fpvtune.com 进行测试
2. THE System SHALL 使用测试邮箱 ningainshop@gmail.com 接收订单结果
3. THE System SHALL 使用 public/test bll txt/ 目录下的测试文件
4. THE System SHALL 使用 Creem 测试模式进行支付（测试卡号 4242）
5. THE System SHALL 在每轮测试前确认测试文件可访问

### 需求 2: 文件上传功能测试

**用户故事:** 作为测试人员，我想要验证文件上传功能正常工作，以便确保用户可以成功上传 Blackbox 日志和 CLI Dump 文件。

#### 验收标准

1. WHEN 测试人员访问 /zh/tune 页面 THEN THE System SHALL 显示文件上传界面
2. WHEN 测试人员上传有效的 Blackbox_File THEN THE System SHALL 成功接受文件并显示文件名
3. WHEN 测试人员上传有效的 CLI_Dump THEN THE System SHALL 成功接受文件并显示文件名
4. IF 文件上传失败 THEN THE System SHALL 显示清晰的错误信息

### 需求 3: 表单参数选择测试

**用户故事:** 作为测试人员，我想要验证表单参数选择功能，以便确保用户可以正确选择问题类型、目标、风格和机架尺寸。

#### 验收标准

1. THE System SHALL 提供问题类型选项：桨洗(propwash)、振动(vibration)、电机过热(motor_hot)、弹跳(bounce_back)
2. THE System SHALL 提供目标选项：锁定感(locked)、响应速度(responsive)、平滑(smooth)
3. THE System SHALL 提供风格选项：花飞(freestyle)、竞速(racing)、航拍(cinematic)
4. THE System SHALL 提供机架尺寸选项：3"、5"、7"
5. WHEN 测试人员选择任意参数组合 THEN THE System SHALL 正确记录所选参数
6. THE System SHALL 要求填写邮箱和姓名字段

### 需求 4: Creem 支付流程测试

**用户故事:** 作为测试人员，我想要验证 Creem 支付流程，以便确保用户可以成功完成支付。

#### 验收标准

1. WHEN 测试人员提交表单 THEN THE System SHALL 跳转到 Creem 支付页面
2. THE System SHALL 在 Creem 支付页面显示正确的订单金额
3. WHEN 测试人员使用测试卡号 4242 完成支付 THEN THE System SHALL 返回支付成功状态
4. THE System SHALL 支持使用验证码 000000 完成测试支付
5. IF 支付失败 THEN THE System SHALL 显示支付失败信息并允许重试

### 需求 5: Webhook 订单处理测试

**用户故事:** 作为测试人员，我想要验证 Webhook 触发的订单处理流程，以便确保支付成功后系统能自动处理订单。

#### 验收标准

1. WHEN Creem 支付成功 THEN THE System SHALL 通过 Webhook 接收支付通知
2. WHEN Webhook 触发 THEN THE System SHALL 自动开始处理订单
3. THE System SHALL 在 60 秒内完成订单处理
4. THE System SHALL 生成唯一的订单号（格式：FPV-YYYYMMDD-XXXXXX）
5. IF Webhook 处理失败 THEN THE System SHALL 记录错误日志

### 需求 6: AI 分析生成测试

**用户故事:** 作为测试人员，我想要验证 AI 分析生成功能，以便确保系统能根据上传的文件生成调参建议。

#### 验收标准

1. WHEN 订单处理开始 THEN THE System SHALL 调用 AI 分析服务
2. THE AI_Analysis SHALL 基于上传的 Blackbox_File 和 CLI_Dump 生成
3. THE AI_Analysis SHALL 包含针对所选问题类型的调参建议
4. THE AI_Analysis SHALL 考虑用户选择的目标和风格
5. THE System SHALL 在结果页面显示完整的 AI 分析报告

### 需求 7: 邮件发送和内容验证测试

**用户故事:** 作为测试人员，我想要验证邮件发送功能并在 Gmail 中验证邮件内容，以便确保用户能收到完整正确的订单结果邮件。

#### 验收标准

1. WHEN 订单处理完成 THEN THE System SHALL 发送结果邮件到用户邮箱
2. THE System SHALL 在邮件中包含订单号
3. THE System SHALL 在邮件中包含 AI 分析结果摘要
4. THE System SHALL 在邮件中包含结果页面链接
5. THE System SHALL 在订单处理完成后 5 分钟内发送邮件
6. WHEN 测试人员登录 Gmail THEN THE System SHALL 能够找到对应订单的邮件
7. THE System SHALL 验证邮件主题包含订单号或 FPVTune 标识
8. THE System SHALL 验证邮件正文包含完整的调参建议内容
9. THE System SHALL 验证邮件中的结果页面链接可正常访问

### 需求 8: 结果页面验证

**用户故事:** 作为测试人员，我想要验证结果页面显示正确的订单信息，以便确保用户可以查看完整的调参结果。

#### 验收标准

1. WHEN 支付成功 THEN THE System SHALL 跳转到结果页面
2. THE System SHALL 在结果页面显示订单号
3. THE System SHALL 在结果页面显示处理状态
4. WHEN 处理完成 THEN THE System SHALL 显示完整的 AI 分析报告
5. THE System SHALL 提供下载分析报告的功能

### 需求 9: 10 轮参数组合测试

**用户故事:** 作为测试人员，我想要执行 10 轮不同参数组合的测试，以便验证系统在各种场景下的稳定性。

#### 验收标准

1. THE System SHALL 支持以下 10 轮测试参数组合：
   - 轮次 1: 桨洗 + 锁定感 + 花飞 + 5"
   - 轮次 2: 振动 + 响应速度 + 竞速 + 5"
   - 轮次 3: 电机过热 + 平滑 + 航拍 + 7"
   - 轮次 4: 弹跳 + 锁定感 + 竞速 + 5"
   - 轮次 5: 桨洗 + 响应速度 + 花飞 + 5"
   - 轮次 6: 振动 + 平滑 + 航拍 + 3"
   - 轮次 7: 电机过热 + 锁定感 + 花飞 + 5"
   - 轮次 8: 弹跳 + 响应速度 + 竞速 + 5"
   - 轮次 9: 桨洗 + 平滑 + 航拍 + 7"
   - 轮次 10: 振动 + 锁定感 + 花飞 + 5"
2. WHEN 每轮测试完成 THEN THE System SHALL 记录测试结果
3. THE System SHALL 记录每轮测试的订单号、支付状态、处理状态、AI 分析状态、邮件状态和耗时

### 需求 10: 测试结果记录

**用户故事:** 作为测试人员，我想要记录每轮测试的详细结果，以便分析系统性能和发现问题。

#### 验收标准

1. THE System SHALL 为每轮测试记录以下信息：
   - 订单号
   - 支付状态（OK/FAIL）
   - 处理状态（OK/FAIL）
   - AI 分析状态（OK/FAIL）
   - 邮件状态（OK/FAIL）
   - 总耗时
   - 备注
2. THE System SHALL 在测试完成后生成测试报告
3. THE System SHALL 记录发现的问题和优化建议

### 需求 11: 问题修复和继续测试

**用户故事:** 作为测试人员，我想要在发现问题时能够修复并继续测试，以便确保所有问题都被解决。

#### 验收标准

1. WHEN 测试过程中发现任何问题 THEN THE System SHALL 暂停测试并记录问题
2. THE System SHALL 提供问题的详细描述和错误信息
3. WHEN 问题被修复 THEN THE System SHALL 从当前轮次重新开始测试
4. THE System SHALL 验证修复后的功能正常工作
5. THE System SHALL 继续执行剩余的测试轮次
6. IF 同一问题重复出现 THEN THE System SHALL 标记为严重问题并优先处理
7. THE System SHALL 在测试报告中记录所有发现的问题及其修复状态
