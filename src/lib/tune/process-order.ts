import db from '@/db';
import { tuneOrder } from '@/db/schema';
import { DEFAULT_MODEL, getBlackboxAnalysisPrompt, openai } from '@/lib/openai';
import { downloadFile, extractKeyFromUrl } from '@/storage';
import type { AnalysisResult } from '@/types/tune';
import { eq } from 'drizzle-orm';
import { isBBLFormat } from './bbl-parser';
import {
  FRAME_NAMES,
  GOAL_NAMES,
  PROBLEM_NAMES,
  STYLE_NAMES,
  getNameById,
  mapIdsToNames,
} from './mappings';

// BBL Decoder 服务 URL
const BBL_DECODER_URL =
  process.env.BBL_DECODER_URL || 'http://47.243.149.39:8080';

// 调用 BBL Decoder 服务解码 BBL 文件
async function decodeBBL(bblBuffer: Buffer): Promise<string> {
  const response = await fetch(`${BBL_DECODER_URL}/decode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: bblBuffer,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`BBL Decoder failed: ${response.status} - ${errorText}`);
  }

  const decodedJson = await response.text();
  console.log(`[decodeBBL] Decoded JSON size: ${decodedJson.length} chars`);
  return decodedJson;
}

async function runAIAnalysis(
  blackboxBuffer: Buffer | null,
  cliDumpContent: string,
  problems: string,
  goals: string,
  flyingStyle: string,
  frameSize: string,
  motorSize: string,
  motorKv: string,
  battery: string,
  propeller: string,
  motorTemp: string,
  weight: string,
  additionalNotes: string,
  locale: string
): Promise<AnalysisResult> {
  // 将 ID 转换为可读名称
  const problemNames = mapIdsToNames(problems, PROBLEM_NAMES, locale);
  const goalNames = mapIdsToNames(goals, GOAL_NAMES, locale);
  const styleName = getNameById(flyingStyle, STYLE_NAMES, locale);
  const frameName = getNameById(frameSize, FRAME_NAMES, locale);

  // 电机温度映射
  const motorTempMap: Record<string, Record<string, string>> = {
    normal: { en: 'Normal (warm to touch)', zh: '正常 (温热)' },
    warm: { en: 'Warm (hot but touchable)', zh: '偏热 (烫手但可触摸)' },
    hot: { en: 'Hot (too hot to touch)', zh: '过热 (无法触摸)' },
  };
  const motorTempName = motorTemp
    ? motorTempMap[motorTemp]?.[locale] || motorTemp
    : '';

  const prompt = getBlackboxAnalysisPrompt(locale)
    .replace('{problems}', problemNames)
    .replace('{goals}', goalNames)
    .replace('{flyingStyle}', styleName)
    .replace('{frameSize}', frameName)
    .replace('{motorSize}', motorSize || 'Not specified')
    .replace('{motorKv}', motorKv || 'Not specified')
    .replace('{battery}', battery ? battery.toUpperCase() : 'Not specified')
    .replace('{propeller}', propeller || 'Not specified')
    .replace('{motorTemp}', motorTempName || 'Not specified')
    .replace('{weight}', weight || 'Not specified')
    .replace('{additionalNotes}', additionalNotes || 'None');

  // 解码 BBL 文件为 JSON
  let decodedBBLJson = '';
  if (blackboxBuffer) {
    try {
      console.log('[runAIAnalysis] Decoding BBL file via decoder service...');
      decodedBBLJson = await decodeBBL(blackboxBuffer);
      console.log(
        '[runAIAnalysis] BBL decoded successfully, JSON size:',
        decodedBBLJson.length,
        'chars'
      );
    } catch (decodeError) {
      console.error('[runAIAnalysis] BBL decode failed:', decodeError);
      // 解码失败时，使用空数据继续（AI 会基于用户配置给出建议）
      decodedBBLJson = '{"error": "BBL decode failed"}';
    }
  }

  // 构建用户消息 - 使用解码后的 JSON
  let userMessage = '';
  if (decodedBBLJson) {
    userMessage = `Here is the decoded Betaflight blackbox data (JSON format):\n\n${decodedBBLJson}`;
  }
  if (cliDumpContent) {
    userMessage += `\n\n--- Current Betaflight CLI Configuration ---\n${cliDumpContent}`;
  }
  userMessage +=
    '\n\nBased on this flight data, please analyze and provide optimized PID recommendations.';
  userMessage +=
    '\n\nIMPORTANT: Respond with ONLY a JSON object starting with { - no markdown, no explanations.';

  console.log('AI Analysis - Problems:', problemNames);
  console.log('AI Analysis - Goals:', goalNames);
  console.log('AI Analysis - Style:', styleName);
  console.log('AI Analysis - Frame:', frameName);
  console.log('AI Analysis - Motor:', motorSize, motorKv + 'KV');
  console.log('AI Analysis - Battery:', battery);
  console.log('AI Analysis - Propeller:', propeller);
  console.log('AI Analysis - Motor Temp:', motorTempName);
  console.log('AI Analysis - Weight:', weight);
  console.log('AI Analysis - Decoded BBL JSON length:', decodedBBLJson.length);
  console.log('AI Analysis - CLI dump included:', !!cliDumpContent);
  console.log(
    'AI Analysis - Total message length:',
    userMessage.length,
    'chars'
  );

  try {
    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: prompt,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      temperature: 0.2,
      max_tokens: 4000,
    });

    const result = completion.choices[0]?.message?.content;
    console.log('AI raw response (first 500 chars):', result?.slice(0, 500));

    if (!result) {
      throw new Error('Failed to generate analysis: empty response');
    }

    // 检查是否是拒绝响应
    if (
      result.toLowerCase().startsWith("i can't") ||
      result.toLowerCase().startsWith('i cannot') ||
      result.toLowerCase().startsWith('sorry') ||
      result.toLowerCase().includes("i'm not able to")
    ) {
      console.error('AI refused the request:', result.slice(0, 200));
      throw new Error(`AI refused request: ${result.slice(0, 100)}`);
    }

    // 从响应中提取 JSON（可能包含 markdown 或思考过程）
    let jsonStr = result;

    // 移除 <think>...</think> 标签及其内容
    jsonStr = jsonStr.replace(/<think>[\s\S]*?<\/think>/gi, '');

    // 尝试提取 ```json ... ``` 代码块
    const jsonMatch = jsonStr.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    } else {
      // 使用括号匹配找到完整的 JSON 对象
      const firstBrace = jsonStr.indexOf('{');
      if (firstBrace !== -1) {
        let depth = 0;
        let inString = false;
        let escapeNext = false;
        let endIndex = -1;

        for (let i = firstBrace; i < jsonStr.length; i++) {
          const char = jsonStr[i];

          if (escapeNext) {
            escapeNext = false;
            continue;
          }

          if (char === '\\' && inString) {
            escapeNext = true;
            continue;
          }

          if (char === '"' && !escapeNext) {
            inString = !inString;
            continue;
          }

          if (!inString) {
            if (char === '{') {
              depth++;
            } else if (char === '}') {
              depth--;
              if (depth === 0) {
                endIndex = i;
                break;
              }
            }
          }
        }

        if (endIndex !== -1) {
          jsonStr = jsonStr.substring(firstBrace, endIndex + 1);
        } else {
          // 回退到旧方法
          const lastBrace = jsonStr.lastIndexOf('}');
          if (lastBrace > firstBrace) {
            jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
          }
        }
      }
    }

    console.log(
      '[runAIAnalysis] Extracted JSON (first 200 chars):',
      jsonStr.slice(0, 200)
    );

    let parsed: Record<string, unknown>;
    try {
      // 尝试修复常见的 JSON 问题
      let fixedJson = jsonStr;
      // 修复 +2 这样的无效数字（JSON 不允许 + 前缀）
      fixedJson = fixedJson.replace(/:\s*\+(\d+)/g, ': $1');
      // 修复尾随逗号
      fixedJson = fixedJson.replace(/,\s*([}\]])/g, '$1');

      parsed = JSON.parse(fixedJson);
    } catch (parseError) {
      console.error(
        '[runAIAnalysis] JSON parse failed, trying to fix truncated JSON'
      );

      // 尝试修复截断的 JSON
      let fixedJson = jsonStr;

      // 计算未闭合的括号数量
      let openBraces = 0;
      let openBrackets = 0;
      let inString = false;
      let escapeNext = false;

      for (const char of fixedJson) {
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        if (char === '\\') {
          escapeNext = true;
          continue;
        }
        if (char === '"' && !escapeNext) {
          inString = !inString;
          continue;
        }
        if (!inString) {
          if (char === '{') openBraces++;
          else if (char === '}') openBraces--;
          else if (char === '[') openBrackets++;
          else if (char === ']') openBrackets--;
        }
      }

      // 如果在字符串中被截断，先关闭字符串
      if (inString) {
        fixedJson += '"';
      }

      // 移除末尾不完整的键值对
      fixedJson = fixedJson.replace(/,\s*"[^"]*"?\s*:?\s*[^,}\]]*$/, '');
      fixedJson = fixedJson.replace(/,\s*$/, '');

      // 添加缺失的闭合括号
      for (let i = 0; i < openBrackets; i++) {
        fixedJson += ']';
      }
      for (let i = 0; i < openBraces; i++) {
        fixedJson += '}';
      }

      console.log(
        '[runAIAnalysis] Attempting to parse fixed JSON (last 100 chars):',
        fixedJson.slice(-100)
      );

      try {
        parsed = JSON.parse(fixedJson);
        console.log('[runAIAnalysis] Successfully parsed fixed JSON');
      } catch (secondError) {
        console.error(
          '[runAIAnalysis] Fixed JSON still failed, trying to extract from markdown'
        );

        // 尝试从 Markdown 格式的响应中提取数据
        const extractedData = extractFromMarkdown(result);
        if (extractedData.cliCommands || extractedData.pid) {
          console.log(
            '[runAIAnalysis] Extracted data from markdown - CLI:',
            extractedData.cliCommands?.length || 0,
            'chars, PID:',
            !!extractedData.pid
          );

          // 如果有 PID 但没有 CLI 命令，自动生成
          let cliCommands = extractedData.cliCommands || '';
          if (extractedData.pid && !cliCommands) {
            console.log(
              '[runAIAnalysis] Auto-generating CLI commands from extracted PID'
            );
            cliCommands = generateCliCommands(
              extractedData.pid,
              extractedData.filters,
              extractedData.other
            );
          }

          return {
            analysis: {
              summary:
                extractedData.summary ||
                'PID tuning recommendations generated from AI analysis',
              issues: extractedData.issues || [],
              recommendations: extractedData.recommendations || [],
            },
            pid: extractedData.pid,
            filters: extractedData.filters || {},
            other: extractedData.other || {},
            cli_commands: cliCommands,
          } as AnalysisResult;
        }

        console.error(
          '[runAIAnalysis] JSON string (first 500 chars):',
          jsonStr.slice(0, 500)
        );
        throw new Error(
          `Failed to parse AI response as JSON: ${secondError instanceof Error ? secondError.message : 'Unknown error'}`
        );
      }
    }

    // 从 Markdown 响应中提取数据的函数
    function extractFromMarkdown(text: string): {
      cliCommands: string | null;
      pid:
        | Record<string, { p: number; i: number; d: number; f: number }>
        | undefined;
      filters: Record<string, unknown>;
      other: Record<string, unknown>;
      summary: string | null;
      issues: string[];
      recommendations: string[];
    } {
      const cliLines: string[] = [];
      const pid: Record<
        string,
        { p: number; i: number; d: number; f: number }
      > = {
        roll: { p: 0, i: 0, d: 0, f: 0 },
        pitch: { p: 0, i: 0, d: 0, f: 0 },
        yaw: { p: 0, i: 0, d: 0, f: 0 },
      };
      const filters: Record<string, unknown> = {};
      const other: Record<string, unknown> = {};
      let hasPid = false;
      let hasFilters = false;

      // 匹配 ```...``` 代码块中的 set 命令
      const codeBlocks = text.match(/```[\s\S]*?```/g) || [];
      for (const block of codeBlocks) {
        const lines = block.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('set ') || trimmed === 'save') {
            cliLines.push(trimmed);
            // 解析 PID 值
            const pidMatch = trimmed.match(/set\s+([pidf])_(\w+)\s*=\s*(\d+)/i);
            if (pidMatch) {
              const [, param, axis, value] = pidMatch;
              const axisLower = axis.toLowerCase();
              if (axisLower in pid) {
                (pid[axisLower] as Record<string, number>)[
                  param.toLowerCase()
                ] = Number.parseInt(value);
                hasPid = true;
              }
            }
            // 解析滤波器值
            const filterMatch = trimmed.match(
              /set\s+(gyro_\w+|dterm_\w+|dyn_notch_\w+)\s*=\s*(\d+)/i
            );
            if (filterMatch) {
              filters[filterMatch[1]] = Number.parseInt(filterMatch[2]);
              hasFilters = true;
            }
            // 解析其他值
            const otherMatch = trimmed.match(
              /set\s+(d_min_\w+|d_max_\w+|throttle_boost|anti_gravity_\w+|feedforward_\w+|motor_output_limit|tpa_\w+|iterm_\w+)\s*=\s*(\d+)/i
            );
            if (otherMatch) {
              other[otherMatch[1]] = Number.parseInt(otherMatch[2]);
            }
          }
        }
      }

      // 如果代码块中没找到，尝试直接匹配文本中的 PID 建议
      // 格式如: "Roll P 45 → 48" 或 "Pitch: P 55, I 84, D 48, F 135"
      if (!hasPid) {
        const pidPatterns = [
          /Roll[:\s]+P\s*[=:]?\s*(\d+)[,\s]+I\s*[=:]?\s*(\d+)[,\s]+D\s*[=:]?\s*(\d+)[,\s]+F\s*[=:]?\s*(\d+)/gi,
          /Pitch[:\s]+P\s*[=:]?\s*(\d+)[,\s]+I\s*[=:]?\s*(\d+)[,\s]+D\s*[=:]?\s*(\d+)[,\s]+F\s*[=:]?\s*(\d+)/gi,
          /Yaw[:\s]+P\s*[=:]?\s*(\d+)[,\s]+I\s*[=:]?\s*(\d+)[,\s]+D\s*[=:]?\s*(\d+)[,\s]+F\s*[=:]?\s*(\d+)/gi,
        ];
        const axes = ['roll', 'pitch', 'yaw'];
        for (let i = 0; i < pidPatterns.length; i++) {
          const match = pidPatterns[i].exec(text);
          if (match) {
            pid[axes[i]] = {
              p: Number.parseInt(match[1]),
              i: Number.parseInt(match[2]),
              d: Number.parseInt(match[3]),
              f: Number.parseInt(match[4]),
            };
            hasPid = true;
          }
        }
      }

      // 尝试匹配单独的 PID 建议，如 "Pitch D 46 → 40" 或 "Roll P: 52 → 55"
      const singlePidPatterns = [
        /(Roll|Pitch|Yaw)\s+([PIDF])\s*:?\s*\d+\s*(?:→|->|=>|to)\s*(\d+)/gi,
        /(Roll|Pitch|Yaw)\s+([PIDF])\s*=\s*(\d+)/gi,
        /([PIDF])_(roll|pitch|yaw)\s*[=:]\s*(\d+)/gi,
      ];
      for (const pattern of singlePidPatterns) {
        let singleMatch;
        while ((singleMatch = pattern.exec(text)) !== null) {
          let axis: string, param: string, value: number;
          if (singleMatch[1].length === 1) {
            // 格式: p_roll = 52
            param = singleMatch[1].toLowerCase();
            axis = singleMatch[2].toLowerCase();
            value = Number.parseInt(singleMatch[3]);
          } else {
            // 格式: Roll P 52 → 55
            axis = singleMatch[1].toLowerCase();
            param = singleMatch[2].toLowerCase();
            value = Number.parseInt(singleMatch[3]);
          }
          if (axis in pid && ['p', 'i', 'd', 'f'].includes(param)) {
            (pid[axis] as Record<string, number>)[param] = value;
            hasPid = true;
          }
        }
      }

      // 尝试从表格格式提取 PID（GPT 常用格式）
      // | Axis | P | I | D | F |
      // | Roll | 52 | 80 | 45 | 130 |
      const tableRowPattern =
        /\|\s*(Roll|Pitch|Yaw)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|/gi;
      let tableMatch;
      while ((tableMatch = tableRowPattern.exec(text)) !== null) {
        const axis = tableMatch[1].toLowerCase();
        if (axis in pid) {
          pid[axis] = {
            p: Number.parseInt(tableMatch[2]),
            i: Number.parseInt(tableMatch[3]),
            d: Number.parseInt(tableMatch[4]),
            f: Number.parseInt(tableMatch[5]),
          };
          hasPid = true;
        }
      }

      // 尝试从列表格式提取 PID
      // - Roll: P=52, I=80, D=45, F=130
      const listPidPattern =
        /[-*]\s*(Roll|Pitch|Yaw)[:\s]+P\s*[=:]\s*(\d+)[,\s]+I\s*[=:]\s*(\d+)[,\s]+D\s*[=:]\s*(\d+)[,\s]+F\s*[=:]\s*(\d+)/gi;
      let listMatch;
      while ((listMatch = listPidPattern.exec(text)) !== null) {
        const axis = listMatch[1].toLowerCase();
        if (axis in pid) {
          pid[axis] = {
            p: Number.parseInt(listMatch[2]),
            i: Number.parseInt(listMatch[3]),
            d: Number.parseInt(listMatch[4]),
            f: Number.parseInt(listMatch[5]),
          };
          hasPid = true;
        }
      }

      // 提取滤波器值（从文本中）
      if (!hasFilters) {
        const filterPatterns = [
          /gyro_lpf1_dyn_min_hz[:\s=]+(\d+)/gi,
          /gyro_lpf1_dyn_max_hz[:\s=]+(\d+)/gi,
          /gyro_lpf1_static_hz[:\s=]+(\d+)/gi,
          /gyro_lpf2_static_hz[:\s=]+(\d+)/gi,
          /dterm_lpf1_dyn_min_hz[:\s=]+(\d+)/gi,
          /dterm_lpf1_dyn_max_hz[:\s=]+(\d+)/gi,
          /dterm_lpf1_static_hz[:\s=]+(\d+)/gi,
          /dterm_lpf2_static_hz[:\s=]+(\d+)/gi,
          /dyn_notch_count[:\s=]+(\d+)/gi,
          /dyn_notch_q[:\s=]+(\d+)/gi,
          /dyn_notch_min_hz[:\s=]+(\d+)/gi,
          /dyn_notch_max_hz[:\s=]+(\d+)/gi,
        ];
        const filterNames = [
          'gyro_lpf1_dyn_min_hz',
          'gyro_lpf1_dyn_max_hz',
          'gyro_lpf1_static_hz',
          'gyro_lpf2_static_hz',
          'dterm_lpf1_dyn_min_hz',
          'dterm_lpf1_dyn_max_hz',
          'dterm_lpf1_static_hz',
          'dterm_lpf2_static_hz',
          'dyn_notch_count',
          'dyn_notch_q',
          'dyn_notch_min_hz',
          'dyn_notch_max_hz',
        ];
        for (let i = 0; i < filterPatterns.length; i++) {
          const match = filterPatterns[i].exec(text);
          if (match) {
            filters[filterNames[i]] = Number.parseInt(match[1]);
            hasFilters = true;
          }
        }
      }

      // 提取摘要（第一段有意义的文本）
      let summary: string | null = null;
      const paragraphs = text.split(/\n\n+/);
      for (const p of paragraphs) {
        const cleaned = p.replace(/[#*`]/g, '').trim();
        if (
          cleaned.length > 50 &&
          cleaned.length < 500 &&
          !cleaned.startsWith('set ') &&
          !cleaned.startsWith('|')
        ) {
          summary = cleaned.slice(0, 300);
          break;
        }
      }

      // 提取问题列表
      const issues: string[] = [];
      const issuePatterns = [
        /(?:问题|issue|problem|发现)[:\s]*([^\n]+)/gi,
        /[-*]\s*(?:高|过|太|very|high|too|excessive|oscillation|振荡|抖动)\s*[^\n]+/gi,
      ];
      for (const pattern of issuePatterns) {
        let m;
        while ((m = pattern.exec(text)) !== null && issues.length < 5) {
          const issue = m[1] || m[0];
          if (issue && issue.length > 10 && issue.length < 200) {
            issues.push(issue.replace(/^[-*]\s*/, '').trim());
          }
        }
      }

      // 提取建议列表
      const recommendations: string[] = [];
      // 简单提取带箭头的建议
      const arrowLines = text.match(/[^\n]*(?:→|->|=>)[^\n]*/g) || [];
      for (const line of arrowLines.slice(0, 5)) {
        const cleaned = line.replace(/[#*`]/g, '').trim();
        if (cleaned.length > 10 && cleaned.length < 200) {
          recommendations.push(cleaned);
        }
      }
      // 提取建议相关的行
      const recLines =
        text.match(
          /(?:建议|recommend|suggest|调整|降低|提高|增加|减少)[^\n]+/gi
        ) || [];
      for (const line of recLines.slice(0, 5)) {
        const cleaned = line.replace(/[#*`]/g, '').trim();
        if (
          cleaned.length > 10 &&
          cleaned.length < 200 &&
          !recommendations.includes(cleaned)
        ) {
          recommendations.push(cleaned);
        }
      }

      // 确保 CLI 命令有 save
      if (cliLines.length > 0 && !cliLines.includes('save')) {
        cliLines.push('save');
      }

      return {
        cliCommands: cliLines.length > 0 ? cliLines.join('\n') : null,
        pid: hasPid ? pid : undefined,
        filters,
        other,
        summary,
        issues,
        recommendations,
      };
    }

    // 通用函数：递归搜索对象中的 PID 结构
    const findPidStructure = (
      obj: unknown,
      depth = 0
    ): Record<
      string,
      { p: number; i: number; d: number; f: number }
    > | null => {
      if (depth > 5 || !obj || typeof obj !== 'object') return null;
      const o = obj as Record<string, unknown>;

      // 检查是否是 PID 结构 { roll: {p,i,d,f}, pitch: {p,i,d,f}, yaw: {p,i,d,f} }
      if (o.roll && o.pitch && o.yaw) {
        const roll = o.roll as Record<string, unknown>;
        const pitch = o.pitch as Record<string, unknown>;
        if (typeof roll.p === 'number' && typeof pitch.p === 'number') {
          // 标准化字段名：将 ff 转换为 f（GPT 有时会用 ff 表示 feedforward）
          const normalizePidAxis = (axis: Record<string, unknown>) => ({
            p: axis.p as number,
            i: axis.i as number,
            d: axis.d as number,
            f: (axis.f ?? axis.ff ?? 0) as number,
          });
          return {
            roll: normalizePidAxis(o.roll as Record<string, unknown>),
            pitch: normalizePidAxis(o.pitch as Record<string, unknown>),
            yaw: normalizePidAxis(o.yaw as Record<string, unknown>),
          };
        }
      }

      // 递归搜索
      for (const key of Object.keys(o)) {
        const found = findPidStructure(o[key], depth + 1);
        if (found) return found;
      }
      return null;
    };

    // 通用函数：从 PID、滤波器和其他参数生成完整的 CLI 命令
    const generateCliCommands = (
      pidObj: Record<
        string,
        { p: number; i: number; d: number; f?: number; ff?: number }
      >,
      filtersObj?: Record<string, unknown>,
      otherObj?: Record<string, unknown>
    ): string => {
      const lines: string[] = [];

      const toNumber = (value: unknown): number | null => {
        if (typeof value === 'number' && Number.isFinite(value)) return value;
        if (typeof value === 'string') {
          const parsed = Number.parseFloat(value);
          return Number.isFinite(parsed) ? parsed : null;
        }
        return null;
      };

      const normalizeCliValue = (
        value: unknown,
        key?: string
      ): number | null => {
        const direct = toNumber(value);
        if (direct !== null) return direct;

        if (!value || typeof value !== 'object') return null;

        const obj = value as Record<string, unknown>;
        const candidates: string[] = [];
        if (key?.includes('_min_')) candidates.push('min');
        if (key?.includes('_max_')) candidates.push('max');
        candidates.push('value', 'val', 'hz', 'count');

        for (const candidate of candidates) {
          if (candidate in obj) {
            const candidateValue = toNumber(obj[candidate]);
            if (candidateValue !== null) return candidateValue;
          }
        }

        for (const candidateValue of Object.values(obj)) {
          const normalized = toNumber(candidateValue);
          if (normalized !== null) return normalized;
        }

        return null;
      };

      // PID 设置 - 支持 f 和 ff 两种格式
      lines.push('# PID Settings');
      if (pidObj.roll) {
        lines.push(`set p_roll = ${pidObj.roll.p}`);
        lines.push(`set i_roll = ${pidObj.roll.i}`);
        lines.push(`set d_roll = ${pidObj.roll.d}`);
        const rollF = pidObj.roll.f ?? pidObj.roll.ff ?? 130;
        lines.push(`set f_roll = ${rollF}`);
      }
      if (pidObj.pitch) {
        lines.push(`set p_pitch = ${pidObj.pitch.p}`);
        lines.push(`set i_pitch = ${pidObj.pitch.i}`);
        lines.push(`set d_pitch = ${pidObj.pitch.d}`);
        const pitchF = pidObj.pitch.f ?? pidObj.pitch.ff ?? 135;
        lines.push(`set f_pitch = ${pitchF}`);
      }
      if (pidObj.yaw) {
        lines.push(`set p_yaw = ${pidObj.yaw.p}`);
        lines.push(`set i_yaw = ${pidObj.yaw.i}`);
        lines.push(`set d_yaw = ${pidObj.yaw.d || 0}`);
        const yawF = pidObj.yaw.f ?? pidObj.yaw.ff ?? 120;
        lines.push(`set f_yaw = ${yawF}`);
      }

      // D Min/Max 设置（从 pidObj 或 otherObj）
      const dMin = pidObj.d_min as Record<string, number> | undefined;
      const dMax = pidObj.d_max as Record<string, number> | undefined;
      if (dMin || dMax || otherObj?.d_min_roll) {
        lines.push('');
        lines.push('# D Min/Max Settings');
        const dMinRoll = normalizeCliValue(
          dMin?.roll ?? otherObj?.d_min_roll,
          'd_min_roll'
        );
        const dMinPitch = normalizeCliValue(
          dMin?.pitch ?? otherObj?.d_min_pitch,
          'd_min_pitch'
        );
        const dMaxGain = normalizeCliValue(
          dMax?.gain ?? otherObj?.d_max_gain,
          'd_max_gain'
        );
        const dMaxAdvance = normalizeCliValue(
          dMax?.advance ?? otherObj?.d_max_advance,
          'd_max_advance'
        );

        if (dMinRoll !== null) lines.push(`set d_min_roll = ${dMinRoll}`);
        if (dMinPitch !== null) lines.push(`set d_min_pitch = ${dMinPitch}`);
        if (dMaxGain !== null) lines.push(`set d_max_gain = ${dMaxGain}`);
        if (dMaxAdvance !== null)
          lines.push(`set d_max_advance = ${dMaxAdvance}`);
      }

      // 滤波器设置
      if (filtersObj && Object.keys(filtersObj).length > 0) {
        lines.push('');
        lines.push('# Filter Settings');
        const filterKeys = [
          'gyro_lpf1_static_hz',
          'gyro_lpf1_dyn_min_hz',
          'gyro_lpf1_dyn_max_hz',
          'gyro_lpf2_static_hz',
          'gyro_lpf2_dyn_min_hz',
          'gyro_lpf2_dyn_max_hz',
          'dterm_lpf1_static_hz',
          'dterm_lpf1_dyn_min_hz',
          'dterm_lpf1_dyn_max_hz',
          'dterm_lpf2_static_hz',
          'dyn_notch_count',
          'dyn_notch_q',
          'dyn_notch_min_hz',
          'dyn_notch_max_hz',
          'gyro_lowpass_hz',
          'dterm_lowpass_hz', // 旧版参数名
        ];
        for (const key of filterKeys) {
          const normalizedValue = normalizeCliValue(filtersObj[key], key);
          if (normalizedValue !== null) {
            lines.push(`set ${key} = ${normalizedValue}`);
          }
        }
      }

      // 其他设置
      if (otherObj && Object.keys(otherObj).length > 0) {
        const otherKeys = [
          'throttle_boost',
          'anti_gravity_gain',
          'anti_gravity_cutoff_hz',
          'feedforward_transition',
          'feedforward_boost',
          'feedforward_max_rate_limit',
          'feedforward_smooth_factor',
          'feedforward_jitter_factor',
          'iterm_relax_cutoff',
          'motor_output_limit',
          'tpa_rate',
          'tpa_breakpoint',
        ];
        const hasOther = otherKeys.some((k) => otherObj[k] !== undefined);
        if (hasOther) {
          lines.push('');
          lines.push('# Other Settings');
          for (const key of otherKeys) {
            const normalizedValue = normalizeCliValue(otherObj[key], key);
            if (normalizedValue !== null) {
              lines.push(`set ${key} = ${normalizedValue}`);
            }
          }
        }
      }

      lines.push('');
      lines.push('save');
      return lines.join('\n');
    };

    // 标准化 PID 对象：将 ff 转换为 f
    const normalizePid = (
      pidObj: Record<string, unknown>
    ): Record<string, { p: number; i: number; d: number; f: number }> => {
      const normalizePidAxis = (axis: Record<string, unknown>) => ({
        p: (axis.p ?? 0) as number,
        i: (axis.i ?? 0) as number,
        d: (axis.d ?? 0) as number,
        f: (axis.f ?? axis.ff ?? 0) as number,
      });
      return {
        roll: normalizePidAxis((pidObj.roll || {}) as Record<string, unknown>),
        pitch: normalizePidAxis(
          (pidObj.pitch || {}) as Record<string, unknown>
        ),
        yaw: normalizePidAxis((pidObj.yaw || {}) as Record<string, unknown>),
      };
    };

    // 处理 GPT 返回的不同 JSON 结构
    let analysis = parsed.analysis as Record<string, unknown> | undefined;
    let pid = parsed.pid
      ? normalizePid(parsed.pid as Record<string, unknown>)
      : undefined;
    let filters = parsed.filters as Record<string, unknown> | undefined;
    let other = parsed.other as Record<string, unknown> | undefined;
    let cliCommands = parsed.cli_commands as string | undefined;

    // 兼容中文 JSON 格式: { "分析结果": { "发现的问题": [...], "调参建议": [...] } }
    const zhAnalysis = parsed['分析结果'] as Record<string, unknown> | undefined;
    if (zhAnalysis && !analysis) {
      console.log('[runAIAnalysis] Found Chinese format: 分析结果');
      const zhIssues = zhAnalysis['发现的问题'] as Array<Record<string, string>> | undefined;
      const zhRecs = zhAnalysis['调参建议'] as Array<Record<string, string>> | undefined;

      const issues: string[] = [];
      const recommendations: string[] = [];

      // 解析发现的问题
      if (zhIssues && Array.isArray(zhIssues)) {
        for (const item of zhIssues) {
          if (typeof item === 'string') {
            issues.push(item);
          } else if (item && typeof item === 'object') {
            // 格式: { "问题标题": "...", "具体描述": "..." }
            const title = item['问题标题'] || item.title || '';
            const desc = item['具体描述'] || item.description || '';
            if (title && desc) {
              issues.push(`${title}: ${desc}`);
            } else if (title) {
              issues.push(title);
            } else if (desc) {
              issues.push(desc);
            }
          }
        }
      }

      // 解析调参建议
      if (zhRecs && Array.isArray(zhRecs)) {
        for (const item of zhRecs) {
          if (typeof item === 'string') {
            recommendations.push(item);
          } else if (item && typeof item === 'object') {
            // 格式: { "建议标题": "...", "具体建议": "..." }
            const title = item['建议标题'] || item['建议'] || item.title || '';
            const desc = item['具体建议'] || item['预期效果'] || item.description || '';
            if (title && desc) {
              recommendations.push(`${title}: ${desc}`);
            } else if (title) {
              recommendations.push(title);
            } else if (desc) {
              recommendations.push(desc);
            }
          }
        }
      }

      if (issues.length > 0 || recommendations.length > 0) {
        analysis = {
          issues,
          recommendations,
          summary: issues.length > 0 ? `主要发现: ${issues[0].split(':')[0]}` : '已完成黑盒数据分析',
        };
        console.log('[runAIAnalysis] Converted Chinese analysis:', JSON.stringify(analysis));
      }
    }

    // 兼容英文 JSON 格式: { "analysis_results": { "issues_found": [...], "recommendations": [...] } }
    const enAnalysis = parsed['analysis_results'] as Record<string, unknown> | undefined;
    if (enAnalysis && !analysis) {
      console.log('[runAIAnalysis] Found English format: analysis_results');
      const enIssues = (enAnalysis['issues_found'] || enAnalysis['issues']) as Array<Record<string, string>> | undefined;
      const enRecs = enAnalysis['recommendations'] as Array<Record<string, string>> | undefined;

      const issues: string[] = [];
      const recommendations: string[] = [];

      if (enIssues && Array.isArray(enIssues)) {
        for (const item of enIssues) {
          if (typeof item === 'string') {
            issues.push(item);
          } else if (item && typeof item === 'object') {
            const title = item.title || item.issue || '';
            const desc = item.description || item.details || '';
            if (title && desc) {
              issues.push(`${title}: ${desc}`);
            } else if (title) {
              issues.push(title);
            }
          }
        }
      }

      if (enRecs && Array.isArray(enRecs)) {
        for (const item of enRecs) {
          if (typeof item === 'string') {
            recommendations.push(item);
          } else if (item && typeof item === 'object') {
            const title = item.title || item.recommendation || '';
            const desc = item.description || item.effect || '';
            if (title && desc) {
              recommendations.push(`${title}: ${desc}`);
            } else if (title) {
              recommendations.push(title);
            }
          }
        }
      }

      if (issues.length > 0 || recommendations.length > 0) {
        analysis = {
          issues,
          recommendations,
          summary: issues.length > 0 ? `Primary finding: ${issues[0].split(':')[0]}` : 'Blackbox analysis completed',
        };
        console.log('[runAIAnalysis] Converted English analysis:', JSON.stringify(analysis));
      }
    }

    // 如果没有直接的 pid 字段，递归搜索
    if (!pid) {
      const foundPid = findPidStructure(parsed);
      if (foundPid) {
        console.log('[runAIAnalysis] Found PID structure via recursive search');
        pid = foundPid;
      }
    }

    // 递归搜索 filters（查找包含滤波器相关键的对象）
    const findFiltersStructure = (
      obj: unknown,
      depth = 0
    ): Record<string, unknown> | null => {
      if (depth > 5 || !obj || typeof obj !== 'object') return null;
      const o = obj as Record<string, unknown>;

      // 检查是否包含滤波器相关的键
      const filterKeys = [
        'gyro_lpf1_static_hz',
        'gyro_lpf1_dyn_min_hz',
        'dterm_lpf1_static_hz',
        'dterm_lpf1_dyn_min_hz',
        'dyn_notch_count',
        'dyn_notch_min_hz',
        'gyro_lowpass_hz',
        'dterm_lowpass_hz',
      ];
      const hasFilterKey = filterKeys.some((k) => k in o);
      if (hasFilterKey) {
        return o;
      }

      // 递归搜索
      for (const key of Object.keys(o)) {
        const found = findFiltersStructure(o[key], depth + 1);
        if (found) return found;
      }
      return null;
    };

    if (!filters || Object.keys(filters).length === 0) {
      const foundFilters = findFiltersStructure(parsed);
      if (foundFilters) {
        console.log(
          '[runAIAnalysis] Found filters structure via recursive search'
        );
        filters = foundFilters;
      }
    }

    // 格式1: { recommendations: { profile_0: { pid: {...} } } }
    if (
      (parsed.recommendations as Record<string, unknown>)?.profile_0 &&
      !pid
    ) {
      console.log(
        '[runAIAnalysis] Converting format: recommendations.profile_0'
      );
      const recs = parsed.recommendations as Record<
        string,
        Record<string, unknown>
      >;
      const profile = recs.profile_0;
      const rawPid = profile.pid as Record<string, unknown>;

      // 检查 PID 格式：可能是 {roll: {p,i,d,f}} 或 {p_roll, i_roll, ...}
      if (rawPid) {
        if (
          rawPid.roll &&
          typeof (rawPid.roll as Record<string, unknown>).p === 'number'
        ) {
          // 已经是正确格式
          pid = rawPid as typeof pid;
        } else if (typeof rawPid.p_roll === 'number') {
          // 扁平格式，需要转换
          console.log('[runAIAnalysis] Converting flat PID format to nested');
          pid = {
            roll: {
              p: rawPid.p_roll as number,
              i: rawPid.i_roll as number,
              d: rawPid.d_roll as number,
              f: rawPid.f_roll as number,
            },
            pitch: {
              p: rawPid.p_pitch as number,
              i: rawPid.i_pitch as number,
              d: rawPid.d_pitch as number,
              f: rawPid.f_pitch as number,
            },
            yaw: {
              p: rawPid.p_yaw as number,
              i: rawPid.i_yaw as number,
              d: (rawPid.d_yaw as number) || 0,
              f: rawPid.f_yaw as number,
            },
          };
        }
      }

      filters = (profile.filters as typeof filters) || filters;
      other = (profile.other as typeof other) || other;
    }

    // 格式2: { pid_recommendations_profile0: { roll: {...}, pitch: {...}, yaw: {...} } }
    if (parsed.pid_recommendations_profile0 && !pid) {
      console.log(
        '[runAIAnalysis] Converting format: pid_recommendations_profile0'
      );
      pid = parsed.pid_recommendations_profile0;
    }

    // 格式2b: { current_profile0_pids: { roll: {...}, pitch: {...}, yaw: {...} } }
    // 或 { recommended_profile0_pids: { roll: {...}, pitch: {...}, yaw: {...} } }
    if (
      (parsed.current_profile0_pids || parsed.recommended_profile0_pids) &&
      !pid
    ) {
      console.log(
        '[runAIAnalysis] Converting format: current/recommended_profile0_pids'
      );
      pid = parsed.recommended_profile0_pids || parsed.current_profile0_pids;
    }

    // 格式3: { recommended_changes: { profile_0_pid: { p_roll, i_roll, ... } } }
    if (parsed.recommended_changes?.profile_0_pid && !pid) {
      console.log(
        '[runAIAnalysis] Converting format: recommended_changes.profile_0_pid'
      );
      const flatPid = parsed.recommended_changes.profile_0_pid as Record<
        string,
        unknown
      >;
      pid = {
        roll: {
          p: flatPid.p_roll,
          i: flatPid.i_roll,
          d: flatPid.d_roll,
          f: flatPid.f_roll,
        },
        pitch: {
          p: flatPid.p_pitch,
          i: flatPid.i_pitch,
          d: flatPid.d_pitch,
          f: flatPid.f_pitch,
        },
        yaw: {
          p: flatPid.p_yaw,
          i: flatPid.i_yaw,
          d: flatPid.d_yaw || 0,
          f: flatPid.f_yaw,
        },
      };
      // 提取其他参数
      other = {
        d_min_roll: flatPid.d_min_roll,
        d_min_pitch: flatPid.d_min_pitch,
        d_max_gain: flatPid.d_max_gain,
        d_max_advance: flatPid.d_max_advance,
        anti_gravity_gain: flatPid.anti_gravity_gain,
        throttle_boost: flatPid.throttle_boost,
        ...other,
      };
      // 提取滤波器参数
      if (parsed.recommended_changes.filters_profile_0) {
        filters = parsed.recommended_changes.filters_profile_0;
      }
    }

    // 格式3b: { recommended_changes: { profile_0_pids: { "set p_roll": 62, ... } } }
    // GPT 常用格式，键名带 "set " 前缀
    const recChanges = parsed.recommended_changes as
      | Record<string, unknown>
      | undefined;
    if (recChanges?.profile_0_pids && !pid) {
      console.log(
        '[runAIAnalysis] Converting format: recommended_changes.profile_0_pids (set format)'
      );
      const setPids = recChanges.profile_0_pids as Record<string, unknown>;

      // 提取 PID 值（处理 "set p_roll" 格式的键名）
      const getValue = (key: string): number => {
        // 尝试多种键名格式
        const val =
          setPids[`set ${key}`] ??
          setPids[key] ??
          setPids[key.replace('_', ' ')];
        return typeof val === 'number' ? val : 0;
      };

      pid = {
        roll: {
          p: getValue('p_roll'),
          i: getValue('i_roll'),
          d: getValue('d_roll'),
          f: getValue('f_roll'),
        },
        pitch: {
          p: getValue('p_pitch'),
          i: getValue('i_pitch'),
          d: getValue('d_pitch'),
          f: getValue('f_pitch'),
        },
        yaw: {
          p: getValue('p_yaw'),
          i: getValue('i_yaw'),
          d: getValue('d_yaw'),
          f: getValue('f_yaw'),
        },
      };

      // 提取其他参数
      other = {
        d_min_roll: getValue('d_min_roll'),
        d_min_pitch: getValue('d_min_pitch'),
        d_max_gain: getValue('d_max_gain'),
        d_max_advance: getValue('d_max_advance'),
        anti_gravity_gain: getValue('anti_gravity_gain'),
        throttle_boost: getValue('throttle_boost'),
        tpa_rate: getValue('tpa_rate'),
        tpa_breakpoint: getValue('tpa_breakpoint'),
        motor_output_limit: getValue('motor_output_limit'),
        ...other,
      };

      // 从 setPids 生成 CLI 命令
      if (!cliCommands) {
        const cliLines: string[] = [];
        for (const [key, value] of Object.entries(setPids)) {
          if (key.startsWith('set ')) {
            cliLines.push(`${key} = ${value}`);
          }
        }
        if (cliLines.length > 0) {
          cliCommands = cliLines.join('\n') + '\nsave';
        }
      }

      // 提取滤波器参数
      if (recChanges.profile_0_filters) {
        const setFilters = recChanges.profile_0_filters as Record<
          string,
          unknown
        >;
        const filterLines: string[] = [];
        for (const [key, value] of Object.entries(setFilters)) {
          if (key.startsWith('set ')) {
            filterLines.push(`${key} = ${value}`);
          }
        }
        if (filterLines.length > 0 && cliCommands) {
          // 在 save 之前插入滤波器命令
          cliCommands = cliCommands.replace(
            '\nsave',
            '\n' + filterLines.join('\n') + '\nsave'
          );
        }
        filters = setFilters;
      }
    }

    // 格式4: CLI 命令在 apply_as_cli_commands 数组中
    if (parsed.apply_as_cli_commands && !cliCommands) {
      const cmds = parsed.apply_as_cli_commands as string[];
      cliCommands = cmds.join('\n');
    }

    // 格式5: CLI 命令在 cli_commands_to_apply 数组中
    if (parsed.cli_commands_to_apply && !cliCommands) {
      const cmds = parsed.cli_commands_to_apply as string[];
      cliCommands = cmds.join('\n');
    }

    // 从 GPT 返回的 analysis 中提取数据，或从其他字段构建
    const ctx = parsed.context as Record<string, unknown> | undefined;
    const primaryFindings = parsed.primary_findings as
      | Record<string, unknown>
      | undefined;
    const keyObs = parsed.key_observations_from_data as
      | Record<string, unknown>
      | undefined;
    const logSummary = parsed.log_summary as
      | Record<string, unknown>
      | undefined;
    const observations = parsed.observations as
      | Record<string, unknown>
      | undefined;
    const diagnosis = parsed.diagnosis as Record<string, unknown> | undefined;
    const tuningNotes = parsed.tuning_notes as string[] | undefined;
    const meta = parsed.meta as Record<string, unknown> | undefined;
    const metaNotes = meta?.notes as string[] | undefined;

    // 支持 meta.analysis_basis.key_stats 结构（GPT 常用格式）
    const analysisBasis = meta?.analysis_basis as
      | Record<string, unknown>
      | undefined;
    const keyStats = analysisBasis?.key_stats as
      | Record<string, unknown>
      | undefined;

    // 从现有 analysis 提取或初始化
    const existingIssues = (analysis?.issues as string[]) || [];
    const existingRecs = (analysis?.recommendations as string[]) || [];
    let existingSummary = analysis?.summary as string | undefined;

    // 从 observations 构建补充问题分析
    const additionalIssues: string[] = [];
    const additionalRecs: string[] = [];

    // 检测文本是否为中文
    const isChinese = (text: string): boolean => /[\u4e00-\u9fa5]/.test(text);

    // 从 meta.notes 提取分析说明（作为建议或问题）
    // 只有当 locale 匹配时才使用（中文 locale 只用中文内容，英文 locale 只用英文内容）
    if (metaNotes && metaNotes.length > 0) {
      for (const note of metaNotes) {
        if (note.length > 20 && note.length < 500) {
          // 检查语言是否匹配
          const noteIsChinese = isChinese(note);
          const localeIsChinese = locale === 'zh';
          if (noteIsChinese !== localeIsChinese) {
            // 语言不匹配，跳过
            continue;
          }
          // 如果 note 包含问题相关的关键词，添加到 issues
          const isIssue =
            /noise|vibration|oscillat|error|problem|issue|high|过高|噪声|振动|震荡|问题|误差/i.test(
              note
            );
          if (isIssue && existingIssues.length < 4) {
            additionalIssues.push(note);
          } else {
            additionalRecs.push(note);
          }
        }
      }
    }

    // 如果 GPT 没有返回 analysis，但返回了 interpretation 或其他诊断字段，尝试提取
    const interpretation = (parsed.interpretation || meta?.interpretation) as
      | Record<string, unknown>
      | undefined;
    if (interpretation) {
      const overall = interpretation.overall as string | undefined;
      const issues = interpretation.issues as string[] | undefined;
      const recommendations = interpretation.recommendations as
        | string[]
        | undefined;

      if (overall && !existingSummary) {
        existingSummary = overall;
      }
      if (issues && issues.length > 0) {
        additionalIssues.push(...issues);
      }
      if (recommendations && recommendations.length > 0) {
        additionalRecs.push(...recommendations);
      }
    }

    // 处理 observations 或 meta.analysis_basis.key_stats 中的数据
    // 支持多种 GPT 返回格式
    const statsSource = observations || keyStats;
    console.log(
      '[runAIAnalysis] DEBUG - observations:',
      JSON.stringify(observations)
    );
    console.log('[runAIAnalysis] DEBUG - keyStats:', JSON.stringify(keyStats));
    console.log(
      '[runAIAnalysis] DEBUG - statsSource:',
      JSON.stringify(statsSource)
    );
    if (statsSource) {
      // 支持多种嵌套结构:
      // 1. observations.noise_vibration.gyro_rms_dps
      // 2. observations.gyro_rms_dps
      // 3. observations.gyro_noise.rms_dps (GPT 常用格式)
      // 4. key_stats.gyro_rms_dps
      const noiseVibration = (statsSource as Record<string, unknown>)
        .noise_vibration as Record<string, unknown> | undefined;
      const gyroNoise = (statsSource as Record<string, unknown>).gyro_noise as
        | Record<string, unknown>
        | undefined;
      const motors = (statsSource as Record<string, unknown>).motors as
        | Record<string, unknown>
        | undefined;

      // 提取陀螺仪 RMS 数据
      const gyroRms = (noiseVibration?.gyro_rms_dps ||
        gyroNoise?.rms_dps ||
        (statsSource as Record<string, unknown>).gyro_rms_dps) as
        | Record<string, number>
        | undefined;

      // 提取陀螺仪峰值频率数据
      const gyroPeak = (noiseVibration?.gyro_peak_hz ||
        gyroNoise?.peak_hz ||
        (statsSource as Record<string, unknown>).gyro_peak_hz) as
        | Record<string, number>
        | undefined;

      const pidError = (noiseVibration?.pid_error_rms ||
        (statsSource as Record<string, unknown>).pid_error_rms) as
        | Record<string, number>
        | undefined;
      console.log('[runAIAnalysis] DEBUG - gyroRms:', JSON.stringify(gyroRms));
      console.log(
        '[runAIAnalysis] DEBUG - gyroPeak:',
        JSON.stringify(gyroPeak)
      );

      const motorOutput = (noiseVibration?.motor_output ||
        (statsSource as Record<string, unknown>).motor_output) as
        | Record<string, unknown>
        | undefined;
      const motorImbalance = (motors?.motor_imbalance ||
        (statsSource as Record<string, unknown>).motor_imbalance) as
        | number
        | undefined;

      // 分析陀螺仪噪声
      if (gyroRms) {
        const rollNoise = gyroRms.roll || 0;
        const pitchNoise = gyroRms.pitch || 0;
        console.log(
          '[runAIAnalysis] DEBUG - rollNoise:',
          rollNoise,
          'pitchNoise:',
          pitchNoise,
          'threshold check:',
          rollNoise > 100 || pitchNoise > 100
        );
        if (rollNoise > 100 || pitchNoise > 100) {
          const severity =
            rollNoise > 150 || pitchNoise > 150
              ? locale === 'zh'
                ? '偏高'
                : 'high'
              : locale === 'zh'
                ? '中等'
                : 'moderate';
          const issueText =
            locale === 'zh'
              ? `陀螺仪噪声${severity} (Roll: ${rollNoise.toFixed(1)}°/s, Pitch: ${pitchNoise.toFixed(1)}°/s)，D项在高噪声环境下工作负担较重`
              : `Gyro noise ${severity} (Roll: ${rollNoise.toFixed(1)}°/s, Pitch: ${pitchNoise.toFixed(1)}°/s), D-term working hard in noisy environment`;
          console.log('[runAIAnalysis] DEBUG - Adding gyro issue:', issueText);
          additionalIssues.push(issueText);
        }
      }

      // 分析主要振动频率
      if (gyroPeak) {
        const rollPeak = gyroPeak.roll || 0;
        const pitchPeak = gyroPeak.pitch || 0;
        console.log(
          '[runAIAnalysis] DEBUG - rollPeak:',
          rollPeak,
          'pitchPeak:',
          pitchPeak
        );
        if (rollPeak > 0 || pitchPeak > 0) {
          const issueText =
            locale === 'zh'
              ? `检测到主要振动频率 (Roll: ${rollPeak}Hz, Pitch: ${pitchPeak}Hz)，动态陷波滤波器应覆盖此频段`
              : `Primary vibration frequencies detected (Roll: ${rollPeak}Hz, Pitch: ${pitchPeak}Hz), dynamic notch should cover this range`;
          console.log('[runAIAnalysis] DEBUG - Adding peak issue:', issueText);
          additionalIssues.push(issueText);
        }
      }

      // 分析 PID 跟踪误差
      if (pidError) {
        const rollError = pidError.roll || 0;
        const pitchError = pidError.pitch || 0;
        if (rollError > 30 || pitchError > 30) {
          const severity =
            rollError > 50 || pitchError > 50
              ? locale === 'zh'
                ? '较大'
                : 'high'
              : locale === 'zh'
                ? '中等'
                : 'moderate';
          additionalIssues.push(
            locale === 'zh'
              ? `PID 跟踪误差${severity} (Roll: ${rollError.toFixed(1)}, Pitch: ${pitchError.toFixed(1)})，可能影响响应灵敏度`
              : `PID tracking error ${severity} (Roll: ${rollError.toFixed(1)}, Pitch: ${pitchError.toFixed(1)}), may affect response`
          );
        }
      }

      // 分析电机不平衡
      if (motorImbalance && motorImbalance > 0.05) {
        const severity =
          motorImbalance > 0.1
            ? locale === 'zh'
              ? '明显'
              : 'significant'
            : locale === 'zh'
              ? '轻微'
              : 'slight';
        additionalIssues.push(
          locale === 'zh'
            ? `检测到${severity}电机不平衡 (${(motorImbalance * 100).toFixed(1)}%)，可能导致振动`
            : `${severity} motor imbalance detected (${(motorImbalance * 100).toFixed(1)}%), may cause vibration`
        );
      }

      // 分析电机输出
      if (motorOutput) {
        const avgOutput = motorOutput.average as number | undefined;
        const maxOutput = motorOutput.max as number | undefined;
        if (maxOutput && maxOutput >= 2000) {
          additionalIssues.push(
            locale === 'zh'
              ? `电机输出频繁达到饱和 (最大值: ${maxOutput})，调参需保守避免过激`
              : `Motor output frequently saturating (max: ${maxOutput}), tuning should be conservative`
          );
        } else if (avgOutput && avgOutput > 55) {
          additionalIssues.push(
            locale === 'zh'
              ? `平均电机输出较高 (${avgOutput.toFixed(1)}%)，注意电机温度`
              : `Average motor output elevated (${avgOutput.toFixed(1)}%), monitor motor temperature`
          );
        }
      }
    }

    // 处理 diagnosis 字段（包含 gyro_noise 等数据）
    if (diagnosis) {
      // 提取 diagnosis.gyro_noise 数据
      const diagGyroNoise = diagnosis.gyro_noise as
        | Record<string, unknown>
        | undefined;
      if (diagGyroNoise) {
        const rms = diagGyroNoise.rms_dps as Record<string, number> | undefined;
        const peak = diagGyroNoise.peak_hz as
          | Record<string, number>
          | undefined;
        const assessment = diagGyroNoise.assessment as string | undefined;

        if (rms) {
          const rollNoise = rms.roll || 0;
          const pitchNoise = rms.pitch || 0;
          if (rollNoise > 100 || pitchNoise > 100) {
            const severity =
              rollNoise > 150 || pitchNoise > 150
                ? locale === 'zh'
                  ? '偏高'
                  : 'high'
                : locale === 'zh'
                  ? '中等'
                  : 'moderate';
            additionalIssues.push(
              locale === 'zh'
                ? `陀螺仪噪声${severity} (Roll: ${rollNoise.toFixed(1)}°/s, Pitch: ${pitchNoise.toFixed(1)}°/s)，D项工作负担较重`
                : `Gyro noise ${severity} (Roll: ${rollNoise.toFixed(1)}°/s, Pitch: ${pitchNoise.toFixed(1)}°/s), D-term working hard`
            );
          }
        }

        if (peak) {
          const rollPeak = peak.roll || 0;
          const pitchPeak = peak.pitch || 0;
          if (rollPeak > 0 || pitchPeak > 0) {
            additionalIssues.push(
              locale === 'zh'
                ? `检测到主要振动频率 (Roll: ${rollPeak}Hz, Pitch: ${pitchPeak}Hz)`
                : `Primary vibration frequencies detected (Roll: ${rollPeak}Hz, Pitch: ${pitchPeak}Hz)`
            );
          }
        }
      }

      // 提取 diagnosis.motors 数据
      const diagMotors = diagnosis.motors as
        | Record<string, unknown>
        | undefined;
      if (diagMotors) {
        const motorMax = diagMotors.motor_max_all as string | undefined;
        if (motorMax && motorMax.includes('2047')) {
          additionalIssues.push(
            locale === 'zh'
              ? '电机输出达到饱和 (2047)，调参需保守避免过激'
              : 'Motor output saturating (2047), tuning should be conservative'
          );
        }
      }

      // 提取 issues 和 recommendations（过滤语言不匹配的内容）
      const diagIssues = diagnosis.issues as string[] | undefined;
      const diagRecs = diagnosis.recommendations as string[] | undefined;
      if (diagIssues) {
        for (const issue of diagIssues) {
          const issueIsChinese = isChinese(issue);
          const localeIsChinese = locale === 'zh';
          if (issueIsChinese === localeIsChinese) {
            additionalIssues.push(issue);
          }
        }
      }
      if (diagRecs) {
        for (const rec of diagRecs) {
          const recIsChinese = isChinese(rec);
          const localeIsChinese = locale === 'zh';
          if (recIsChinese === localeIsChinese) {
            additionalRecs.push(rec);
          }
        }
      }
    }

    // 处理 tuning_notes（过滤语言不匹配的内容）
    if (tuningNotes && tuningNotes.length > 0) {
      for (const note of tuningNotes) {
        const noteIsChinese = isChinese(note);
        const localeIsChinese = locale === 'zh';
        if (noteIsChinese === localeIsChinese) {
          additionalRecs.push(note);
        }
      }
    }

    console.log(
      '[runAIAnalysis] DEBUG - additionalIssues before merge:',
      JSON.stringify(additionalIssues)
    );
    console.log(
      '[runAIAnalysis] DEBUG - existingIssues:',
      JSON.stringify(existingIssues)
    );

    // 合并 issues（去重）
    const allIssues = [...existingIssues];
    for (const issue of additionalIssues) {
      if (
        !allIssues.some(
          (i) =>
            i.includes(issue.slice(0, 20)) || issue.includes(i.slice(0, 20))
        )
      ) {
        allIssues.push(issue);
      }
    }

    // 如果 issues 仍然为空，基于用户报告的问题生成
    if (allIssues.length === 0 && problems) {
      console.log(
        '[runAIAnalysis] No issues found, generating from user problems:',
        problems
      );
      const problemList = problems
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);
      const problemDescriptions: Record<string, Record<string, string>> = {
        propwash: {
          zh: '桨洗振荡：急速下降或快速转向时出现抖动，通常与 D 项设置和滤波器配置相关',
          en: 'Propwash oscillation: vibration during rapid descents or quick turns, typically related to D-term and filter settings',
        },
        oscillation: {
          zh: '高频振荡：飞行中持续的细微抖动，可能由 P 项过高或滤波器频率设置不当引起',
          en: 'High-frequency oscillation: persistent fine vibration during flight, may be caused by high P-term or improper filter settings',
        },
        bounce: {
          zh: '弹跳/回弹：快速动作后的过冲和回弹，通常与 D 项不足或 I 项过高有关',
          en: 'Bounce-back: overshoot and bounce after quick maneuvers, typically related to insufficient D-term or high I-term',
        },
        sluggish: {
          zh: '响应迟钝：操控感觉不灵敏，可能需要提高 P 项和前馈值',
          en: 'Sluggish response: controls feel unresponsive, may need higher P-term and feedforward values',
        },
        drift: {
          zh: '漂移/不稳定：悬停时位置不稳定，可能与 I 项设置或陀螺仪校准有关',
          en: 'Drift/instability: unstable position during hover, may be related to I-term settings or gyro calibration',
        },
        motor_hot: {
          zh: '电机过热：飞行后电机温度过高，可能需要降低 D 项或调整滤波器以减少高频噪声',
          en: 'Motor overheating: motors too hot after flight, may need lower D-term or filter adjustments to reduce high-frequency noise',
        },
        noise: {
          zh: '噪声/杂音：电机发出异常声音，通常与滤波器设置或电调配置有关',
          en: 'Noise: abnormal motor sounds, typically related to filter settings or ESC configuration',
        },
      };

      for (const problem of problemList) {
        const desc = problemDescriptions[problem];
        if (desc) {
          allIssues.push(desc[locale] || desc.en);
        }
      }
      console.log('[runAIAnalysis] Generated issues from problems:', allIssues);
    }

    console.log(
      '[runAIAnalysis] DEBUG - allIssues after merge:',
      JSON.stringify(allIssues)
    );

    // 合并 recommendations（去重）
    const allRecs = [...existingRecs];
    for (const rec of additionalRecs) {
      if (
        !allRecs.some(
          (r) => r.includes(rec.slice(0, 20)) || rec.includes(r.slice(0, 20))
        )
      ) {
        allRecs.push(rec);
      }
    }

    // 如果 recommendations 仍然为空，基于用户目标和问题生成
    if (allRecs.length === 0) {
      console.log(
        '[runAIAnalysis] No recommendations found, generating from goals and problems'
      );
      const goalList = goals
        ? goals
            .split(',')
            .map((g) => g.trim())
            .filter(Boolean)
        : [];
      const problemList = problems
        ? problems
            .split(',')
            .map((p) => p.trim())
            .filter(Boolean)
        : [];

      const goalRecommendations: Record<string, Record<string, string>> = {
        smooth: {
          zh: '提升平滑度：适当降低 P 项，增加 D 项以抑制过冲，调整滤波器减少高频噪声传递',
          en: 'Improve smoothness: lower P-term slightly, increase D-term to suppress overshoot, adjust filters to reduce high-frequency noise',
        },
        responsive: {
          zh: '提升响应性：增加 P 项和前馈值，确保滤波器不会过度延迟信号',
          en: "Improve responsiveness: increase P-term and feedforward, ensure filters don't over-delay signals",
        },
        locked: {
          zh: '增强锁定感：提高 I 项以改善位置保持，适当增加 D 项抑制漂移',
          en: 'Improve locked-in feel: increase I-term for better position hold, add D-term to suppress drift',
        },
        efficient: {
          zh: '提升效率：降低 D 项减少电机发热，优化滤波器设置减少不必要的高频补偿',
          en: 'Improve efficiency: lower D-term to reduce motor heat, optimize filters to reduce unnecessary high-frequency compensation',
        },
      };

      const problemRecommendations: Record<string, Record<string, string>> = {
        propwash: {
          zh: '针对桨洗：增加 D 项（特别是 D_min），降低动态陷波滤波器的最小频率，考虑启用 D_max',
          en: 'For propwash: increase D-term (especially D_min), lower dynamic notch min frequency, consider enabling D_max',
        },
        oscillation: {
          zh: '针对振荡：降低 P 项 5-10%，检查滤波器是否过于激进，确保陀螺仪安装稳固',
          en: 'For oscillation: lower P-term by 5-10%, check if filters are too aggressive, ensure gyro is mounted securely',
        },
        bounce: {
          zh: '针对弹跳：增加 D 项，降低 I 项，调整前馈过渡值',
          en: 'For bounce: increase D-term, lower I-term, adjust feedforward transition',
        },
        sluggish: {
          zh: '针对迟钝：提高 P 项和前馈值，检查滤波器延迟是否过大',
          en: 'For sluggish response: increase P-term and feedforward, check if filter delay is too high',
        },
        motor_hot: {
          zh: '针对电机过热：降低 D 项 10-20%，提高滤波器截止频率，检查桨叶平衡',
          en: 'For motor heat: lower D-term by 10-20%, raise filter cutoff frequencies, check prop balance',
        },
      };

      // 添加基于目标的建议
      for (const goal of goalList) {
        const rec = goalRecommendations[goal];
        if (rec) {
          allRecs.push(rec[locale] || rec.en);
        }
      }

      // 添加基于问题的建议
      for (const problem of problemList) {
        const rec = problemRecommendations[problem];
        if (rec && !allRecs.some((r) => r.includes(problem))) {
          allRecs.push(rec[locale] || rec.en);
        }
      }

      console.log('[runAIAnalysis] Generated recommendations:', allRecs);
    }

    // 从 context.notes 数组获取摘要（如果没有）
    const contextNotes = ctx?.notes as string[] | undefined;
    let summary =
      existingSummary ||
      (logSummary?.note as string) ||
      (primaryFindings?.propwash_oscillation_likely_causes as string[])?.join(
        '; '
      ) ||
      (contextNotes ? contextNotes.join(' ') : null) ||
      (ctx?.goal as string) ||
      (keyObs?.notes as string[])?.join(' ') ||
      null;

    // 如果摘要是默认的无意义文本，生成更好的摘要
    if (
      !summary ||
      summary === 'PID tuning recommendations generated' ||
      summary.length < 20
    ) {
      if (allIssues.length > 0) {
        summary =
          locale === 'zh'
            ? `基于黑盒数据分析，发现 ${allIssues.length} 个需要优化的问题。已根据飞行数据和用户配置生成针对性的 PID 调参建议。`
            : `Based on blackbox analysis, found ${allIssues.length} issues to optimize. Generated targeted PID recommendations based on flight data and user configuration.`;
      } else {
        summary =
          locale === 'zh'
            ? '已根据黑盒数据和用户配置生成优化的 PID 调参方案。'
            : 'Generated optimized PID tuning based on blackbox data and user configuration.';
      }
    }

    // 从 context.issue_reported 获取更多问题
    const ctxIssues =
      (ctx?.issue_reported as string[]) ||
      (primaryFindings?.propwash_oscillation_likely_causes as string[]) ||
      (primaryFindings?.sluggish_response_likely_causes as string[]) ||
      (keyObs?.notes as string[]) ||
      [];
    if (ctxIssues.length > 0) {
      for (const issue of ctxIssues) {
        if (
          !allIssues.some(
            (i) =>
              i.includes(issue.slice(0, 20)) || issue.includes(i.slice(0, 20))
          )
        ) {
          allIssues.push(issue);
        }
      }
    }

    // 从 context.notes 获取更多建议
    if (contextNotes) {
      for (const rec of contextNotes) {
        if (
          !allRecs.some(
            (r) => r.includes(rec.slice(0, 20)) || rec.includes(r.slice(0, 20))
          )
        ) {
          allRecs.push(rec);
        }
      }
    }

    // 更新 analysis
    analysis = { summary, issues: allIssues, recommendations: allRecs };

    // 确保 filters 有默认值
    if (!filters) {
      const recChanges = parsed.recommended_changes as
        | Record<string, unknown>
        | undefined;
      filters =
        (parsed.supporting_filter_and_response_recommendations as typeof filters) ||
        (recChanges?.filters_profile_0 as typeof filters) ||
        {};
    }

    // 如果有 PID 但没有 CLI 命令，自动生成（包含滤波器和其他参数）
    if (pid && !cliCommands) {
      console.log(
        '[runAIAnalysis] Auto-generating CLI commands from PID, filters, and other'
      );
      cliCommands = generateCliCommands(pid, filters, other);
    }

    console.log('[runAIAnalysis] Final PID:', JSON.stringify(pid));
    console.log('[runAIAnalysis] Final filters:', JSON.stringify(filters));
    console.log(
      '[runAIAnalysis] Final CLI commands length:',
      cliCommands?.length || 0
    );

    // 如果 PID 值无效或缺失，使用基于机架尺寸和飞行风格的默认值
    const getDefaultPid = (
      frame: string,
      style: string
    ): Record<string, { p: number; i: number; d: number; f: number }> => {
      // 基础 PID 值（5寸自由飞）
      const basePid = {
        roll: { p: 52, i: 80, d: 45, f: 130 },
        pitch: { p: 55, i: 84, d: 48, f: 135 },
        yaw: { p: 45, i: 80, d: 0, f: 120 },
      };

      // 根据机架尺寸调整
      const frameMultipliers: Record<string, number> = {
        '2': 0.7, // 2寸 - 更低的 PID
        '2.5': 0.75,
        '3': 0.8,
        '3.5': 0.85,
        '4': 0.9,
        '5': 1.0, // 5寸 - 基准
        '6': 1.1,
        '7': 1.15,
        '8': 1.2,
        '9': 1.25,
        '10': 1.3,
      };

      // 根据飞行风格调整
      const styleAdjustments: Record<
        string,
        { p: number; d: number; f: number }
      > = {
        freestyle: { p: 1.0, d: 1.0, f: 1.0 },
        racing: { p: 1.1, d: 0.9, f: 1.2 }, // 竞速：更高 P 和 F，更低 D
        cinematic: { p: 0.85, d: 1.1, f: 0.8 }, // 航拍：更低 P 和 F，更高 D
        longrange: { p: 0.9, d: 1.0, f: 0.9 }, // 远航：稍低的响应
      };

      const frameMult = frameMultipliers[frame] || 1.0;
      const styleAdj = styleAdjustments[style] || styleAdjustments['freestyle'];

      return {
        roll: {
          p: Math.round(basePid.roll.p * frameMult * styleAdj.p),
          i: Math.round(basePid.roll.i * frameMult),
          d: Math.round(basePid.roll.d * frameMult * styleAdj.d),
          f: Math.round(basePid.roll.f * frameMult * styleAdj.f),
        },
        pitch: {
          p: Math.round(basePid.pitch.p * frameMult * styleAdj.p),
          i: Math.round(basePid.pitch.i * frameMult),
          d: Math.round(basePid.pitch.d * frameMult * styleAdj.d),
          f: Math.round(basePid.pitch.f * frameMult * styleAdj.f),
        },
        yaw: {
          p: Math.round(basePid.yaw.p * frameMult * styleAdj.p),
          i: Math.round(basePid.yaw.i * frameMult),
          d: 0,
          f: Math.round(basePid.yaw.f * frameMult * styleAdj.f),
        },
      };
    };

    // 获取默认滤波器值
    const getDefaultFilters = (frame: string): Record<string, unknown> => {
      // 小机架需要更高的滤波器频率
      const frameSize = Number.parseInt(frame) || 5;
      const baseFreq = frameSize <= 3 ? 1.3 : frameSize <= 4 ? 1.15 : 1.0;

      return {
        gyro_lpf1_dyn_min_hz: Math.round(200 * baseFreq),
        gyro_lpf1_dyn_max_hz: Math.round(500 * baseFreq),
        dterm_lpf1_dyn_min_hz: Math.round(80 * baseFreq),
        dterm_lpf1_dyn_max_hz: Math.round(170 * baseFreq),
        dterm_lpf2_static_hz: Math.round(150 * baseFreq),
        dyn_notch_count: 2,
        dyn_notch_q: 350,
        dyn_notch_min_hz: Math.round(100 * baseFreq),
        dyn_notch_max_hz: Math.round(600 * baseFreq),
      };
    };

    // 验证 PID 值是否有效
    const isPidValid = (pidObj: typeof pid): boolean => {
      if (!pidObj) return false;
      const roll = pidObj.roll;
      const pitch = pidObj.pitch;
      if (!roll || !pitch) return false;
      // 检查是否有合理的 P 值（通常在 20-100 之间）
      return roll.p >= 20 && roll.p <= 150 && pitch.p >= 20 && pitch.p <= 150;
    };

    // 如果 PID 无效，使用默认值
    if (!isPidValid(pid)) {
      console.log(
        '[runAIAnalysis] PID values invalid or missing, using defaults based on frame/style'
      );
      pid = getDefaultPid(frameSize, flyingStyle);
      console.log('[runAIAnalysis] Default PID:', JSON.stringify(pid));
    }

    // 如果滤波器为空，使用默认值
    if (!filters || Object.keys(filters).length === 0) {
      console.log(
        '[runAIAnalysis] Filters missing, using defaults based on frame size'
      );
      filters = getDefaultFilters(frameSize);
      console.log('[runAIAnalysis] Default filters:', JSON.stringify(filters));
    }

    // 重新生成 CLI 命令（确保包含所有参数）
    if (pid) {
      console.log(
        '[runAIAnalysis] Regenerating CLI commands with complete parameters'
      );
      cliCommands = generateCliCommands(pid, filters, other);
    }

    return {
      analysis,
      pid,
      filters,
      other: other || {},
      cli_commands: cliCommands || '',
    } as AnalysisResult;
  } catch (error) {
    console.error('OpenAI API error:', error);
    // 提取 OpenAI 错误信息
    if (error instanceof Error) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
    const errObj = error as Record<string, unknown>;
    if (errObj && typeof errObj === 'object') {
      const message = errObj.message || errObj.error || errObj.statusText;
      if (message) {
        throw new Error(`OpenAI API error: ${String(message)}`);
      }
    }
    throw new Error('OpenAI API error: Unknown error');
  }
}

export async function processOrder(orderId: string): Promise<void> {
  const startTime = Date.now();
  console.log(`[processOrder] Starting order processing: ${orderId}`);

  const [order] = await db
    .select()
    .from(tuneOrder)
    .where(eq(tuneOrder.id, orderId))
    .limit(1);

  if (!order) {
    throw new Error(`Order not found: ${orderId}`);
  }

  console.log(
    `[processOrder] Found order: ${order.orderNumber}, current status: ${order.status}`
  );

  // 如果订单已经完成，跳过处理
  if (order.status === 'completed') {
    console.log(
      `[processOrder] Order ${order.orderNumber} already completed, skipping`
    );
    return;
  }

  try {
    await db
      .update(tuneOrder)
      .set({ status: 'processing', updatedAt: new Date() })
      .where(eq(tuneOrder.id, orderId));

    console.log(
      `[processOrder] Order ${order.orderNumber} status updated to processing`
    );

    // 从 R2 读取 BBL 文件（主存储）
    // 数据库中的 blackboxContent 已废弃，不再使用
    let rawBuffer: Buffer | null = null;

    if (order.blackboxUrl) {
      // 从 R2 下载
      console.log(
        `[${order.orderNumber}] Downloading blackbox from R2: ${order.blackboxUrl}`
      );
      const blackboxKey = extractKeyFromUrl(order.blackboxUrl);
      console.log(
        `[${order.orderNumber}] Extracted blackbox key: ${blackboxKey}`
      );
      if (blackboxKey) {
        try {
          const { content, contentType } = await downloadFile(blackboxKey);
          console.log(
            `[${order.orderNumber}] R2 download successful - contentType: ${contentType}, buffer size: ${content.length}`
          );
          rawBuffer = content;

          // 验证是否为 BBL 格式
          if (!isBBLFormat(rawBuffer)) {
            console.error(
              `[${order.orderNumber}] Downloaded content is not valid BBL format`
            );
            throw new Error('Downloaded file is not a valid BBL format');
          }
        } catch (downloadError) {
          console.error(
            `[${order.orderNumber}] Failed to download blackbox file:`,
            downloadError
          );
          throw new Error('Failed to download blackbox file from storage');
        }
      } else {
        throw new Error('Invalid blackbox file URL');
      }
    } else if (order.blackboxContent) {
      // 兼容旧订单：从数据库读取（已废弃）
      console.log(
        `[${order.orderNumber}] Using legacy blackbox content from database`
      );
      rawBuffer = Buffer.from(order.blackboxContent, 'base64');
      console.log(
        `[${order.orderNumber}] Decoded buffer size: ${rawBuffer.length}`
      );

      // 验证数据是否有效
      if (!isBBLFormat(rawBuffer)) {
        console.error(
          `[${order.orderNumber}] Database content is not valid BBL format, data may be corrupted`
        );
        throw new Error(
          'Blackbox data is corrupted. Please contact support for a refund or re-upload.'
        );
      }
    } else {
      throw new Error('No blackbox content or URL in order');
    }

    // 添加调试日志
    const firstBytes = rawBuffer.subarray(0, 100).toString('utf-8');
    console.log(
      `[${order.orderNumber}] Buffer first 100 bytes: ${JSON.stringify(firstBytes)}`
    );

    // BBL 文件将在 runAIAnalysis 中通过 decoder 服务解码
    // 这里只需要验证格式
    if (rawBuffer && !isBBLFormat(rawBuffer)) {
      console.warn(
        `[${order.orderNumber}] File may not be valid BBL format, proceeding anyway`
      );
    }

    // 优先从数据库读取 CLI dump 内容
    let cliDumpContent = '';
    if (order.cliDumpContent) {
      cliDumpContent = order.cliDumpContent;
      console.log(
        `[${order.orderNumber}] Using CLI dump content from database, length: ${cliDumpContent.length}`
      );
    } else if (order.cliDumpUrl) {
      // 后备方案：从 R2 下载
      console.log(`Downloading CLI dump file from: ${order.cliDumpUrl}`);
      const cliDumpKey = extractKeyFromUrl(order.cliDumpUrl);
      if (cliDumpKey) {
        try {
          const { content } = await downloadFile(cliDumpKey);
          cliDumpContent = content.toString('utf-8');
          console.log(
            `CLI dump file downloaded, content length: ${cliDumpContent.length}`
          );
        } catch (downloadError) {
          console.error('Failed to download CLI dump file:', downloadError);
          // CLI dump 是可选的，不阻止流程
        }
      }
    }

    console.log(
      `[processOrder] Running AI analysis for order ${order.orderNumber}...`
    );
    const aiStartTime = Date.now();
    const analysis = await runAIAnalysis(
      rawBuffer, // 直接传入原始 Buffer
      cliDumpContent,
      order.problems || '',
      order.goals || '',
      order.flyingStyle || '',
      order.frameSize || '',
      order.motorSize || '',
      order.motorKv || '',
      order.battery || '',
      order.propeller || '',
      order.motorTemp || '',
      order.weight || '',
      order.additionalNotes || '',
      order.locale || 'en'
    );
    console.log(
      `[processOrder] AI analysis completed in ${Date.now() - aiStartTime}ms`
    );

    // 生成结果页面链接
    const baseUrl =
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://fpvtune.com';
    const resultUrl = `${baseUrl}/${order.locale || 'en'}/tune/success?order=${order.orderNumber}`;

    // 先保存分析结果，确保即使邮件发送失败也不会丢失
    await db
      .update(tuneOrder)
      .set({
        status: 'completed',
        analysisResult: analysis,
        cliCommands: analysis.cli_commands,
        resultUrl: resultUrl,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(tuneOrder.id, orderId));

    console.log(
      `[processOrder] Analysis saved for order ${order.orderNumber}`
    );

    const totalTime = Date.now() - startTime;
    console.log(
      `[processOrder] Order ${order.orderNumber} completed successfully in ${totalTime}ms!`
    );
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(
      `[processOrder] Error processing order ${order.orderNumber} after ${totalTime}ms:`,
      error
    );
    console.error('[processOrder] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });

    await db
      .update(tuneOrder)
      .set({
        status: 'failed',
        updatedAt: new Date(),
      })
      .where(eq(tuneOrder.id, orderId));

    // 确保抛出的是 Error 实例
    if (error instanceof Error) {
      throw error;
    }

    // 尝试提取错误信息
    let errorMessage = 'Unknown error';
    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object') {
      const errObj = error as Record<string, unknown>;
      if ('message' in errObj && typeof errObj.message === 'string') {
        errorMessage = errObj.message;
      } else if ('error' in errObj && typeof errObj.error === 'string') {
        errorMessage = errObj.error;
      } else if (
        'statusText' in errObj &&
        typeof errObj.statusText === 'string'
      ) {
        errorMessage = errObj.statusText;
      } else {
        try {
          errorMessage = JSON.stringify(
            error,
            Object.getOwnPropertyNames(error)
          );
        } catch {
          errorMessage = Object.prototype.toString.call(error);
        }
      }
    }
    throw new Error(errorMessage);
  }
}
