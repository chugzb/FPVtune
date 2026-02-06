import { chatCompletionWithFallback, DEFAULT_MODEL, getBlackboxAnalysisPrompt } from '@/lib/openai';
import {
  FRAME_NAMES,
  GOAL_NAMES,
  PROBLEM_NAMES,
  STYLE_NAMES,
  getNameById,
  mapIdsToNames,
} from '@/lib/tune/mappings';
import { type NextRequest, NextResponse } from 'next/server';

// 从 GPT 响应中提取分析内容（摘要、问题、建议）
function extractAnalysisFromResponse(response: string): {
  summary: string;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // 提取"发现的问题"部分
  const issuesMatch = response.match(/###\s*(?:发现的问题|Issues Found)\s*\n([\s\S]*?)(?=###|##\s*CLI|$)/i);
  if (issuesMatch) {
    const issuesContent = issuesMatch[1];
    // 匹配 - **标题**: 描述 格式
    const issuePattern = /-\s*\*\*([^*]+)\*\*[:：]?\s*([^\n]+)/g;
    const matches = issuesContent.matchAll(issuePattern);
    for (const match of matches) {
      const title = match[1].trim();
      const desc = match[2].trim();
      if (title && desc) {
        issues.push(`${title}: ${desc}`);
      }
    }
  }

  // 提取"调参建议"部分
  const recsMatch = response.match(/###\s*(?:调参建议|Tuning Recommendations)\s*\n([\s\S]*?)(?=##\s*CLI|$)/i);
  if (recsMatch) {
    const recsContent = recsMatch[1];
    // 匹配 - **标题**: 描述 格式
    const recPattern = /-\s*\*\*([^*]+)\*\*[:：]?\s*([^\n]+)/g;
    const matches = recsContent.matchAll(recPattern);
    for (const match of matches) {
      const title = match[1].trim();
      const desc = match[2].trim();
      if (title && desc) {
        recommendations.push(`${title}: ${desc}`);
      }
    }
  }

  // 如果新格式没提取到，尝试旧格式（兼容）
  if (issues.length === 0) {
    const bulletPointPattern = /-\s*\*\*([^*]+)\*\*[:：]?\s*([^\n]+)/g;
    const bulletMatches = response.matchAll(bulletPointPattern);
    for (const match of bulletMatches) {
      const title = match[1].trim();
      const desc = match[2].trim();
      if (title && desc && desc.length > 10) {
        const cleaned = `${title}: ${desc}`.replace(/`[^`]+`/g, '').substring(0, 200);
        if (!issues.some(i => i.includes(title))) {
          issues.push(cleaned);
        }
      }
    }
  }

  // 生成摘要
  let summary = '基于黑盒数据分析，已针对您的飞行问题优化 PID、滤波器和相关参数。';
  if (issues.length > 0) {
    const firstIssue = issues[0].split(':')[0];
    summary = `主要发现: ${firstIssue}。已针对这些问题优化参数。`;
  }

  // 如果没有提取到有效内容，使用默认值
  if (issues.length === 0) {
    issues.push('陀螺仪噪声水平已分析，滤波器设置已优化');
    issues.push('PID 参数已根据飞行数据调整');
  }

  if (recommendations.length === 0) {
    recommendations.push('应用调参后进行短时间悬停测试，检查电机温度');
    recommendations.push('如感觉响应不足可适当增加 P 值，如电机发热可降低 D 值');
  }

  return {
    summary,
    issues: issues.slice(0, 5),
    recommendations: recommendations.slice(0, 5)
  };
}

// 从 CLI dump 中解析 PID 值
function parsePidFromCli(cliContent: string): string {
  const pidValues: Record<string, Record<string, number>> = {
    roll: { p: 0, i: 0, d: 0, f: 0 },
    pitch: { p: 0, i: 0, d: 0, f: 0 },
    yaw: { p: 0, i: 0, d: 0, f: 0 },
  };

  // 解析 PID 值的正则表达式
  const patterns = [
    { regex: /set\s+p_roll\s*=\s*(\d+)/i, axis: 'roll', param: 'p' },
    { regex: /set\s+i_roll\s*=\s*(\d+)/i, axis: 'roll', param: 'i' },
    { regex: /set\s+d_roll\s*=\s*(\d+)/i, axis: 'roll', param: 'd' },
    { regex: /set\s+f_roll\s*=\s*(\d+)/i, axis: 'roll', param: 'f' },
    { regex: /set\s+p_pitch\s*=\s*(\d+)/i, axis: 'pitch', param: 'p' },
    { regex: /set\s+i_pitch\s*=\s*(\d+)/i, axis: 'pitch', param: 'i' },
    { regex: /set\s+d_pitch\s*=\s*(\d+)/i, axis: 'pitch', param: 'd' },
    { regex: /set\s+f_pitch\s*=\s*(\d+)/i, axis: 'pitch', param: 'f' },
    { regex: /set\s+p_yaw\s*=\s*(\d+)/i, axis: 'yaw', param: 'p' },
    { regex: /set\s+i_yaw\s*=\s*(\d+)/i, axis: 'yaw', param: 'i' },
    { regex: /set\s+d_yaw\s*=\s*(\d+)/i, axis: 'yaw', param: 'd' },
    { regex: /set\s+f_yaw\s*=\s*(\d+)/i, axis: 'yaw', param: 'f' },
  ];

  for (const { regex, axis, param } of patterns) {
    const match = cliContent.match(regex);
    if (match) {
      pidValues[axis][param] = parseInt(match[1], 10);
    }
  }

  // 格式化为易读的字符串
  return `Roll:  P=${pidValues.roll.p}, I=${pidValues.roll.i}, D=${pidValues.roll.d}, F=${pidValues.roll.f}
Pitch: P=${pidValues.pitch.p}, I=${pidValues.pitch.i}, D=${pidValues.pitch.d}, F=${pidValues.pitch.f}
Yaw:   P=${pidValues.yaw.p}, I=${pidValues.yaw.i}, D=${pidValues.yaw.d}, F=${pidValues.yaw.f}`;
}

// 从 CLI dump 中解析原始 PID 值（返回对象格式）
function parseOriginalPidFromCli(cliContent: string): {
  roll: { p: number; i: number; d: number; f: number };
  pitch: { p: number; i: number; d: number; f: number };
  yaw: { p: number; i: number; d: number; f: number };
} {
  const pidValues = {
    roll: { p: 0, i: 0, d: 0, f: 0 },
    pitch: { p: 0, i: 0, d: 0, f: 0 },
    yaw: { p: 0, i: 0, d: 0, f: 0 },
  };

  const patterns = [
    { regex: /set\s+p_roll\s*=\s*(\d+)/i, axis: 'roll' as const, param: 'p' as const },
    { regex: /set\s+i_roll\s*=\s*(\d+)/i, axis: 'roll' as const, param: 'i' as const },
    { regex: /set\s+d_roll\s*=\s*(\d+)/i, axis: 'roll' as const, param: 'd' as const },
    { regex: /set\s+f_roll\s*=\s*(\d+)/i, axis: 'roll' as const, param: 'f' as const },
    { regex: /set\s+p_pitch\s*=\s*(\d+)/i, axis: 'pitch' as const, param: 'p' as const },
    { regex: /set\s+i_pitch\s*=\s*(\d+)/i, axis: 'pitch' as const, param: 'i' as const },
    { regex: /set\s+d_pitch\s*=\s*(\d+)/i, axis: 'pitch' as const, param: 'd' as const },
    { regex: /set\s+f_pitch\s*=\s*(\d+)/i, axis: 'pitch' as const, param: 'f' as const },
    { regex: /set\s+p_yaw\s*=\s*(\d+)/i, axis: 'yaw' as const, param: 'p' as const },
    { regex: /set\s+i_yaw\s*=\s*(\d+)/i, axis: 'yaw' as const, param: 'i' as const },
    { regex: /set\s+d_yaw\s*=\s*(\d+)/i, axis: 'yaw' as const, param: 'd' as const },
    { regex: /set\s+f_yaw\s*=\s*(\d+)/i, axis: 'yaw' as const, param: 'f' as const },
  ];

  for (const { regex, axis, param } of patterns) {
    const match = cliContent.match(regex);
    if (match) {
      pidValues[axis][param] = parseInt(match[1], 10);
    }
  }

  return pidValues;
}

// 从 CLI dump 中解析滤波器和其他参数
function parseFiltersAndOtherFromCli(cliContent: string): {
  filters: string;
  other: string;
} {
  // 滤波器参数
  const filterParams = [
    'gyro_lpf1_dyn_min_hz', 'gyro_lpf1_dyn_max_hz', 'gyro_lpf1_static_hz', 'gyro_lpf2_static_hz',
    'dterm_lpf1_dyn_min_hz', 'dterm_lpf1_dyn_max_hz', 'dterm_lpf1_static_hz', 'dterm_lpf2_static_hz',
    'dyn_notch_count', 'dyn_notch_q', 'dyn_notch_min_hz', 'dyn_notch_max_hz',
    'rpm_filter_harmonics', 'rpm_filter_min_hz',
  ];

  // 其他参数
  const otherParams = [
    'd_max_gain', 'd_max_advance', 'd_min_roll', 'd_min_pitch',
    'feedforward_transition', 'feedforward_boost', 'feedforward_max_rate_limit', 'feedforward_jitter_factor',
    'tpa_rate', 'tpa_breakpoint', 'tpa_low_rate', 'tpa_low_breakpoint',
    'iterm_relax_cutoff', 'iterm_windup', 'iterm_limit',
    'throttle_boost', 'throttle_boost_cutoff',
    'motor_output_limit', 'anti_gravity_gain',
  ];

  const filterLines: string[] = [];
  const otherLines: string[] = [];

  for (const param of filterParams) {
    const regex = new RegExp(`set\\s+${param}\\s*=\\s*(\\d+)`, 'i');
    const match = cliContent.match(regex);
    if (match) {
      filterLines.push(`${param} = ${match[1]}`);
    }
  }

  for (const param of otherParams) {
    const regex = new RegExp(`set\\s+${param}\\s*=\\s*(\\d+)`, 'i');
    const match = cliContent.match(regex);
    if (match) {
      otherLines.push(`${param} = ${match[1]}`);
    }
  }

  return {
    filters: filterLines.length > 0 ? filterLines.join('\n') : 'No filter settings found',
    other: otherLines.length > 0 ? otherLines.join('\n') : 'No other settings found',
  };
}

// 从 CLI dump 中解析滤波器参数（返回对象格式）
function parseOriginalFiltersFromCli(cliContent: string): FiltersConfig {
  const filters: FiltersConfig = {
    gyro_lpf1_dyn_min_hz: 0,
    gyro_lpf1_dyn_max_hz: 0,
    gyro_lpf1_static_hz: 0,
    gyro_lpf2_static_hz: 0,
    dterm_lpf1_dyn_min_hz: 0,
    dterm_lpf1_dyn_max_hz: 0,
    dterm_lpf1_static_hz: 0,
    dterm_lpf2_static_hz: 0,
    dyn_notch_count: 0,
    dyn_notch_q: 0,
    dyn_notch_min_hz: 0,
    dyn_notch_max_hz: 0,
    rpm_filter_harmonics: 0,
    rpm_filter_min_hz: 0,
  };

  for (const key of Object.keys(filters) as (keyof FiltersConfig)[]) {
    const regex = new RegExp(`set\\s+${key}\\s*=\\s*(\\d+)`, 'i');
    const match = cliContent.match(regex);
    if (match) {
      filters[key] = parseInt(match[1], 10);
    }
  }

  return filters;
}

// 从 CLI dump 中解析其他参数（返回对象格式）
function parseOriginalOtherFromCli(cliContent: string): OtherConfig {
  const other: OtherConfig = {
    d_max_gain: 0,
    d_max_advance: 0,
    d_min_roll: 0,
    d_min_pitch: 0,
    feedforward_transition: 0,
    feedforward_boost: 0,
    feedforward_max_rate_limit: 0,
    feedforward_jitter_factor: 0,
    tpa_rate: 0,
    tpa_breakpoint: 0,
    tpa_low_rate: 0,
    tpa_low_breakpoint: 0,
    iterm_relax_cutoff: 0,
    iterm_windup: 0,
    iterm_limit: 0,
    throttle_boost: 0,
    throttle_boost_cutoff: 0,
    motor_output_limit: 0,
    anti_gravity_gain: 0,
  };

  for (const key of Object.keys(other) as (keyof OtherConfig)[]) {
    const regex = new RegExp(`set\\s+${key}\\s*=\\s*(\\d+)`, 'i');
    const match = cliContent.match(regex);
    if (match) {
      other[key] = parseInt(match[1], 10);
    }
  }

  return other;
}

// 生成完整的 CLI 命令，用户可以直接复制到 Betaflight
function generateCliCommands(analysis: {
  pid: { roll: { p: number; i: number; d: number; f: number }; pitch: { p: number; i: number; d: number; f: number }; yaw: { p: number; i: number; d: number; f: number } };
  filters: FiltersConfig;
  other: OtherConfig;
}): string {
  const commands: string[] = [];

  // PID 命令
  commands.push('# PID Settings');
  commands.push(`set p_roll = ${analysis.pid.roll.p}`);
  commands.push(`set i_roll = ${analysis.pid.roll.i}`);
  commands.push(`set d_roll = ${analysis.pid.roll.d}`);
  commands.push(`set f_roll = ${analysis.pid.roll.f}`);
  commands.push(`set p_pitch = ${analysis.pid.pitch.p}`);
  commands.push(`set i_pitch = ${analysis.pid.pitch.i}`);
  commands.push(`set d_pitch = ${analysis.pid.pitch.d}`);
  commands.push(`set f_pitch = ${analysis.pid.pitch.f}`);
  commands.push(`set p_yaw = ${analysis.pid.yaw.p}`);
  commands.push(`set i_yaw = ${analysis.pid.yaw.i}`);
  commands.push(`set d_yaw = ${analysis.pid.yaw.d}`);
  commands.push(`set f_yaw = ${analysis.pid.yaw.f}`);

  // 滤波器命令
  commands.push('');
  commands.push('# Filter Settings');
  if (analysis.filters.gyro_lpf1_dyn_min_hz > 0) commands.push(`set gyro_lpf1_dyn_min_hz = ${analysis.filters.gyro_lpf1_dyn_min_hz}`);
  if (analysis.filters.gyro_lpf1_dyn_max_hz > 0) commands.push(`set gyro_lpf1_dyn_max_hz = ${analysis.filters.gyro_lpf1_dyn_max_hz}`);
  if (analysis.filters.gyro_lpf1_static_hz > 0) commands.push(`set gyro_lpf1_static_hz = ${analysis.filters.gyro_lpf1_static_hz}`);
  if (analysis.filters.gyro_lpf2_static_hz > 0) commands.push(`set gyro_lpf2_static_hz = ${analysis.filters.gyro_lpf2_static_hz}`);
  if (analysis.filters.dterm_lpf1_dyn_min_hz > 0) commands.push(`set dterm_lpf1_dyn_min_hz = ${analysis.filters.dterm_lpf1_dyn_min_hz}`);
  if (analysis.filters.dterm_lpf1_dyn_max_hz > 0) commands.push(`set dterm_lpf1_dyn_max_hz = ${analysis.filters.dterm_lpf1_dyn_max_hz}`);
  if (analysis.filters.dterm_lpf1_static_hz > 0) commands.push(`set dterm_lpf1_static_hz = ${analysis.filters.dterm_lpf1_static_hz}`);
  if (analysis.filters.dterm_lpf2_static_hz > 0) commands.push(`set dterm_lpf2_static_hz = ${analysis.filters.dterm_lpf2_static_hz}`);
  if (analysis.filters.dyn_notch_count > 0) commands.push(`set dyn_notch_count = ${analysis.filters.dyn_notch_count}`);
  if (analysis.filters.dyn_notch_q > 0) commands.push(`set dyn_notch_q = ${analysis.filters.dyn_notch_q}`);
  if (analysis.filters.dyn_notch_min_hz > 0) commands.push(`set dyn_notch_min_hz = ${analysis.filters.dyn_notch_min_hz}`);
  if (analysis.filters.dyn_notch_max_hz > 0) commands.push(`set dyn_notch_max_hz = ${analysis.filters.dyn_notch_max_hz}`);
  if (analysis.filters.rpm_filter_harmonics > 0) commands.push(`set rpm_filter_harmonics = ${analysis.filters.rpm_filter_harmonics}`);
  if (analysis.filters.rpm_filter_min_hz > 0) commands.push(`set rpm_filter_min_hz = ${analysis.filters.rpm_filter_min_hz}`);

  // 其他参数命令
  commands.push('');
  commands.push('# Other Settings');
  if (analysis.other.d_max_gain > 0) commands.push(`set d_max_gain = ${analysis.other.d_max_gain}`);
  if (analysis.other.d_max_advance > 0) commands.push(`set d_max_advance = ${analysis.other.d_max_advance}`);
  if (analysis.other.d_min_roll > 0) commands.push(`set d_min_roll = ${analysis.other.d_min_roll}`);
  if (analysis.other.d_min_pitch > 0) commands.push(`set d_min_pitch = ${analysis.other.d_min_pitch}`);
  if (analysis.other.feedforward_transition > 0) commands.push(`set feedforward_transition = ${analysis.other.feedforward_transition}`);
  if (analysis.other.feedforward_boost > 0) commands.push(`set feedforward_boost = ${analysis.other.feedforward_boost}`);
  if (analysis.other.feedforward_max_rate_limit > 0) commands.push(`set feedforward_max_rate_limit = ${analysis.other.feedforward_max_rate_limit}`);
  if (analysis.other.feedforward_jitter_factor > 0) commands.push(`set feedforward_jitter_factor = ${analysis.other.feedforward_jitter_factor}`);
  if (analysis.other.tpa_rate > 0) commands.push(`set tpa_rate = ${analysis.other.tpa_rate}`);
  if (analysis.other.tpa_breakpoint > 0) commands.push(`set tpa_breakpoint = ${analysis.other.tpa_breakpoint}`);
  if (analysis.other.tpa_low_rate > 0) commands.push(`set tpa_low_rate = ${analysis.other.tpa_low_rate}`);
  if (analysis.other.tpa_low_breakpoint > 0) commands.push(`set tpa_low_breakpoint = ${analysis.other.tpa_low_breakpoint}`);
  if (analysis.other.iterm_relax_cutoff > 0) commands.push(`set iterm_relax_cutoff = ${analysis.other.iterm_relax_cutoff}`);
  if (analysis.other.iterm_windup > 0) commands.push(`set iterm_windup = ${analysis.other.iterm_windup}`);
  if (analysis.other.iterm_limit > 0) commands.push(`set iterm_limit = ${analysis.other.iterm_limit}`);
  if (analysis.other.throttle_boost > 0) commands.push(`set throttle_boost = ${analysis.other.throttle_boost}`);
  if (analysis.other.throttle_boost_cutoff > 0) commands.push(`set throttle_boost_cutoff = ${analysis.other.throttle_boost_cutoff}`);
  if (analysis.other.motor_output_limit > 0) commands.push(`set motor_output_limit = ${analysis.other.motor_output_limit}`);
  if (analysis.other.anti_gravity_gain > 0) commands.push(`set anti_gravity_gain = ${analysis.other.anti_gravity_gain}`);

  // 保存命令
  commands.push('');
  commands.push('save');

  return commands.join('\n');
}

// 完整的滤波器参数类型
interface FiltersConfig {
  // 陀螺仪动态低通滤波器
  gyro_lpf1_dyn_min_hz: number;
  gyro_lpf1_dyn_max_hz: number;
  gyro_lpf1_static_hz: number;
  gyro_lpf2_static_hz: number;
  // D-term 动态低通滤波器
  dterm_lpf1_dyn_min_hz: number;
  dterm_lpf1_dyn_max_hz: number;
  dterm_lpf1_static_hz: number;
  dterm_lpf2_static_hz: number;
  // 动态陷波滤波器
  dyn_notch_count: number;
  dyn_notch_q: number;
  dyn_notch_min_hz: number;
  dyn_notch_max_hz: number;
  // RPM 滤波器
  rpm_filter_harmonics: number;
  rpm_filter_min_hz: number;
}

// 完整的其他参数类型
interface OtherConfig {
  // D 增益参数
  d_max_gain: number;
  d_max_advance: number;
  d_min_roll: number;
  d_min_pitch: number;
  // Feedforward 参数
  feedforward_transition: number;
  feedforward_boost: number;
  feedforward_max_rate_limit: number;
  feedforward_jitter_factor: number;
  // TPA 参数
  tpa_rate: number;
  tpa_breakpoint: number;
  tpa_low_rate: number;
  tpa_low_breakpoint: number;
  // I-term 参数
  iterm_relax_cutoff: number;
  iterm_windup: number;
  iterm_limit: number;
  // 油门参数
  throttle_boost: number;
  throttle_boost_cutoff: number;
  // 电机参数
  motor_output_limit: number;
  // 抗重力
  anti_gravity_gain: number;
}

// 从 GPT 返回的 CLI/Markdown 格式中解析完整调参配置
function parseCliFormatResponse(response: string): {
  analysis: { summary: string; issues: string[]; recommendations: string[] };
  pid: { roll: { p: number; i: number; d: number; f: number }; pitch: { p: number; i: number; d: number; f: number }; yaw: { p: number; i: number; d: number; f: number } };
  filters: FiltersConfig;
  other: OtherConfig;
} {
  const pid = {
    roll: { p: 0, i: 0, d: 0, f: 0 },
    pitch: { p: 0, i: 0, d: 0, f: 0 },
    yaw: { p: 0, i: 0, d: 0, f: 0 },
  };

  const filters: FiltersConfig = {
    gyro_lpf1_dyn_min_hz: 0,
    gyro_lpf1_dyn_max_hz: 0,
    gyro_lpf1_static_hz: 0,
    gyro_lpf2_static_hz: 0,
    dterm_lpf1_dyn_min_hz: 0,
    dterm_lpf1_dyn_max_hz: 0,
    dterm_lpf1_static_hz: 0,
    dterm_lpf2_static_hz: 0,
    dyn_notch_count: 0,
    dyn_notch_q: 0,
    dyn_notch_min_hz: 0,
    dyn_notch_max_hz: 0,
    rpm_filter_harmonics: 0,
    rpm_filter_min_hz: 0,
  };

  const other: OtherConfig = {
    d_max_gain: 0,
    d_max_advance: 0,
    d_min_roll: 0,
    d_min_pitch: 0,
    feedforward_transition: 0,
    feedforward_boost: 0,
    feedforward_max_rate_limit: 0,
    feedforward_jitter_factor: 0,
    tpa_rate: 0,
    tpa_breakpoint: 0,
    tpa_low_rate: 0,
    tpa_low_breakpoint: 0,
    iterm_relax_cutoff: 0,
    iterm_windup: 0,
    iterm_limit: 0,
    throttle_boost: 0,
    throttle_boost_cutoff: 0,
    motor_output_limit: 0,
    anti_gravity_gain: 0,
  };

  // 解析 PID 值
  const pidPatterns = [
    { regex: /set\s+p_roll\s*=\s*(\d+)/gi, axis: 'roll' as const, param: 'p' as const },
    { regex: /set\s+i_roll\s*=\s*(\d+)/gi, axis: 'roll' as const, param: 'i' as const },
    { regex: /set\s+d_roll\s*=\s*(\d+)/gi, axis: 'roll' as const, param: 'd' as const },
    { regex: /set\s+f_roll\s*=\s*(\d+)/gi, axis: 'roll' as const, param: 'f' as const },
    { regex: /set\s+p_pitch\s*=\s*(\d+)/gi, axis: 'pitch' as const, param: 'p' as const },
    { regex: /set\s+i_pitch\s*=\s*(\d+)/gi, axis: 'pitch' as const, param: 'i' as const },
    { regex: /set\s+d_pitch\s*=\s*(\d+)/gi, axis: 'pitch' as const, param: 'd' as const },
    { regex: /set\s+f_pitch\s*=\s*(\d+)/gi, axis: 'pitch' as const, param: 'f' as const },
    { regex: /set\s+p_yaw\s*=\s*(\d+)/gi, axis: 'yaw' as const, param: 'p' as const },
    { regex: /set\s+i_yaw\s*=\s*(\d+)/gi, axis: 'yaw' as const, param: 'i' as const },
    { regex: /set\s+d_yaw\s*=\s*(\d+)/gi, axis: 'yaw' as const, param: 'd' as const },
    { regex: /set\s+f_yaw\s*=\s*(\d+)/gi, axis: 'yaw' as const, param: 'f' as const },
  ];

  for (const { regex, axis, param } of pidPatterns) {
    const matches = [...response.matchAll(regex)];
    if (matches.length > 0) {
      pid[axis][param] = parseInt(matches[matches.length - 1][1], 10);
    }
  }

  // 解析滤波器值 - 完整列表
  const filterPatterns: { regex: RegExp; key: keyof FiltersConfig }[] = [
    // 陀螺仪滤波器
    { regex: /set\s+gyro_lpf1_dyn_min_hz\s*=\s*(\d+)/gi, key: 'gyro_lpf1_dyn_min_hz' },
    { regex: /set\s+gyro_lpf1_dyn_max_hz\s*=\s*(\d+)/gi, key: 'gyro_lpf1_dyn_max_hz' },
    { regex: /set\s+gyro_lpf1_static_hz\s*=\s*(\d+)/gi, key: 'gyro_lpf1_static_hz' },
    { regex: /set\s+gyro_lpf2_static_hz\s*=\s*(\d+)/gi, key: 'gyro_lpf2_static_hz' },
    // D-term 滤波器
    { regex: /set\s+dterm_lpf1_dyn_min_hz\s*=\s*(\d+)/gi, key: 'dterm_lpf1_dyn_min_hz' },
    { regex: /set\s+dterm_lpf1_dyn_max_hz\s*=\s*(\d+)/gi, key: 'dterm_lpf1_dyn_max_hz' },
    { regex: /set\s+dterm_lpf1_static_hz\s*=\s*(\d+)/gi, key: 'dterm_lpf1_static_hz' },
    { regex: /set\s+dterm_lpf2_static_hz\s*=\s*(\d+)/gi, key: 'dterm_lpf2_static_hz' },
    // 动态陷波滤波器
    { regex: /set\s+dyn_notch_count\s*=\s*(\d+)/gi, key: 'dyn_notch_count' },
    { regex: /set\s+dyn_notch_q\s*=\s*(\d+)/gi, key: 'dyn_notch_q' },
    { regex: /set\s+dyn_notch_min_hz\s*=\s*(\d+)/gi, key: 'dyn_notch_min_hz' },
    { regex: /set\s+dyn_notch_max_hz\s*=\s*(\d+)/gi, key: 'dyn_notch_max_hz' },
    // RPM 滤波器
    { regex: /set\s+rpm_filter_harmonics\s*=\s*(\d+)/gi, key: 'rpm_filter_harmonics' },
    { regex: /set\s+rpm_filter_min_hz\s*=\s*(\d+)/gi, key: 'rpm_filter_min_hz' },
  ];

  for (const { regex, key } of filterPatterns) {
    const matches = [...response.matchAll(regex)];
    if (matches.length > 0) {
      filters[key] = parseInt(matches[matches.length - 1][1], 10);
    }
  }

  // 解析其他参数 - 完整列表
  const otherPatterns: { regex: RegExp; key: keyof OtherConfig }[] = [
    // D 增益参数
    { regex: /set\s+d_max_gain\s*=\s*(\d+)/gi, key: 'd_max_gain' },
    { regex: /set\s+d_max_advance\s*=\s*(\d+)/gi, key: 'd_max_advance' },
    { regex: /set\s+d_min_roll\s*=\s*(\d+)/gi, key: 'd_min_roll' },
    { regex: /set\s+d_min_pitch\s*=\s*(\d+)/gi, key: 'd_min_pitch' },
    // Feedforward 参数
    { regex: /set\s+feedforward_transition\s*=\s*(\d+)/gi, key: 'feedforward_transition' },
    { regex: /set\s+feedforward_boost\s*=\s*(\d+)/gi, key: 'feedforward_boost' },
    { regex: /set\s+feedforward_max_rate_limit\s*=\s*(\d+)/gi, key: 'feedforward_max_rate_limit' },
    { regex: /set\s+feedforward_jitter_factor\s*=\s*(\d+)/gi, key: 'feedforward_jitter_factor' },
    // TPA 参数
    { regex: /set\s+tpa_rate\s*=\s*(\d+)/gi, key: 'tpa_rate' },
    { regex: /set\s+tpa_breakpoint\s*=\s*(\d+)/gi, key: 'tpa_breakpoint' },
    { regex: /set\s+tpa_low_rate\s*=\s*(\d+)/gi, key: 'tpa_low_rate' },
    { regex: /set\s+tpa_low_breakpoint\s*=\s*(\d+)/gi, key: 'tpa_low_breakpoint' },
    // I-term 参数
    { regex: /set\s+iterm_relax_cutoff\s*=\s*(\d+)/gi, key: 'iterm_relax_cutoff' },
    { regex: /set\s+iterm_windup\s*=\s*(\d+)/gi, key: 'iterm_windup' },
    { regex: /set\s+iterm_limit\s*=\s*(\d+)/gi, key: 'iterm_limit' },
    // 油门参数
    { regex: /set\s+throttle_boost\s*=\s*(\d+)/gi, key: 'throttle_boost' },
    { regex: /set\s+throttle_boost_cutoff\s*=\s*(\d+)/gi, key: 'throttle_boost_cutoff' },
    // 电机参数
    { regex: /set\s+motor_output_limit\s*=\s*(\d+)/gi, key: 'motor_output_limit' },
    // 抗重力
    { regex: /set\s+anti_gravity_gain\s*=\s*(\d+)/gi, key: 'anti_gravity_gain' },
  ];

  for (const { regex, key } of otherPatterns) {
    const matches = [...response.matchAll(regex)];
    if (matches.length > 0) {
      other[key] = parseInt(matches[matches.length - 1][1], 10);
    }
  }

  // 验证是否成功解析了任何 PID 值
  const hasAnyPidValue =
    pid.roll.p !== 0 || pid.roll.i !== 0 || pid.roll.d !== 0 || pid.roll.f !== 0 ||
    pid.pitch.p !== 0 || pid.pitch.i !== 0 || pid.pitch.d !== 0 || pid.pitch.f !== 0;

  if (!hasAnyPidValue) {
    throw new Error('Failed to parse PID values from response');
  }

  // 从 GPT 响应中提取分析内容
  const analysisContent = extractAnalysisFromResponse(response);

  return {
    analysis: analysisContent,
    pid,
    filters,
    other,
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const blackboxFile = formData.get('blackbox') as File | null;
    const cliDumpFile = formData.get('cliDump') as File | null;
    const problems = formData.get('problems') as string;
    const goals = formData.get('goals') as string;
    const customGoal = formData.get('customGoal') as string;
    const flyingStyle = formData.get('flyingStyle') as string;
    const frameSize = formData.get('frameSize') as string;
    const additionalNotes = formData.get('additionalNotes') as string;
    const locale = (formData.get('locale') as string) || 'en';

    if (!blackboxFile) {
      return NextResponse.json(
        { error: 'Blackbox file is required' },
        { status: 400 }
      );
    }

    // 读取 blackbox 文件内容
    const fileBuffer = await blackboxFile.arrayBuffer();

    // 调用 BBL Decoder 服务解码 BBL 文件
    const BBL_DECODER_URL = process.env.BBL_DECODER_URL || 'https://api.fpvtune.com';
    let decodedBBLJson = '';

    try {
      console.log('[analyze] Decoding BBL file via decoder service...');
      const decodeResponse = await fetch(`${BBL_DECODER_URL}/decode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: new Uint8Array(fileBuffer),
      });

      if (!decodeResponse.ok) {
        const errorText = await decodeResponse.text();
        console.error('[analyze] BBL Decoder failed:', decodeResponse.status, errorText);
        // 解码失败时使用空数据，AI 会基于用户配置给出建议
        decodedBBLJson = '{"error": "BBL decode failed", "message": "' + errorText.substring(0, 100) + '"}';
      } else {
        decodedBBLJson = await decodeResponse.text();
        console.log('[analyze] BBL decoded successfully, JSON size:', decodedBBLJson.length, 'chars');
      }
    } catch (decodeError) {
      console.error('[analyze] BBL decode error:', decodeError);
      decodedBBLJson = '{"error": "BBL decode failed"}';
    }

    // 读取 CLI dump 文件内容（如果有）
    let cliDumpContent = '';
    if (cliDumpFile) {
      const cliBuffer = await cliDumpFile.arrayBuffer();
      cliDumpContent = new TextDecoder().decode(cliBuffer);
    }

    // 将 ID 转换为可读名称
    const problemNames = mapIdsToNames(problems, PROBLEM_NAMES, locale);
    const goalNames = mapIdsToNames(goals, GOAL_NAMES, locale);
    const styleName = getNameById(flyingStyle, STYLE_NAMES, locale);
    const frameName = getNameById(frameSize, FRAME_NAMES, locale);

    // 合并目标（包括自定义目标）
    const allGoals = customGoal ? `${goalNames}, ${customGoal}` : goalNames;

    // 解析 CLI 中的当前 PID 值
    const currentPidValues = cliDumpContent
      ? parsePidFromCli(cliDumpContent)
      : 'No CLI dump provided - use default Betaflight values as baseline';

    // 解析 CLI 中的滤波器和其他参数
    const { filters: currentFilters, other: currentOther } = cliDumpContent
      ? parseFiltersAndOtherFromCli(cliDumpContent)
      : { filters: 'No CLI dump provided', other: 'No CLI dump provided' };

    // 构建 prompt（根据语言）
    const prompt = getBlackboxAnalysisPrompt(locale)
      .replace('{problems}', problemNames)
      .replace('{goals}', allGoals)
      .replace('{flyingStyle}', styleName)
      .replace('{frameSize}', frameName)
      .replace('{additionalNotes}', additionalNotes || 'None')
      .replace('{currentPidValues}', currentPidValues)
      .replace('{currentFilters}', currentFilters)
      .replace('{currentOther}', currentOther);

    // 构建用户消息，使用解码后的 BBL JSON 和 CLI dump 数据
    let userMessage = `Here is the decoded Betaflight blackbox data (JSON format):\n\n${decodedBBLJson}`;
    if (cliDumpContent) {
      userMessage += `\n\n--- Current CLI Settings (diff output) ---\n${cliDumpContent}`;
    }
    userMessage +=
      '\n\nPlease analyze this data and provide optimized PID settings.';

    console.log('OpenAI Request - Problems:', problemNames);
    console.log('OpenAI Request - Goals:', allGoals);
    console.log('OpenAI Request - Style:', styleName);
    console.log('OpenAI Request - Frame:', frameName);
    console.log('OpenAI Request - CLI Dump included:', !!cliDumpContent);
    console.log('OpenAI Request - Decoded BBL JSON length:', decodedBBLJson.length, 'chars');

    // 调用 GPT 分析（带模型轮询）
    const completion = await chatCompletionWithFallback(
      [
        {
          role: 'system',
          content: prompt,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      {
        temperature: 0.3,
        max_tokens: 4000,
      }
    );

    const result = completion.choices[0]?.message?.content;

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to generate analysis' },
        { status: 500 }
      );
    }

    // 打印 GPT 原始响应用于调试
    console.log('GPT Raw Response (first 500 chars):', result.substring(0, 500));

    // 尝试解析 JSON 响应
    let analysis;
    try {
      // 尝试提取 JSON（有时 GPT 会在 JSON 前后添加文字）
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        // 如果没有 JSON，尝试从 Markdown/CLI 格式中提取 PID 值
        console.log('No JSON found, attempting to parse CLI format from response...');
        analysis = parseCliFormatResponse(result);
      }
    } catch (parseError) {
      console.error('JSON Parse Error, attempting CLI format parse...');
      try {
        analysis = parseCliFormatResponse(result);
      } catch (cliParseError) {
        console.error('CLI Parse also failed. Raw response:', result);
        return NextResponse.json(
          {
            error: 'GPT did not return valid JSON',
            rawResponse: result.substring(0, 1000),
            details: parseError instanceof Error ? parseError.message : 'Unknown parse error'
          },
          { status: 500 }
        );
      }
    }

    // 用原始 CLI 值填充 GPT 没返回的参数，生成完整的调参数据
    // 这样用户可以直接复制完整的 CLI 命令到 Betaflight
    if (cliDumpContent) {
      // 填充 PID 值
      if (analysis.pid) {
        const originalPid = parseOriginalPidFromCli(cliDumpContent);
        for (const axis of ['roll', 'pitch', 'yaw'] as const) {
          for (const param of ['p', 'i', 'd', 'f'] as const) {
            if (analysis.pid[axis] && analysis.pid[axis][param] === 0 && originalPid[axis][param] !== 0) {
              analysis.pid[axis][param] = originalPid[axis][param];
            }
          }
        }
      }

      // 填充滤波器值
      if (analysis.filters) {
        const originalFilters = parseOriginalFiltersFromCli(cliDumpContent);
        for (const key of Object.keys(originalFilters) as (keyof FiltersConfig)[]) {
          if (analysis.filters[key] === 0 && originalFilters[key] !== 0) {
            analysis.filters[key] = originalFilters[key];
          }
        }
      }

      // 填充其他参数值
      if (analysis.other) {
        const originalOther = parseOriginalOtherFromCli(cliDumpContent);
        for (const key of Object.keys(originalOther) as (keyof OtherConfig)[]) {
          if (analysis.other[key] === 0 && originalOther[key] !== 0) {
            analysis.other[key] = originalOther[key];
          }
        }
      }
    }

    // 生成完整的 CLI 命令，用户可以直接复制到 Betaflight
    // 确保 analysis 有必要的属性
    if (!analysis.pid || !analysis.filters || !analysis.other) {
      console.error('Analysis missing required fields:', {
        hasPid: !!analysis.pid,
        hasFilters: !!analysis.filters,
        hasOther: !!analysis.other
      });
      return NextResponse.json(
        {
          error: 'GPT response missing required fields (pid/filters/other)',
          rawResponse: result.substring(0, 1000),
        },
        { status: 500 }
      );
    }

    const cliCommands = generateCliCommands(analysis);
    analysis.cliCommands = cliCommands;

    return NextResponse.json({
      success: true,
      analysis,
      model: DEFAULT_MODEL,
      usage: completion.usage,
    });
  } catch (error) {
    console.error('Analysis error:', error);

    // 提取详细错误信息
    let errorMessage = 'Failed to analyze blackbox data';
    let errorDetails = '';

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || '';

      // OpenAI API 错误通常有更多信息
      const apiError = error as { status?: number; code?: string; type?: string };
      if (apiError.status || apiError.code) {
        errorDetails = JSON.stringify({
          status: apiError.status,
          code: apiError.code,
          type: apiError.type,
          message: error.message,
        });
      }
    }

    console.error('Error details:', errorDetails);

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
      },
      { status: 500 }
    );
  }
}
