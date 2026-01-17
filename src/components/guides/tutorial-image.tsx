'use client';

import { getMediaUrl } from '@/lib/r2-client';
import Image from 'next/image';
import { useState } from 'react';

interface TutorialImageProps {
  src: string; // R2 路径，如 "fpvtune/guides/blackbox/step1-connect.png"
  alt: string;
  caption?: string;
}

export function TutorialImage({ src, alt, caption }: TutorialImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // 构建完整的 R2 URL
  const imageUrl = getMediaUrl(src);

  if (error) {
    return (
      <div className="my-6 bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
        <p className="text-red-400">图片加载失败</p>
        <p className="text-sm text-gray-500 mt-2">{alt}</p>
      </div>
    );
  }

  return (
    <figure className="my-6">
      <div className="relative rounded-xl overflow-hidden bg-white/5 border border-white/10">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center min-h-[200px]">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <Image
          src={imageUrl}
          alt={alt}
          width={800}
          height={450}
          className="w-full h-auto"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setError(true);
          }}
        />
      </div>
      {caption && (
        <figcaption className="text-sm text-gray-500 mt-2 text-center">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
