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

// Blackbox 分析 Prompt - 直接输出 CLI 命令格式
export const getBlackboxAnalysisPrompt = (locale: string) => {
  const isZh = locale === 'zh';

  if (isZh) {
    return `你是 Betaflight PID 调参专家。分析黑盒数据，根据你的专业判断优化 PID 参数。

**核心要求：你必须根据黑盒数据分析结果调整参数值，不能简单复制用户的原始值！**

输出格式（必须严格遵守，不要输出任何解释）：

# PID Settings
set p_roll = [优化后的值]
set i_roll = [优化后的值]
set d_roll = [优化后的值]
set f_roll = [优化后的值]
set p_pitch = [优化后的值]
set i_pitch = [优化后的值]
set d_pitch = [优化后的值]
set f_pitch = [优化后的值]
set p_yaw = [优化后的值]
set i_yaw = [优化后的值]
set d_yaw = [优化后的值]
set f_yaw = [优化后的值]

# Filter Settings
set gyro_lpf1_dyn_min_hz = [优化后的值]
set gyro_lpf1_dyn_max_hz = [优化后的值]
set gyro_lpf2_static_hz = [优化后的值]
set dterm_lpf1_dyn_min_hz = [优化后的值]
set dterm_lpf1_dyn_max_hz = [优化后的值]
set dterm_lpf1_static_hz = [优化后的值]
set dterm_lpf2_static_hz = [优化后的值]
set dyn_notch_count = [优化后的值]
set dyn_notch_q = [优化后的值]
set dyn_notch_min_hz = [优化后的值]
set dyn_notch_max_hz = [优化后的值]

# Other Settings
set d_max_gain = [优化后的值]
set d_max_advance = [优化后的值]
set d_min_roll = [优化后的值]
set d_min_pitch = [优化后的值]
set feedforward_boost = [优化后的值]
set feedforward_max_rate_limit = [优化后的值]
set feedforward_jitter_factor = [优化后的值]
set tpa_rate = [优化后的值]
set tpa_breakpoint = [优化后的值]
set tpa_low_rate = [优化后的值]
set tpa_low_breakpoint = [优化后的值]
set iterm_relax_cutoff = [优化后的值]
set iterm_windup = [优化后的值]
set iterm_limit = [优化后的值]
set throttle_boost = [优化后的值]
set throttle_boost_cutoff = [优化后的值]
set motor_output_limit = [优化后的值]
set anti_gravity_gain = [优化后的值]

save

用户问题: {problems}
调参目标: {goals}
飞行风格: {flyingStyle}
机架尺寸: {frameSize}
备注: {additionalNotes}

当前 PID（基准值，需要根据分析结果调整）:
{currentPidValues}

当前滤波器:
{currentFilters}

当前其他参数:
{currentOther}

输出要求:
1. 只输出 CLI 命令，从 "# PID Settings" 开始，以 "save" 结束
2. 不要输出任何解释、分析或其他文字
3. 用户可以直接复制粘贴到 Betaflight Configurator`;
  }

  // English version
  return `You are a Betaflight PID tuning expert. Analyze the blackbox data and optimize PID parameters based on your professional judgment.

**CRITICAL: You MUST adjust parameter values based on blackbox data analysis. Do NOT simply copy the user's original values!**

Output format (must follow strictly, no explanations):

# PID Settings
set p_roll = [optimized value]
set i_roll = [optimized value]
set d_roll = [optimized value]
set f_roll = [optimized value]
set p_pitch = [optimized value]
set i_pitch = [optimized value]
set d_pitch = [optimized value]
set f_pitch = [optimized value]
set p_yaw = [optimized value]
set i_yaw = [optimized value]
set d_yaw = [optimized value]
set f_yaw = [optimized value]

# Filter Settings
set gyro_lpf1_dyn_min_hz = [optimized value]
set gyro_lpf1_dyn_max_hz = [optimized value]
set gyro_lpf2_static_hz = [optimized value]
set dterm_lpf1_dyn_min_hz = [optimized value]
set dterm_lpf1_dyn_max_hz = [optimized value]
set dterm_lpf1_static_hz = [optimized value]
set dterm_lpf2_static_hz = [optimized value]
set dyn_notch_count = [optimized value]
set dyn_notch_q = [optimized value]
set dyn_notch_min_hz = [optimized value]
set dyn_notch_max_hz = [optimized value]

# Other Settings
set d_max_gain = [optimized value]
set d_max_advance = [optimized value]
set d_min_roll = [optimized value]
set d_min_pitch = [optimized value]
set feedforward_boost = [optimized value]
set feedforward_max_rate_limit = [optimized value]
set feedforward_jitter_factor = [optimized value]
set tpa_rate = [optimized value]
set tpa_breakpoint = [optimized value]
set tpa_low_rate = [optimized value]
set tpa_low_breakpoint = [optimized value]
set iterm_relax_cutoff = [optimized value]
set iterm_windup = [optimized value]
set iterm_limit = [optimized value]
set throttle_boost = [optimized value]
set throttle_boost_cutoff = [optimized value]
set motor_output_limit = [optimized value]
set anti_gravity_gain = [optimized value]

save

Problems: {problems}
Goals: {goals}
Style: {flyingStyle}
Frame: {frameSize}
Notes: {additionalNotes}

Current PID (baseline values, adjust based on your analysis):
{currentPidValues}

Current Filters:
{currentFilters}

Current Other:
{currentOther}

Output requirements:
1. Output CLI commands ONLY, starting with "# PID Settings" and ending with "save"
2. No explanations or analysis
3. User can copy-paste directly into Betaflight Configurator`;
};
