import { type NextRequest, NextResponse } from 'next/server';

// 最简单的测试 API - 只测试 fetch 是否工作
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 读取文件
    const arrayBuffer = await file.arrayBuffer();

    // 测试 fetch 是否工作
    const testResponse = await fetch('https://httpbin.org/post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: arrayBuffer,
    });

    const testResult = await testResponse.json();

    return NextResponse.json({
      success: true,
      fileSize: arrayBuffer.byteLength,
      fetchWorked: testResponse.ok,
      httpbinResponse: {
        status: testResponse.status,
        dataLength: testResult.data?.length || 0,
      },
    });
  } catch (error) {
    console.error('[Test Fetch] Error:', error);
    return NextResponse.json(
      {
        error: 'Test failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST to test' });
}
