/**
 * BBL (Betaflight Blackbox Log) 文件解析器
 * 纯 JavaScript 实现，不依赖 WASM，兼容 Cloudflare Workers
 */

export interface ParsedBBLData {
  headers: Record<string, string>;
  frames: string;
  stats: {
    totalFrames: number;
    duration: number;
    firmwareVersion: string;
    craftName: string;
  };
}

/**
 * 从 BBL 文件中提取头部配置（ASCII 部分）
 * 这是一个轻量级方法，不需要 WASM 解析器
 */
export function extractBBLHeader(buffer: Buffer): string {
  const headerLines: string[] = [];
  let currentLine = '';
  let inHeader = false;

  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i];

    // 换行符
    if (byte === 0x0a) {
      if (currentLine.startsWith('H ')) {
        headerLines.push(currentLine);
        inHeader = true;
      } else if (inHeader && currentLine.length > 0) {
        // 遇到非头部行，停止解析
        break;
      }
      currentLine = '';
      continue;
    }

    // 跳过回车符
    if (byte === 0x0d) {
      continue;
    }

    // 只处理可打印 ASCII 字符 (32-126)
    if (byte >= 32 && byte <= 126) {
      currentLine += String.fromCharCode(byte);
    } else if (inHeader) {
      // 遇到非 ASCII 字符且已经在头部中，说明头部结束
      break;
    }
  }

  // 处理最后一行
  if (currentLine.startsWith('H ')) {
    headerLines.push(currentLine);
  }

  return headerLines.join('\n');
}

/**
 * 从头部提取关键配置信息
 */
function parseHeaderInfo(headerText: string): {
  firmwareVersion: string;
  craftName: string;
  pidValues: Record<string, string>;
} {
  const lines = headerText.split('\n');
  let firmwareVersion = 'Unknown';
  let craftName = 'Unknown';
  const pidValues: Record<string, string> = {};

  for (const line of lines) {
    // 固件版本
    if (line.includes('Firmware revision:')) {
      const match = line.match(/Firmware revision:(.+)/);
      if (match) firmwareVersion = match[1].trim();
    }
    // 飞机名称
    if (line.includes('Craft name:')) {
      const match = line.match(/Craft name:(.+)/);
      if (match) craftName = match[1].trim();
    }
    // PID 值
    if (
      line.includes('rollPID:') ||
      line.includes('pitchPID:') ||
      line.includes('yawPID:')
    ) {
      const match = line.match(/H\s+(\w+PID):(.+)/);
      if (match) pidValues[match[1]] = match[2].trim();
    }
    // 其他重要参数
    if (
      line.includes('dterm_filter') ||
      line.includes('gyro_') ||
      line.includes('rates_')
    ) {
      const match = line.match(/H\s+(\w+):(.+)/);
      if (match) pidValues[match[1]] = match[2].trim();
    }
  }

  return { firmwareVersion, craftName, pidValues };
}

/**
 * 判断内容是否为 BBL 二进制格式
 */
export function isBBLFormat(buffer: Buffer): boolean {
  const firstBytes = buffer.slice(0, 100).toString('utf-8');
  return firstBytes.startsWith('H Product:Blackbox');
}

/**
 * 数据质量检查结果
 */
export interface AnalysisGateResult {
  analyzable: boolean;
  reason?: string;
  stats: {
    duration: number;
    totalFrames: number;
  };
}

/**
 * 数据质量检查 - 基于头部信息估算
 * 由于不解析帧数据，我们基于文件大小估算
 */
export function analysisGate(stats: {
  duration: number;
  totalFrames: number;
}): AnalysisGateResult {
  // 如果有统计信息，使用它们
  if (stats.duration > 0 || stats.totalFrames > 0) {
    if (stats.duration < 30 && stats.duration > 0) {
      return {
        analyzable: false,
        reason: `飞行时间太短: ${stats.duration.toFixed(1)}秒 (需要至少30秒)`,
        stats,
      };
    }
    if (stats.totalFrames < 500 && stats.totalFrames > 0) {
      return {
        analyzable: false,
        reason: `数据帧数不足: ${stats.totalFrames}帧 (需要至少500帧)`,
        stats,
      };
    }
  }

  // 默认通过（基于头部信息分析）
  return { analyzable: true, stats };
}

/**
 * 估算 BBL 文件的统计信息
 * 基于文件大小和采样率估算
 */
function estimateStats(
  buffer: Buffer,
  headerText: string
): {
  duration: number;
  totalFrames: number;
} {
  // 从头部提取采样率（如果有）
  let looptime = 125; // 默认 8kHz = 125us
  const looptimeMatch = headerText.match(/looptime:(\d+)/);
  if (looptimeMatch) {
    looptime = Number.parseInt(looptimeMatch[1], 10);
  }

  // 估算帧数：文件大小 / 平均帧大小（约 50 字节）
  const estimatedFrames = Math.floor(buffer.length / 50);

  // 估算时长：帧数 * 循环时间
  const estimatedDuration = (estimatedFrames * looptime) / 1000000; // 转换为秒

  return {
    duration: estimatedDuration,
    totalFrames: estimatedFrames,
  };
}

/**
 * 解析 BBL 文件（仅头部，不解析帧数据）
 * 这是 Cloudflare Workers 兼容版本
 */
export async function parseBBLFile(
  buffer: Buffer,
  _maxFrames = 10000
): Promise<ParsedBBLData> {
  const headerText = extractBBLHeader(buffer);
  const { firmwareVersion, craftName, pidValues } = parseHeaderInfo(headerText);
  const stats = estimateStats(buffer, headerText);

  return {
    headers: pidValues,
    frames: '', // 不解析帧数据
    stats: {
      totalFrames: stats.totalFrames,
      duration: stats.duration,
      firmwareVersion,
      craftName,
    },
  };
}

/**
 * 将 BBL 文件转换为 AI 可分析的文本格式
 * 只包含头部配置（足够 AI 分析 PID 设置）
 */
export async function convertBBLForAI(
  buffer: Buffer,
  _options: {
    maxFrames?: number;
    includeFrameData?: boolean;
  } = {}
): Promise<string> {
  console.log(`[convertBBLForAI] Buffer size: ${buffer.length}`);

  // 提取头部配置
  const header = extractBBLHeader(buffer);
  console.log(`[convertBBLForAI] Extracted header length: ${header.length}`);
  console.log(`[convertBBLForAI] Header preview: ${header.slice(0, 300)}`);

  const { firmwareVersion, craftName } = parseHeaderInfo(header);
  const stats = estimateStats(buffer, header);

  let result = `=== Blackbox Log Header (Configuration) ===\n${header}\n`;

  result += '\n=== Flight Statistics (Estimated) ===\n';
  result += `Firmware: ${firmwareVersion}\n`;
  result += `Craft Name: ${craftName}\n`;
  result += `Estimated Frames: ${stats.totalFrames}\n`;
  result += `Estimated Duration: ${stats.duration.toFixed(2)} seconds\n`;
  result += `File Size: ${buffer.length} bytes\n`;

  result += '\n=== Note ===\n';
  result += 'Frame data parsing is not available in this environment.\n';
  result +=
    'Analysis is based on header configuration which contains all PID, filter, and rate settings.\n';

  console.log(`[convertBBLForAI] Final result length: ${result.length}`);
  return result;
}
