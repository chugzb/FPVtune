import fs from 'fs';

const OPENAI_API_KEY = 'sk-802eBr9PknV0rDu2RsYE7gubcAh37I2Dr0uArYeCfbCHilP8';
const OPENAI_BASE_URL = 'https://gemini-api.cn/v1';
const MODEL = 'gpt-5.2';

// 读取解码后的 BBL JSON
const bblData = fs.readFileSync('public/test bll txt/btfl_all_decoded.json', 'utf-8');
const cliDump = fs.readFileSync('public/test bll txt/BTFL_cli_20260127_163654_TMH7.txt', 'utf-8');

console.log('BBL JSON size:', bblData.length, 'chars');
console.log('CLI dump size:', cliDump.length, 'chars');

const systemPrompt = `You are a Betaflight PID tuning expert. Your task is to analyze decoded blackbox data and suggest optimized PID parameters.

CRITICAL INSTRUCTION: You MUST respond with ONLY a valid JSON object. No markdown, no explanations, no text before or after the JSON. Start your response with { and end with }.

The user provides:
1. Decoded blackbox data (JSON with meta, cli, stats, frames)
2. Current CLI configuration
3. Reported issues and goals

Respond with this EXACT JSON structure:
{
  "analysis": {
    "summary": "Brief analysis (50-100 words)",
    "issues": ["Issue 1", "Issue 2"],
    "recommendations": ["Rec 1", "Rec 2"]
  },
  "pid": {
    "roll": {"p": 45, "i": 80, "d": 40, "f": 120},
    "pitch": {"p": 47, "i": 84, "d": 46, "f": 125},
    "yaw": {"p": 45, "i": 80, "d": 0, "f": 120}
  },
  "filters": {
    "gyro_lowpass_hz": 250,
    "gyro_lowpass2_hz": 500,
    "dterm_lowpass_hz": 150,
    "dterm_lowpass2_hz": 150,
    "dyn_notch_count": 3,
    "dyn_notch_q": 300,
    "dyn_notch_min_hz": 100,
    "dyn_notch_max_hz": 600
  },
  "other": {
    "dshot_bidir": true,
    "motor_output_limit": 100,
    "throttle_boost": 5,
    "anti_gravity_gain": 80
  },
  "cli_commands": "set p_roll = 45\\nset i_roll = 80\\nset d_roll = 40\\nset f_roll = 120\\nsave"
}

REMEMBER: Output ONLY the JSON object, nothing else.`;

const userMessage = `Here is the decoded Betaflight blackbox data:

${bblData}

--- Current CLI Configuration ---
${cliDump}

User reported issues: Propwash oscillation, Sluggish response
Goals: Snappy response
Flying style: Freestyle
Hardware: 5" frame, 2207 2450KV motors, 6S battery, HQ 5043 props

Please analyze and provide optimized PID recommendations.`;

console.log('\nTotal message size:', (systemPrompt.length + userMessage.length), 'chars');
console.log('Estimated tokens:', Math.ceil((systemPrompt.length + userMessage.length) / 4));
console.log('\nCalling GPT-5.2...\n');

const startTime = Date.now();

try {
  const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage + '\n\nIMPORTANT: Respond with ONLY a JSON object starting with { - no markdown, no explanations.' },
      ],
      temperature: 0.2,
      max_tokens: 4000,
    }),
  });

  const data = await response.json();
  const elapsed = Date.now() - startTime;

  console.log('Response time:', elapsed, 'ms');
  console.log('Status:', response.status);

  if (data.error) {
    console.error('API Error:', data.error);
  } else if (data.choices?.[0]?.message?.content) {
    const content = data.choices[0].message.content;
    console.log('\n--- AI Response (first 2000 chars) ---\n');
    console.log(content.slice(0, 2000));

    // 尝试解析 JSON
    try {
      // 提取 JSON
      let jsonStr = content;
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      } else {
        const firstBrace = content.indexOf('{');
        const lastBrace = content.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          jsonStr = content.substring(firstBrace, lastBrace + 1);
        }
      }

      const parsed = JSON.parse(jsonStr);
      console.log('\n--- Parsed JSON ---\n');
      console.log('PID Roll:', parsed.pid?.roll);
      console.log('PID Pitch:', parsed.pid?.pitch);
      console.log('PID Yaw:', parsed.pid?.yaw);
      console.log('Analysis:', parsed.analysis?.summary?.slice(0, 200));
    } catch (e) {
      console.log('\nFailed to parse JSON:', e.message);
    }
  }

  // Token usage
  if (data.usage) {
    console.log('\n--- Token Usage ---');
    console.log('Input tokens:', data.usage.prompt_tokens);
    console.log('Output tokens:', data.usage.completion_tokens);
    console.log('Total tokens:', data.usage.total_tokens);

    // 成本估算
    const inputCost = (data.usage.prompt_tokens / 1000000) * 1.25;
    const outputCost = (data.usage.completion_tokens / 1000000) * 10;
    console.log('Estimated cost: $' + (inputCost + outputCost).toFixed(4));
  }
} catch (error) {
  console.error('Request failed:', error);
}
