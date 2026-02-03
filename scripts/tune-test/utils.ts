/**
 * FPVtune 测试工具函数
 */

import * as fs from 'fs';
import * as path from 'path';
import { TEST_ENV, type TestFileConfig } from './config';

export interface BBLDecodedData {
  meta: {
    fw: string;
    board: string;
    craft?: string;
    duration_s: number;
    total_frames: number;
    sample_rate_hz: number;
    points: number;
    logs_found: number;
    log_used: number;
    segments_found?: number;
    segment_used?: string;
  };
  cli: {
    A_core: string;
    B_filters: string;
    C_controls: string;
    D_context: string;
  };
  stats?: {
    gyro_rms?: { r: number; p: number; y: number };
    motor_avg?: number[];
    motor_max?: number[];
    vbat?: [number, number];
  };
  frames?: unknown;
}

export interface DecodeTestResult {
  success: boolean;
  duration_ms: number;
  output_chars: number;
  meta?: BBLDecodedData['meta'];
  errors?: string[];
}

export interface ValidationResult {
  passed: boolean;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * 解码 BBL 文件
 */
export async function decodeBBL(bblPath: string): Promise<{ data: BBLDecodedData; duration_ms: number; output_chars: number }> {
  const absolutePath = path.resolve(process.cwd(), bblPath);
  const bblBytes = fs.readFileSync(absolutePath);
  const bblBase64 = bblBytes.toString('base64');

  const startTime = Date.now();
  const response = await fetch(`${TEST_ENV.BBL_DECODER_URL}/decode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bbl_base64: bblBase64 }),
  });

  if (!response.ok) {
    throw new Error(`Decode failed: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  const duration_ms = Date.now() - startTime;
  const data = JSON.parse(text) as BBLDecodedData;

  return { data, duration_ms, output_chars: text.length };
}

/**
 * 验证 JSON 结构完整性
 */
export function validateJsonStructure(data: BBLDecodedData): ValidationResult {
  const errors: string[] = [];

  // 验证 meta 字段
  if (!data.meta) errors.push('Missing meta section');
  else {
    if (!data.meta.fw) errors.push('Missing meta.fw');
    if (!data.meta.board) errors.push('Missing meta.board');
    if (typeof data.meta.duration_s !== 'number') errors.push('Missing meta.duration_s');
    if (typeof data.meta.logs_found !== 'number') errors.push('Missing meta.logs_found');
    if (typeof data.meta.log_used !== 'number') errors.push('Missing meta.log_used');
    if (typeof data.meta.sample_rate_hz !== 'number') errors.push('Missing meta.sample_rate_hz');
  }

  // 验证 cli 字段
  if (!data.cli) errors.push('Missing cli section');
  else {
    if (typeof data.cli.A_core !== 'string') errors.push('Missing cli.A_core');
    if (typeof data.cli.B_filters !== 'string') errors.push('Missing cli.B_filters');
    if (typeof data.cli.C_controls !== 'string') errors.push('Missing cli.C_controls');
    if (typeof data.cli.D_context !== 'string') errors.push('Missing cli.D_context');
  }

  return {
    passed: errors.length === 0,
    message: errors.length === 0 ? 'JSON structure is valid' : `Invalid structure: ${errors.join(', ')}`,
    details: { errors },
  };
}

/**
 * 验证 Multi-Log 选择逻辑
 */
export function validateLogSelection(data: BBLDecodedData, expected: TestFileConfig['expectedMeta']): ValidationResult {
  const errors: string[] = [];

  if (data.meta.logs_found !== expected.logs_found) {
    errors.push(`logs_found: expected ${expected.logs_found}, got ${data.meta.logs_found}`);
  }

  if (data.meta.log_used !== expected.log_used) {
    errors.push(`log_used: expected ${expected.log_used}, got ${data.meta.log_used}`);
  }

  // 允许 10% 误差
  const durationTolerance = expected.duration_s * 0.1;
  if (Math.abs(data.meta.duration_s - expected.duration_s) > durationTolerance) {
    errors.push(`duration_s: expected ~${expected.duration_s}, got ${data.meta.duration_s}`);
  }

  return {
    passed: errors.length === 0,
    message: errors.length === 0 ? 'Log selection is correct' : `Log selection errors: ${errors.join(', ')}`,
    details: { expected, actual: data.meta },
  };
}

/**
 * 验证采样率
 */
export function validateSampleRate(data: BBLDecodedData, minRate: number): ValidationResult {
  const passed = data.meta.sample_rate_hz >= minRate;
  return {
    passed,
    message: passed
      ? `Sample rate ${data.meta.sample_rate_hz}Hz >= ${minRate}Hz`
      : `Sample rate ${data.meta.sample_rate_hz}Hz < ${minRate}Hz (minimum required)`,
    details: { sample_rate_hz: data.meta.sample_rate_hz, min_required: minRate },
  };
}

/**
 * 验证输出大小
 */
export function validateOutputSize(outputChars: number): ValidationResult {
  const passed = outputChars <= TEST_ENV.MAX_OUTPUT_CHARS;
  return {
    passed,
    message: passed
      ? `Output size ${outputChars} chars <= ${TEST_ENV.MAX_OUTPUT_CHARS} chars`
      : `Output size ${outputChars} chars > ${TEST_ENV.MAX_OUTPUT_CHARS} chars (limit exceeded)`,
    details: { output_chars: outputChars, max_chars: TEST_ENV.MAX_OUTPUT_CHARS },
  };
}

/**
 * 格式化测试结果
 */
export function formatTestResult(testId: string, result: DecodeTestResult): string {
  const status = result.success ? '✅ PASS' : '❌ FAIL';
  let output = `${status} ${testId}\n`;
  output += `  Duration: ${result.duration_ms}ms\n`;
  output += `  Output: ${result.output_chars} chars\n`;
  if (result.meta) {
    output += `  Logs: ${result.meta.logs_found} found, using #${result.meta.log_used}\n`;
    output += `  Duration: ${result.meta.duration_s}s\n`;
    output += `  Sample Rate: ${result.meta.sample_rate_hz}Hz\n`;
  }
  if (result.errors && result.errors.length > 0) {
    output += `  Errors: ${result.errors.join(', ')}\n`;
  }
  return output;
}
