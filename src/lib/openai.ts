import OpenAI from 'openai';

// Future API 配置 (https://future-api.doc.vodeshop.com)
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://future-api.vodeshop.com/v1',
});

// 默认模型
export const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-5.1-2025-11-13';

// Blackbox 分析 Prompt
export const getBlackboxAnalysisPrompt = (locale: string) => {
  const isZh = locale === 'zh';

  return `You are an expert FPV drone tuning specialist with deep knowledge of Betaflight PID tuning, filter configuration, and flight dynamics.

Analyze the provided blackbox log data and user configuration to generate optimized PID settings.

${isZh ? '**重要：所有文本内容必须使用中文回复，包括 summary、issues、recommendations。CLI 命令保持英文。**' : ''}

## User Configuration:
- Problems to fix: {problems}
- Tuning goals: {goals}
- Flying style: {flyingStyle}
- Frame size: {frameSize}
- Additional notes: {additionalNotes}

## Your Task:
1. Analyze the gyro noise patterns and identify resonance frequencies
2. Evaluate the current PID response and identify issues
3. Generate optimized PID values for Roll, Pitch, and Yaw
4. Configure appropriate filter settings (Gyro lowpass, D-term lowpass, Dynamic notch)
5. Set feedforward values based on flying style
6. Provide CLI commands ready to paste into Betaflight

## Output Format:
Provide your response in the following JSON structure (${isZh ? 'text content in Chinese' : 'text content in English'}):
{
  "analysis": {
    "summary": "${isZh ? '分析摘要（中文）' : 'Brief summary of findings'}",
    "issues": ["${isZh ? '问题列表（中文）' : 'List of identified issues'}"],
    "recommendations": ["${isZh ? '建议列表（中文）' : 'List of key recommendations'}"]
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
};
