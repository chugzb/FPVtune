/**
 * BBL (Betaflight Blackbox Log) 文件解析器
 * 纯 JavaScript 实现，提取头部配置和飞行数据样本
 */

/**
 * 从 BBL 文件中提取头部配置（ASCII 部分）
 * 头部包含所有 PID、滤波器、速率等配置信息
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
        // 遇到非头部行，停止解析（帧数据开始）
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
 * 从 BBL 文件中提取头部配置 + 飞行数据样本
 * 包含 I/P/S 帧数据用于 AI 分析
 * @param buffer BBL 文件 buffer
 * @param maxDataLines 最大数据行数（默认 500 行，约 5 秒数据）
 */
export function extractBBLWithData(buffer: Buffer, maxDataLines = 500): string {
  const lines: string[] = [];
  let currentLine = '';
  let dataLineCount = 0;
  let headerEnded = false;

  for (let i = 0; i < buffer.length && dataLineCount < maxDataLines; i++) {
    const byte = buffer[i];

    // 换行符
    if (byte === 0x0a) {
      if (currentLine.length > 0) {
        // 头部行以 'H ' 开头
        if (currentLine.startsWith('H ')) {
          lines.push(currentLine);
        }
        // 数据帧行（I=Intra, P=Predicted, S=Slow, E=Event, G=GPS）
        else if (/^[IPSEG],/.test(currentLine)) {
          headerEnded = true;
          lines.push(currentLine);
          dataLineCount++;
        }
        // 如果头部已结束但遇到非数据行，可能是新的日志段
        else if (headerEnded && currentLine.startsWith('H ')) {
          // 新日志段的头部，跳过
          break;
        }
      }
      currentLine = '';
      continue;
    }

    // 跳过回车符
    if (byte === 0x0d) {
      continue;
    }

    // 只处理可打印 ASCII 字符 (32-126) 和逗号分隔的数字
    if (byte >= 32 && byte <= 126) {
      currentLine += String.fromCharCode(byte);
    }
  }

  // 处理最后一行
  if (currentLine.length > 0) {
    if (currentLine.startsWith('H ') || /^[IPSEG],/.test(currentLine)) {
      lines.push(currentLine);
    }
  }

  return lines.join('\n');
}

/**
 * 判断内容是否为 BBL 二进制格式
 */
export function isBBLFormat(buffer: Buffer): boolean {
  const firstBytes = buffer.slice(0, 100).toString('utf-8');
  return firstBytes.startsWith('H Product:Blackbox');
}
