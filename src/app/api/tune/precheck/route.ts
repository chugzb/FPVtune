import { isBBLFormat } from '@/lib/tune/bbl-parser';
import { type NextRequest, NextResponse } from 'next/server';

const MIN_BBL_FILE_SIZE = 50 * 1024; // 50KB
const MIN_DURATION_S = 30;
const MIN_SAMPLE_RATE_HZ = 200;

const BBL_DECODER_URL =
  process.env.BBL_DECODER_URL || 'https://api.fpvtune.com';

function arrayBufferToBuffer(ab: ArrayBuffer): Buffer {
  return Buffer.from(new Uint8Array(ab));
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const blackboxFile = formData.get('blackbox') as File | null;
    const locale = (formData.get('locale') as string) || 'en';
    const isZh = locale === 'zh';

    if (!blackboxFile) {
      return NextResponse.json(
        {
          error: isZh ? '缺少黑盒文件' : 'Missing blackbox file',
          code: 'MISSING_BBL',
        },
        { status: 400 }
      );
    }

    const blackboxArrayBuffer = await blackboxFile.arrayBuffer();
    const blackboxBuffer = arrayBufferToBuffer(blackboxArrayBuffer);

    if (!isBBLFormat(blackboxBuffer)) {
      return NextResponse.json(
        {
          error: isZh ? '无效的黑盒文件' : 'Invalid blackbox file',
          details: isZh
            ? '文件不是有效的 Betaflight 黑盒日志格式'
            : 'File is not a valid Betaflight blackbox log format',
          code: 'INVALID_BBL_FORMAT',
        },
        { status: 400 }
      );
    }

    if (blackboxBuffer.length < MIN_BBL_FILE_SIZE) {
      return NextResponse.json(
        {
          error: isZh ? '黑盒文件太小' : 'Blackbox file too small',
          details: isZh
            ? `文件大小 ${Math.round(
                blackboxBuffer.length / 1024
              )}KB，需要至少 ${MIN_BBL_FILE_SIZE / 1024}KB 的飞行数据`
            : `File size ${Math.round(
                blackboxBuffer.length / 1024
              )}KB, need at least ${MIN_BBL_FILE_SIZE / 1024}KB of flight data`,
          code: 'FILE_TOO_SMALL',
          minKB: Math.round(MIN_BBL_FILE_SIZE / 1024),
        },
        { status: 400 }
      );
    }

    const fileSizeKB = Math.round(blackboxBuffer.length / 1024);
    let status: 'ok' | 'warn' = 'ok';
    const issues: string[] = [];
    let meta: {
      duration_s?: number;
      sample_rate_hz?: number;
      points?: number;
      segments_found?: number;
      logs_found?: number;
    } | null = null;

    try {
      // 设置超时，BBL 解码可能需要较长时间（大文件 30-60 秒）
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60秒超时

      const response = await fetch(`${BBL_DECODER_URL}/decode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: blackboxBuffer,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `BBL Decoder failed: ${response.status} - ${errorText}`
        );
      }

      const decoded = await response.json();
      meta = decoded?.meta || null;

      if (meta?.duration_s && meta.duration_s < MIN_DURATION_S) {
        issues.push('short_duration');
        status = 'warn';
      }

      if (meta?.sample_rate_hz && meta.sample_rate_hz < MIN_SAMPLE_RATE_HZ) {
        issues.push('low_sample_rate');
        status = 'warn';
      }

      if (meta?.segments_found && meta.segments_found > 1) {
        issues.push('multiple_segments');
        status = 'warn';
      }

      if (meta?.logs_found && meta.logs_found > 1) {
        issues.push('multiple_logs');
        status = 'warn';
      }
    } catch (error) {
      console.error('[Precheck] Decoder failed:', error);
      issues.push('decoder_failed');
      status = 'warn';
    }

    return NextResponse.json({
      status,
      file: {
        sizeKB: fileSizeKB,
      },
      meta,
      issues,
      thresholds: {
        minDurationSec: MIN_DURATION_S,
        minSampleRateHz: MIN_SAMPLE_RATE_HZ,
        minFileSizeKB: Math.round(MIN_BBL_FILE_SIZE / 1024),
      },
    });
  } catch (error) {
    console.error('[Precheck] Error:', error);
    return NextResponse.json(
      {
        error: 'Precheck failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
