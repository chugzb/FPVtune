/**
 * 测试完整 AI 分析流程
 * 1. 调用 BBL Decoder 解析 BBL 文件
 * 2. 读取 CLI Dump 文件
 * 3. 发送给 AI 分析
 */

import { readFileSync } from 'fs';
import OpenAI from 'openai';

const BBL_DECODER_URL = 'http://47.243.149.39:8080';
const BBL_FILE =
  'public/test bll txt/BTFL_BLACKBOX_LOG_20260113_154353_JHEF745V2五寸竞速胶带.BBL';
const CLI_FILE =
  'public/test bll txt/BTFL_cli_20260113_154510_JHEF745V2五寸竞速胶带.txt';

// 用户配置
const USER_CONFIG = {
  problems: '震动, 过冲',
  goals: '更锐利的响应, 更好的锁定',
  flyingStyle: 'freestyle',
  frameSize: '5寸',
  additionalNotes: '使用 T-Motor F60 Pro IV 电机',
  locale: 'zh',
};

async function main() {
  console.log('=== 完整 AI 分析流程测试 ===\n');

  // 1. 调用 BBL Decoder
  console.log('1. 调用 BBL Decoder...');
  const bblBuffer = readFileSync(BBL_FILE);

  const decoderResponse = await fetch(`${BBL_DECODER_URL}/decode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: bblBuffer,
  });

  if (!decoderResponse.ok) {
    throw new Error(`Decoder failed: ${await decoderResponse.text()}`);
  }

  const bblData = await decoderResponse.json();
  console.log(`   固件: ${bblData.meta.fw}`);
  console.log(`   飞控: ${bblData.meta.board}`);
  console.log(`   时长: ${bblData.meta.duration_s}s`);
  console.log(`   采样点: ${bblData.meta.points}`);
  console.log(`   BBL 数据大小: ${JSON.stringify(bblData).length} chars\n`);

  // 2. 读取 CLI Dump
  console.log('2. 读取 CLI Dump...');
  const cliDump = readFileSync(CLI_FILE, 'utf-8');
  console.log(`   CLI Dump 大小: ${cliDump.length} chars\n`);

  // 3. 构建 AI Prompt
  console.log('3. 构建 AI Prompt...');
  const systemPrompt = buildSystemPrompt(USER_CONFIG);
  const userMessage = buildUserMessage(bblData, cliDump);

  console.log(`   System Prompt: ${systemPrompt.length} chars`);
  console.log(`   User Message: ${userMessage.length} chars`);
  console.log(`   总计: ${systemPrompt.length + userMessage.length} chars\n`);

  // 4. 调用 AI
  console.log('4. 调用 AI 分析...');
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL:
      process.env.OPENAI_BASE_URL || 'https://future-api.vodeshop.com/v1',
  });

  const startTime = Date.now();
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-5.1-2025-11-13',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.3,
    max_tokens: 4000,
    response_format: { type: 'json_object' },
  });

  const elapsed = Date.now() - startTime;
  console.log(`   耗时: ${elapsed}ms`);
  console.log(`   Tokens: ${completion.usage?.total_tokens || 'N/A'}\n`);

  // 5. 解析结果
  console.log('5. AI 分析结果:');
  const result = JSON.parse(completion.choices[0].message.content);

  console.log('\n--- 分析摘要 ---');
  console.log(result.analysis?.summary || 'N/A');

  console.log('\n--- 发现的问题 ---');
  (result.analysis?.issues || []).forEach((issue, i) => {
    console.log(`${i + 1}. ${issue}`);
  });

  console.log('\n--- 建议 ---');
  (result.analysis?.recommendations || []).forEach((rec, i) => {
    console.log(`${i + 1}. ${rec}`);
  });

  console.log('\n--- PID 设置 ---');
  console.log(JSON.stringify(result.pid, null, 2));

  console.log('\n--- 滤波器设置 ---');
  console.log(JSON.stringify(result.filters, null, 2));

  console.log('\n--- CLI 命令 (前500字符) ---');
  console.log((result.cli_commands || '').slice(0, 500));

  console.log('\n=== 测试完成 ===');
}

function buildSystemPrompt(config) {
  const isZh = config.locale === 'zh';

  return `You are an expert FPV drone tuning specialist with deep knowledge of Betaflight PID tuning, filter configuration, and flight dynamics.

Analyze the provided blackbox log data and user configuration to generate optimized PID settings.

${isZh ? '**重要：所有文本内容必须使用中文回复，包括 summary、issues、recommendations。CLI 命令保持英文。**' : ''}

## User Configuration:
- Problems to fix: ${config.problems}
- Tuning goals: ${config.goals}
- Flying style: ${config.flyingStyle}
- Frame size: ${config.frameSize}
- Additional notes: ${config.additionalNotes}

## Input Data:
1. **Blackbox Log**: Contains flight data including gyro readings, PID outputs, motor outputs, RC commands, etc.
2. **CLI Dump**: Contains the user's current Betaflight settings exported via "diff all" command.

## Your Task:
1. Analyze the gyro noise patterns and identify resonance frequencies
2. Evaluate the current PID response and identify issues
3. Generate optimized PID values for Roll, Pitch, and Yaw
4. Configure appropriate filter settings
5. Provide CLI commands ready to paste into Betaflight

## Output Format (JSON):
{
  "analysis": {
    "summary": "分析摘要",
    "issues": ["问题1", "问题2"],
    "recommendations": ["建议1", "建议2"]
  },
  "pid": {
    "roll": { "p": number, "i": number, "d": number, "f": number },
    "pitch": { "p": number, "i": number, "d": number, "f": number },
    "yaw": { "p": number, "i": number, "d": number, "f": number }
  },
  "filters": {
    "gyro_lowpass_hz": number,
    "gyro_lowpass2_hz": number,
    "dterm_lowpass_hz": number,
    "dterm_lowpass2_hz": number,
    "dyn_notch_count": number,
    "dyn_notch_q": number,
    "dyn_notch_min_hz": number,
    "dyn_notch_max_hz": number
  },
  "other": {
    "dshot_bidir": boolean,
    "motor_output_limit": number,
    "throttle_boost": number,
    "anti_gravity_gain": number
  },
  "cli_commands": "# FPVtune Generated Settings\\nset p_pitch = ...\\n..."
}`;
}

function buildUserMessage(bblData, cliDump) {
  let message = `Here is the blackbox log data to analyze:\n\n`;
  message += JSON.stringify(bblData, null, 0);
  message += `\n\n--- Current CLI Settings (diff output) ---\n${cliDump}`;
  message += '\n\nPlease analyze this data and provide optimized PID settings.';
  return message;
}

main().catch(console.error);
