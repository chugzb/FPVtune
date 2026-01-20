import { uploadFile } from '@/storage';
import { StorageError } from '@/storage/types';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // R2Provider 不支持 presigned URL，返回错误提示使用直接上传
  return NextResponse.json(
    {
      error:
        'Presigned URLs are not supported. Please use direct upload instead.',
    },
    { status: 501 }
  );
}
