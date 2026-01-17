import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://fpvtune.com';

interface GenerateMetadataParams {
  title: string;
  description: string;
  path?: string;
  canonicalUrl?: string; // 支持直接传入 canonical URL
  locale: string;
  type?: 'website' | 'article';
  images?: string[];
}

/**
 * 生成标准化的页面元数据,包含 canonical URL 和多语言支持
 */
export function generatePageMetadata({
  title,
  description,
  path,
  canonicalUrl: providedCanonicalUrl,
  locale,
  type = 'website',
  images,
}: GenerateMetadataParams): Metadata {
  // 如果提供了 canonicalUrl 则使用它，否则从 path 生成
  let canonicalUrl: string;
  let canonicalPath: string;

  if (providedCanonicalUrl) {
    canonicalUrl = providedCanonicalUrl;
    canonicalPath = providedCanonicalUrl.replace(SITE_URL, '');
  } else if (path) {
    // 移除路径中的语言前缀,获取规范路径
    canonicalPath = path.replace(/^\/(zh|en)/, '');
    canonicalUrl = `${SITE_URL}${canonicalPath}`;
  } else {
    // 如果都没提供，使用默认值
    canonicalPath = '/';
    canonicalUrl = SITE_URL;
  }

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: canonicalPath,
        zh: `/zh${canonicalPath}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'FPVTune',
      locale: locale === 'zh' ? 'zh_CN' : 'en_US',
      type,
      images: images || [`${SITE_URL}/og.png`],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: images || [`${SITE_URL}/og.png`],
    },
  };
}

// 别名导出以保持向后兼容
export const constructMetadata = generatePageMetadata;
