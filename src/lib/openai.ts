import OpenAI from 'openai';

// Future API 配置 (https://future-api.doc.vodeshop.com)
let _openai: OpenAI | null = null;

export const getOpenAI = () => {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || 'https://gemini-api.cn/v1',
    });
  }
  return _openai;
};

// For backward compatibility
export const openai = new Proxy({} as OpenAI, {
  get(_, prop) {
    return (getOpenAI() as unknown as Record<string, unknown>)[prop as string];
  },
});

// 默认模型
export const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-5.2-codex';

// Blackbox 分析 Prompt
export const getBlackboxAnalysisPrompt = (locale: string) => {
  const isZh = locale === 'zh';

  return `FPV PID tuning expert. Output ONLY valid JSON, no other text.

${isZh ? '所有文本内容使用中文。' : 'All text content in English.'}

## User Configuration:
- Problems: {problems}
- Goals: {goals}
- Flying style: {flyingStyle}
- Frame size: {frameSize}
- Motor: {motorSize} {motorKv}KV
- Battery: {battery}
- Propeller: {propeller}
- Motor temperature after flight: {motorTemp}
- Weight: {weight}g
- Notes: {additionalNotes}

## Required JSON structure:
{
  "analysis": {
    "summary": "${isZh ? '分析结论（中文，50-100字）' : 'Analysis summary (50-100 words)'}",
    "issues": ["${isZh ? '问题1' : 'Issue 1'}", "${isZh ? '问题2' : 'Issue 2'}"],
    "recommendations": ["${isZh ? '建议1' : 'Recommendation 1'}", "${isZh ? '建议2' : 'Recommendation 2'}"]
  },
  "pid": {
    "roll": {"p": num, "i": num, "d": num, "f": num},
    "pitch": {"p": num, "i": num, "d": num, "f": num},
    "yaw": {"p": num, "i": num, "d": num, "f": num}
  },
  "filters": {
    "gyro_lowpass_hz": num,
    "gyro_lowpass2_hz": num,
    "dterm_lowpass_hz": num,
    "dterm_lowpass2_hz": num,
    "dyn_notch_count": num,
    "dyn_notch_q": num,
    "dyn_notch_min_hz": num,
    "dyn_notch_max_hz": num
  },
  "other": {
    "dshot_bidir": bool,
    "motor_output_limit": num,
    "throttle_boost": num,
    "anti_gravity_gain": num
  },
  "cli_commands": "set p_roll = 48\\nset i_roll = 90\\n...\\nsave"
}`;
};
