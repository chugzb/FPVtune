import OpenAI from 'openai';

// Future API 配置 (https://future-api.doc.vodeshop.com)
let _openai: OpenAI | null = null;

export const getOpenAI = () => {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || 'https://api.ruxa.ai/v1',
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

// 模型轮询列表 - 按优先级排序
export const MODEL_FALLBACK_LIST = [
  'gpt-5.1-2025-11-13',
  'gpt-5.1',
];

// 默认模型
export const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-5.1-2025-11-13';

// 带轮询的 chat completion 调用
export async function chatCompletionWithFallback(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options?: {
    temperature?: number;
    max_tokens?: number;
  }
): Promise<OpenAI.Chat.ChatCompletion> {
  const client = getOpenAI();
  const models = [DEFAULT_MODEL, ...MODEL_FALLBACK_LIST.filter(m => m !== DEFAULT_MODEL)];

  let lastError: Error | null = null;
  const startTime = Date.now();

  console.log(`[OpenAI] ========== API Call Start ==========`);
  console.log(`[OpenAI] Base URL: ${process.env.OPENAI_BASE_URL || 'https://api.ruxa.ai/v1'}`);
  console.log(`[OpenAI] Models to try: ${models.join(' -> ')}`);
  console.log(`[OpenAI] Temperature: ${options?.temperature ?? 0.3}`);
  console.log(`[OpenAI] Max tokens: ${options?.max_tokens ?? 4000}`);

  for (const model of models) {
    const modelStartTime = Date.now();
    try {
      console.log(`[OpenAI] Trying model: ${model}...`);
      const completion = await client.chat.completions.create({
        model,
        messages,
        temperature: options?.temperature ?? 0.3,
        max_tokens: options?.max_tokens ?? 4000,
      });
      const duration = Date.now() - modelStartTime;
      const totalDuration = Date.now() - startTime;

      console.log(`[OpenAI] ✓ Success with model: ${model}`);
      console.log(`[OpenAI] Response time: ${duration}ms`);
      console.log(`[OpenAI] Total time: ${totalDuration}ms`);
      console.log(`[OpenAI] Usage: prompt=${completion.usage?.prompt_tokens}, completion=${completion.usage?.completion_tokens}, total=${completion.usage?.total_tokens}`);
      console.log(`[OpenAI] ========== API Call End ==========`);

      return completion;
    } catch (error) {
      const duration = Date.now() - modelStartTime;
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[OpenAI] ✗ Model ${model} failed after ${duration}ms: ${errorMsg}`);
      lastError = error instanceof Error ? error : new Error(String(error));
      // 继续尝试下一个模型
    }
  }

  const totalDuration = Date.now() - startTime;
  console.error(`[OpenAI] ✗ All models failed after ${totalDuration}ms`);
  console.log(`[OpenAI] ========== API Call End (Failed) ==========`);
  throw lastError || new Error('All models failed');
}

// Blackbox 分析 Prompt - 输出分析说明 + CLI 命令
export const getBlackboxAnalysisPrompt = (locale: string) => {
  const isZh = locale === 'zh';

  if (isZh) {
    return `你是 Betaflight PID 调参专家。分析黑盒数据，根据你的专业判断优化 PID 参数。

**核心要求：你必须根据黑盒数据分析结果调整参数值，不能简单复制用户的原始值！**

输出格式（必须严格按以下结构输出）：

## 分析结果

### 发现的问题
- **[问题标题]**: [具体描述，基于黑盒数据的实际发现]
- **[问题标题]**: [具体描述]
（列出2-4个从黑盒数据中发现的实际问题）

### 调参建议
- **[建议标题]**: [具体建议内容和预期效果]
- **[建议标题]**: [具体建议内容和预期效果]
（列出2-4条针对性建议）

## CLI 命令

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
1. 先输出"## 分析结果"部分，包含发现的问题和建议
2. 问题和建议必须基于黑盒数据的实际分析，不要使用通用模板
3. 然后输出"## CLI 命令"部分，以 "save" 结束
4. CLI 命令部分用户可以直接复制粘贴到 Betaflight Configurator`;
  }

  // English version
  return `You are a Betaflight PID tuning expert. Analyze the blackbox data and optimize PID parameters based on your professional judgment.

**CRITICAL: You MUST adjust parameter values based on blackbox data analysis. Do NOT simply copy the user's original values!**

Output format (must follow this structure strictly):

## Analysis Results

### Issues Found
- **[Issue Title]**: [Specific description based on actual blackbox data findings]
- **[Issue Title]**: [Specific description]
(List 2-4 actual issues found from blackbox data)

### Tuning Recommendations
- **[Recommendation Title]**: [Specific recommendation and expected effect]
- **[Recommendation Title]**: [Specific recommendation and expected effect]
(List 2-4 targeted recommendations)

## CLI Commands

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
1. First output "## Analysis Results" section with issues found and recommendations
2. Issues and recommendations must be based on actual blackbox data analysis, not generic templates
3. Then output "## CLI Commands" section, ending with "save"
4. CLI commands section can be directly copy-pasted into Betaflight Configurator`;
};
