/**
 * Cloudflare R2 客户端工具
 * 用于生成 R2 存储的媒体资源 URL
 */

/**
 * 获取 R2 公共 URL
 * @param path - R2 中的文件路径，如 "guides/blackbox/step1.png"
 * @returns 完整的 R2 公共 URL
 */
export function getMediaUrl(path: string): string {
  const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

  if (!r2PublicUrl) {
    console.warn('NEXT_PUBLIC_R2_PUBLIC_URL is not defined');
    return '';
  }

  // 移除开头的斜杠（如果有）
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  // 确保 R2 URL 不以斜杠结尾
  const baseUrl = r2PublicUrl.endsWith('/')
    ? r2PublicUrl.slice(0, -1)
    : r2PublicUrl;

  return `${baseUrl}/${cleanPath}`;
}

/**
 * 检查 R2 URL 是否有效
 * @param url - 要检查的 URL
 * @returns 是否为有效的 R2 URL
 */
export function isValidR2Url(url: string): boolean {
  const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

  if (!r2PublicUrl) {
    return false;
  }

  return url.startsWith(r2PublicUrl);
}
