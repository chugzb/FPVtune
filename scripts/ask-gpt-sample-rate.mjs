import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://gemini-api.cn/v1',
});

const model = process.env.OPENAI_MODEL || 'gpt-5.2-codex';

const question = `你是 Betaflight PID 调参专家。

我正在开发一个 AI PID 调参系统，需要将 Blackbox 日志数据发送给 AI 分析。

原始 Blackbox 数据采样率通常是 1000-8000 Hz，一次飞行可能有 10万+ 帧数据。
为了控制数据量，我需要对数据进行降采样后再发送给 AI。

问题：
1. 对于 PID 调参分析，最低需要多少 Hz 的采样率才能保留足够的信息？
2. 推荐的采样率是多少？
3. 哪些频率范围的信息对 PID 调参最重要？（比如振荡、propwash 等问题通常在什么频率？）
4. 如果只能选择 25Hz、50Hz、100Hz 中的一个，你会选哪个？为什么？

请用中文回答，给出专业的技术分析。`;

console.log('询问 GPT 关于采样率的建议...\n');

const completion = await openai.chat.completions.create({
  model,
  messages: [{ role: 'user', content: question }],
  temperature: 0.3,
  max_tokens: 2000,
});

console.log(completion.choices[0]?.message?.content);
