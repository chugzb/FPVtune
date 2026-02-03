import OpenAI from 'openai';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://gemini-api.cn/v1',
});

const model = process.env.OPENAI_MODEL || 'gpt-5.2-codex';

// 读取 10MB BBL 解码后的 JSON
const largeJson = fs.readFileSync('/tmp/tmh7_decoded.json', 'utf-8');
console.log(`10MB BBL 解码后 JSON 大小: ${largeJson.length} chars (~${Math.round(largeJson.length/4)} tokens)`);

const prompt = `You are a Betaflight PID tuning API. Output ONLY a JSON object.

User Configuration:
- Problems: propwash, vibration
- Goals: smooth flight
- Flying style: freestyle
- Frame: 5 inch
- Motors: 2207 1950KV
- Battery: 6s
- Props: 5143

OUTPUT THIS EXACT JSON STRUCTURE:
{"analysis":{"summary":"Analysis summary","issues":["Issue 1"],"recommendations":["Recommendation 1"]},"pid":{"roll":{"p":52,"i":80,"d":45,"f":130},"pitch":{"p":55,"i":84,"d":48,"f":135},"yaw":{"p":45,"i":80,"d":0,"f":120}},"filters":{"gyro_lpf1_dyn_min_hz":200,"gyro_lpf1_dyn_max_hz":500,"dterm_lpf1_dyn_min_hz":80,"dterm_lpf1_dyn_max_hz":170},"cli_commands":"set p_roll = 52\\nset i_roll = 80\\nsave"}`;

const userMessage = `Here is the decoded Betaflight blackbox data (JSON format):

${largeJson}

Based on this flight data, please analyze and provide optimized PID recommendations.
IMPORTANT: Respond with ONLY a JSON object starting with { - no markdown, no explanations.`;

console.log(`总消息大小: ${userMessage.length} chars`);
console.log('');
console.log('调用 GPT API...');

const startTime = Date.now();

try {
  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.2,
    max_tokens: 4000,
  });

  const duration = Date.now() - startTime;
  const result = completion.choices[0]?.message?.content;

  console.log(`\nAPI 调用完成，耗时 ${duration}ms`);
  console.log(`响应长度: ${result?.length || 0} chars`);
  console.log('\n响应内容 (前 1000 chars):');
  console.log(result?.slice(0, 1000));

  // 尝试解析 JSON
  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('\n=== 解析结果 ===');
      console.log('有 PID:', !!parsed.pid);
      console.log('有 filters:', !!parsed.filters);
      console.log('有 CLI commands:', !!parsed.cli_commands);
      if (parsed.pid?.roll) {
        console.log('Roll PID:', parsed.pid.roll);
      }
      if (parsed.filters) {
        console.log('Filters keys:', Object.keys(parsed.filters));
      }
    }
  } catch (e) {
    console.log('\nJSON 解析失败:', e.message);
  }

} catch (error) {
  console.error('API 错误:', error.message);
}
