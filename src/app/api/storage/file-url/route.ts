import { StorageError } from '@/storage/types';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key } = body;

    if (!key) {
      return NextResponse.json(
        { error: 'File key is required' },
        { status: 400 }
      );
    }

    const publicUrl = process.env.STORAGE_PUBLIC_URL;

    if (!publicUrl) {
      return NextResponse.json(
        { error: 'Storage public URL is not configured' },
        { status: 500 }
      );
    }

    // 使用 public URL 直接构建文件链接
    const url = `${publicUrl.replace(/\/$/, '')}/${key}`;

    return NextResponse.json({ url, key });
  } catch (error) {
    console.error('Error getting file URL:', error);

    if (error instanceof StorageError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: 'Something went wrong while getting the file URL' },
      { status: 500 }
    );
  }
}
