import { AwsClient } from 'aws4fetch';
import { type NextRequest, NextResponse } from 'next/server';

// 简单的 R2 上传测试 - 不使用 storage 模块
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('[Test R2 Simple] File received:', {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // 读取环境变量
    const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID;
    const secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY;
    const endpoint = process.env.STORAGE_ENDPOINT;
    const bucketName = process.env.STORAGE_BUCKET_NAME;
    const publicUrl = process.env.STORAGE_PUBLIC_URL;

    console.log('[Test R2 Simple] Config:', {
      hasAccessKeyId: !!accessKeyId,
      hasSecretAccessKey: !!secretAccessKey,
      endpoint,
      bucketName,
      publicUrl,
    });

    if (!accessKeyId || !secretAccessKey || !endpoint || !bucketName) {
      return NextResponse.json(
        { error: 'Storage not configured' },
        { status: 500 }
      );
    }

    // 创建 AWS 客户端
    const client = new AwsClient({
      accessKeyId,
      secretAccessKey,
      service: 's3',
      region: 'auto',
    });

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const key = `test/${Date.now()}-${file.name}`;
    const url = `${endpoint}/${bucketName}/${key}`;

    console.log('[Test R2 Simple] Uploading to:', url);
    console.log('[Test R2 Simple] File size:', arrayBuffer.byteLength);

    // 上传文件
    const response = await client.fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        'Content-Length': arrayBuffer.byteLength.toString(),
      },
      body: arrayBuffer,
    });

    console.log('[Test R2 Simple] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Test R2 Simple] Upload failed:', errorText);
      return NextResponse.json(
        { error: 'Upload failed', status: response.status, details: errorText },
        { status: 500 }
      );
    }

    const resultUrl = publicUrl ? `${publicUrl}/${key}` : url;

    return NextResponse.json({
      success: true,
      url: resultUrl,
      key,
    });
  } catch (error) {
    console.error('[Test R2 Simple] Error:', error);
    return NextResponse.json(
      {
        error: 'R2 upload failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to upload a file',
    config: {
      hasAccessKeyId: !!process.env.STORAGE_ACCESS_KEY_ID,
      hasSecretAccessKey: !!process.env.STORAGE_SECRET_ACCESS_KEY,
      endpoint: process.env.STORAGE_ENDPOINT,
      bucketName: process.env.STORAGE_BUCKET_NAME,
      publicUrl: process.env.STORAGE_PUBLIC_URL,
    },
  });
}
