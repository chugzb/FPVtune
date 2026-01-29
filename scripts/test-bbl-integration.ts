/**
 * 测试 BBL 解码服务集成
 * 运行: npx tsx scripts/test-bbl-integration.ts
 */

import { readFileSync } from 'fs';
import { decodeBBLWithHTTP, generateAISummary } from '../src/lib/tune/bbl-decoder-client';

const BBL_PATH = '/Users/a1/A1项目/fpv/public/test bll txt/BTFL_BLACKBOX_LOG_20260113_154353_JHEF745V2五寸竞速胶带.BBL';
const DECODER_URL = 'http://localhost:8787';

async function main() {
  console.log('=== BBL Integration Test ===\n');

  // 1. 读取 BBL 文件
  console.log('1. Loading BBL file...');
  const bblBuffer = readFileSync(BBL_PATH);
  const arrayBuffer = new ArrayBuffer(bblBuffer.length);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < bblBuffer.length; i++) {
    view[i] = bblBuffer[i];
  }
  console.log(`   File loaded: ${bblBuffer.length} bytes\n`);

  // 2. 调用解码服务
  console.log('2. Calling decoder service...');
  const result = await decodeBBLWithHTTP(DECODER_URL, arrayBuffer);
  console.log('   Decode successful!\n');

  // 3. 显示关键结果
  console.log('3. Decoded data:');
  console.log(`   - Firmware: ${result.meta.firmwareVersion}`);
  console.log(`   - Board: ${result.meta.board}`);
  console.log(`   - Duration: ${result.meta.log_duration_s}s`);
  console.log(`   - Frames: ${result.meta.total_frames}`);
  console.log(`   - PID Roll: P=${result.config.pid.roll.p} I=${result.config.pid.roll.i} D=${result.config.pid.roll.d}`);
  console.log(`   - Gyro RMS: Roll=${result.features.gyro.rms.roll}`);
  console.log(`   - Samples: ${result.samples.time_ms.length} points\n`);

  // 4. 生成 AI 摘要
  console.log('4. AI Summary Preview:');
  const summary = generateAISummary(result);
  console.log(summary.slice(0, 1000) + '...\n');

  console.log('=== Test Complete ===');
}

main().catch(console.error);
