import { type NextRequest, NextResponse } from 'next/server';

// 测试 R2 上传 API - 带详细错误信息
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('[Test R2] File received:', {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('[Test R2] Buffer created:', {
      bufferLength: buffer.length,
    });

    // 动态导入 storage 模块，捕获导入错误
    let uploadFile;
    try {
      const storage = await import('@/storage');
      uploadFile = storage.uploadFile;
      console.log('[Test R2] Storage module imported successfully');
    } catch (importError) {
      console.error('[Test R2] Failed to import storage:', importError);
      return NextResponse.json(
        {
          error: 'Failed to import storage module',
          message:
            importError instanceof Error
              ? importError.message
              : 'Unknown import error',
          stack: importError instanceof Error ? importError.stack : undefined,
        },
        { status: 500 }
      );
    }

    // 上传到 R2
    try {
      const result = await uploadFile(
        buffer,
        `test-${Date.now()}-${file.name}`,
        file.type || 'application/octet-stream',
        'test'
      );

      console.log('[Test R2] Upload result:', result);

      return NextResponse.json({
        success: true,
        url: result.url,
        key: result.key,
      });
    } catch (uploadError) {
      console.error('[Test R2] Upload error:', uploadError);
      return NextResponse.json(
        {
          error: 'Upload failed',
          message:
            uploadError instanceof Error
              ? uploadError.message
              : 'Unknown upload error',
          stack: uploadError instanceof Error ? uploadError.stack : undefined,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Test R2] Error:', error);
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
