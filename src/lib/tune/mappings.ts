/**
 * ID 到名称的映射模块
 * 用于将用户选择的 ID 转换为可读的名称
 */

// 问题 ID 到名称的映射
export const PROBLEM_NAMES: Record<string, { en: string; zh: string }> = {
  propwash: { en: 'Propwash oscillation', zh: '桨洗振荡' },
  hotmotors: { en: 'Hot motors', zh: '电机过热' },
  sluggish: { en: 'Sluggish response', zh: '响应迟钝' },
  oscillation: { en: 'Mid-throttle oscillation', zh: '中油门振荡' },
  bouncy: { en: 'Bouncy/floaty feel', zh: '弹跳/飘浮感' },
  noise: { en: 'Excessive noise/vibration', zh: '噪音/振动过大' },
};

// 目标 ID 到名称的映射
export const GOAL_NAMES: Record<string, { en: string; zh: string }> = {
  locked: { en: 'Locked-in feel', zh: '锁定感' },
  smooth: { en: 'Smooth video', zh: '平滑视频' },
  snappy: { en: 'Snappy response', zh: '灵敏响应' },
  efficient: { en: 'Better efficiency', zh: '更高效率' },
  balanced: { en: 'Balanced tune', zh: '均衡调参' },
};

// 飞行风格 ID 到名称的映射
export const STYLE_NAMES: Record<string, { en: string; zh: string }> = {
  freestyle: { en: 'Freestyle', zh: '自由飞行' },
  racing: { en: 'Racing', zh: '竞速' },
  cinematic: { en: 'Cinematic', zh: '航拍' },
  longrange: { en: 'Long Range', zh: '远航' },
};

// 机架尺寸 ID 到名称的映射
export const FRAME_NAMES: Record<string, { en: string; zh: string }> = {
  inch2_3: { en: '2-3 inch (Micro/Toothpick)', zh: '2-3寸 (微型/牙签机)' },
  inch5: { en: '5 inch (Standard)', zh: '5寸 (标准)' },
  inch7: { en: '7 inch (Long Range)', zh: '7寸 (远航)' },
  inch10plus: { en: '10+ inch (X-Class/Cinelifter)', zh: '10寸+ (X级/载机)' },
};

/**
 * 将 ID 列表转换为可读名称
 */
export function mapIdsToNames(
  ids: string | null | undefined,
  mapping: Record<string, { en: string; zh: string }>,
  locale: string
): string {
  if (!ids) return 'Not specified';
  const idList = ids.split(', ').filter(Boolean);
  if (idList.length === 0) return 'Not specified';
  const lang = locale === 'zh' ? 'zh' : 'en';
  return idList.map((id) => mapping[id]?.[lang] || id).join(', ');
}

/**
 * 获取单个 ID 的名称
 */
export function getNameById(
  id: string | null | undefined,
  mapping: Record<string, { en: string; zh: string }>,
  locale: string
): string {
  if (!id) return 'Not specified';
  const lang = locale === 'zh' ? 'zh' : 'en';
  return mapping[id]?.[lang] || id;
}
