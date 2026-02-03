/**
 * BBL Decoder 单元测试
 * 测试所有 BBL 文件的解码功能
 */

import { TEST_FILES, TEST_ENV } from './config';
import {
  decodeBBL,
  validateJsonStructure,
  validateLogSelection,
  validateSampleRate,
  validateOutputSize,
  formatTestResult,
  type DecodeTestResult,
} from './utils';

interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  results: Array<{
    id: string;
    result: DecodeTestResult;
    validations: {
      structure: boolean;
      logSelection: boolean;
      sampleRate: boolean;
      outputSize: boolean;
    };
  }>;
}

async function runDecoderTests(): Promise<TestSummary> {
  console.log('='.repeat(60));
  console.log('BBL Decoder 单元测试');
  console.log('='.repeat(60));
  console.log(`测试文件数量: ${TEST_FILES.length}`);
  console.log(`BBL Decoder URL: ${TEST_ENV.BBL_DECODER_URL}`);
  console.log('');

  const summary: TestSummary = {
    total: TEST_FILES.length,
    passed: 0,
    failed: 0,
    results: [],
  };

  for (const testFile of TEST_FILES) {
    console.log('-'.repeat(60));
    console.log(`测试: ${testFile.id} (${testFile.fileSize})`);
    console.log(`文件: ${testFile.bblFile}`);

    const testResult: DecodeTestResult = {
      success: false,
      duration_ms: 0,
      output_chars: 0,
      errors: [],
    };

    const validations = {
      structure: false,
      logSelection: false,
      sampleRate: false,
      outputSize: false,
    };

    try {
      // 解码 BBL 文件
      const { data, duration_ms, output_chars } = await decodeBBL(testFile.bblFile);
      testResult.duration_ms = duration_ms;
      testResult.output_chars = output_chars;
      testResult.meta = data.meta;

      // 验证 JSON 结构
      const structureResult = validateJsonStructure(data);
      validations.structure = structureResult.passed;
      if (!structureResult.passed) {
        testResult.errors!.push(structureResult.message);
      }
      console.log(`  结构验证: ${structureResult.passed ? '✅' : '❌'} ${structureResult.message}`);

      // 验证 Log 选择
      const logResult = validateLogSelection(data, testFile.expectedMeta);
      validations.logSelection = logResult.passed;
      if (!logResult.passed) {
        testResult.errors!.push(logResult.message);
      }
      console.log(`  Log选择: ${logResult.passed ? '✅' : '❌'} ${logResult.message}`);

      // 验证采样率
      const sampleRateResult = validateSampleRate(data, testFile.expectedMeta.min_sample_rate);
      validations.sampleRate = sampleRateResult.passed;
      if (!sampleRateResult.passed) {
        testResult.errors!.push(sampleRateResult.message);
      }
      console.log(`  采样率: ${sampleRateResult.passed ? '✅' : '❌'} ${sampleRateResult.message}`);

      // 验证输出大小
      const outputSizeResult = validateOutputSize(output_chars);
      validations.outputSize = outputSizeResult.passed;
      if (!outputSizeResult.passed) {
        testResult.errors!.push(outputSizeResult.message);
      }
      console.log(`  输出大小: ${outputSizeResult.passed ? '✅' : '❌'} ${outputSizeResult.message}`);

      // 汇总结果
      testResult.success = validations.structure && validations.logSelection && validations.sampleRate && validations.outputSize;

      console.log(`  解码耗时: ${duration_ms}ms`);
      console.log(`  输出字符: ${output_chars}`);
      console.log(`  Logs: ${data.meta.logs_found} found, using #${data.meta.log_used}`);
      console.log(`  时长: ${data.meta.duration_s}s`);
      console.log(`  采样率: ${data.meta.sample_rate_hz}Hz`);
      console.log(`  固件: ${data.meta.fw}`);
      console.log(`  飞控: ${data.meta.board}`);

    } catch (error) {
      testResult.errors!.push(`Exception: ${error instanceof Error ? error.message : String(error)}`);
      console.log(`  ❌ 解码失败: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (testResult.success) {
      summary.passed++;
      console.log(`  结果: ✅ PASS`);
    } else {
      summary.failed++;
      console.log(`  结果: ❌ FAIL`);
    }

    summary.results.push({ id: testFile.id, result: testResult, validations });
  }

  // 打印汇总
  console.log('');
  console.log('='.repeat(60));
  console.log('测试汇总');
  console.log('='.repeat(60));
  console.log(`总计: ${summary.total}`);
  console.log(`通过: ${summary.passed}`);
  console.log(`失败: ${summary.failed}`);
  console.log(`通过率: ${((summary.passed / summary.total) * 100).toFixed(1)}%`);

  if (summary.failed > 0) {
    console.log('');
    console.log('失败的测试:');
    for (const r of summary.results) {
      if (!r.result.success) {
        console.log(`  - ${r.id}: ${r.result.errors?.join(', ')}`);
      }
    }
  }

  return summary;
}

// 运行测试
runDecoderTests()
  .then((summary) => {
    process.exit(summary.failed > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('测试执行失败:', error);
    process.exit(1);
  });
