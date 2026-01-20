import { type NextRequest, NextResponse } from 'next/server';

// 辅助函数：ArrayBuffer 转 Base64（兼容 Cloudflare Workers）
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// 辅助函数：ArrayBuffer 转 UTF-8 字符串
function arrayBufferToUtf8(buffer: ArrayBuffer, maxLength = 100): string {
  const bytes = new Uint8Array(buffer).slice(0, maxLength);
  let result = '';
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    // 只处理可打印 ASCII 字符
    if (byte >= 32 && byte <= 126) {
      result += String.fromCharCode(byte);
    } else if (byte === 10) {
      result += '\\n';
    } else if (byte === 13) {
      result += '\\r';
    } else {
      result += `\\x${byte.toString(16).padStart(2, '0')}`;
    }
  }
  return result;
}

// 辅助函数：ArrayBuffer 转 Hex 字符串
function arrayBufferToHex(buffer: ArrayBuffer, maxLength = 50): string {
  const bytes = new Uint8Array(buffer).slice(0, maxLength);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// 测试上传 API - 用于调试文件上传问题
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const blackboxFile = formData.get('blackbox') as File | null;

    if (!blackboxFile) {
      return NextResponse.json(
        { error: 'No blackbox file provided' },
        { status: 400 }
      );
    }

    // 读取文件内容
    const arrayBuffer = await blackboxFile.arrayBuffer();
    const base64Content = arrayBufferToBase64(arrayBuffer);

    // 检查文件头部
    const firstBytesUtf8 = arrayBufferToUtf8(arrayBuffer, 100);
    const firstBytesHex = arrayBufferToHex(arrayBuffer, 50);

    // 检测 BBL 格式
    const bytes = new Uint8Array(arrayBuffer);
    const headerCheck = String.fromCharCode(...bytes.slice(0, 18));
    const isBBL = headerCheck === 'H Product:Blackbox';

    return NextResponse.json({
      success: true,
      debug: {
        fileName: blackboxFile.name,
        fileSize: blackboxFile.size,
        fileType: blackboxFile.type,
        arrayBufferSize: arrayBuffer.byteLength,
        base64Length: base64Content.length,
        firstBytesUtf8: firstBytesUtf8,
        firstBytesHex: firstBytesHex,
        headerCheck: headerCheck,
        isBBLFormat: isBBL,
        base64Preview: base64Content.slice(0, 100),
      },
    });
  } catch (error) {
    console.error('[Test Upload] Error:', error);
    return NextResponse.json(
      {
        error: 'Test upload failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
