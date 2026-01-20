import { websiteConfig } from '@/config/website';
import { storageConfig } from './config/storage-config';
import { R2Provider } from './provider/r2';
// S3Provider 使用 AWS SDK，在 Cloudflare Workers 中不兼容
// 如需在 Node.js 环境使用，可动态 import
// import { S3Provider } from './provider/s3';
import type {
  DownloadFileResult,
  StorageConfig,
  StorageProvider,
  UploadFileResult,
} from './types';

const API_STORAGE_UPLOAD = '/api/storage/upload';
const API_STORAGE_PRESIGNED_URL = '/api/storage/presigned-url';
const API_STORAGE_FILE_URL = '/api/storage/file-url';

/**
 * Default storage configuration
 */
export const defaultStorageConfig: StorageConfig = storageConfig;

/**
 * Global storage provider instance
 */
let storageProvider: StorageProvider | null = null;

/**
 * Get the storage provider
 * @returns current storage provider instance
 * @throws Error if provider is not initialized
 */
export const getStorageProvider = (): StorageProvider => {
  if (!storageProvider) {
    return initializeStorageProvider();
  }
  return storageProvider;
};

/**
 * Initialize the storage provider
 * @returns initialized storage provider
 *
 * 优先使用 R2Provider（基于 aws4fetch），兼容 Cloudflare Workers 环境
 * S3Provider 作为后备方案（仅在 Node.js 环境中使用）
 */
export const initializeStorageProvider = (): StorageProvider => {
  if (!storageProvider) {
    const provider = websiteConfig.storage.provider;
    if (provider === 's3' || provider === 'r2') {
      // 优先使用 R2Provider，它使用 aws4fetch，兼容 Cloudflare Workers
      storageProvider = new R2Provider();
      console.log('[Storage] Using R2Provider (aws4fetch)');
    } else {
      throw new Error(`Unsupported storage provider: ${provider}`);
    }
  }
  return storageProvider;
};

/**
 * Uploads a file to the configured storage provider
 *
 * @param file - The file to upload (Buffer or Blob)
 * @param filename - Original filename with extension
 * @param contentType - MIME type of the file
 * @param folder - Optional folder path to store the file in
 * @returns Promise with the URL of the uploaded file and its storage key
 */
export const uploadFile = async (
  file: Buffer | Blob,
  filename: string,
  contentType: string,
  folder?: string
): Promise<UploadFileResult> => {
  const provider = getStorageProvider();
  return provider.uploadFile({ file, filename, contentType, folder });
};

/**
 * Deletes a file from the storage provider
 *
 * @param key - The storage key of the file to delete
 * @returns Promise that resolves when the file is deleted
 */
export const deleteFile = async (key: string): Promise<void> => {
  const provider = getStorageProvider();
  return provider.deleteFile(key);
};

/**
 * Downloads a file from the storage provider
 *
 * @param key - The storage key of the file to download
 * @returns Promise with the file content as Buffer
 */
export const downloadFile = async (
  key: string
): Promise<DownloadFileResult> => {
  const provider = getStorageProvider();
  return provider.downloadFile(key);
};

/**
 * Extracts the storage key from a public URL or signed URL
 *
 * @param url - The public URL or signed URL of the file
 * @returns The storage key
 */
export const extractKeyFromUrl = (url: string): string | null => {
  if (!url) return null;

  // Known R2 public URL patterns
  const knownPublicUrls = [
    process.env.STORAGE_PUBLIC_URL,
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL,
    'https://pub-a43dfa5ee4c84353a038f71491cecbd9.r2.dev', // Hardcoded fallback
  ].filter(Boolean);

  // Check if URL matches any known public URL pattern
  for (const publicUrl of knownPublicUrls) {
    if (publicUrl && url.startsWith(publicUrl)) {
      const baseUrl = publicUrl.endsWith('/') ? publicUrl : `${publicUrl}/`;
      const key = url.replace(baseUrl, '');
      console.log(`extractKeyFromUrl: matched public URL pattern, key=${key}`);
      return key || null;
    }
  }

  // Try to extract from URL path (handles signed URLs and other formats)
  try {
    const urlObj = new URL(url);
    // Remove leading slash from pathname
    let key = urlObj.pathname.slice(1);

    // For R2 signed URLs, the path might include bucket name
    // Format: /bucket-name/key or just /key
    const bucketName = process.env.STORAGE_BUCKET_NAME || 'promptimage';
    if (bucketName && key.startsWith(`${bucketName}/`)) {
      key = key.slice(bucketName.length + 1);
    }

    console.log(`extractKeyFromUrl: extracted from pathname, key=${key}`);
    return key || null;
  } catch (error) {
    console.error(`extractKeyFromUrl: failed to parse URL ${url}`, error);
    return null;
  }
};

/**
 * Generates a pre-signed URL for direct browser uploads
 *
 * @param filename - Filename with extension
 * @param contentType - MIME type of the file
 * @param folder - Optional folder path to store the file in
 * @param expiresIn - Expiration time in seconds (default: 3600)
 * @returns Promise with the pre-signed URL and the storage key
 */
export const getPresignedUploadUrl = async (
  filename: string,
  contentType: string,
  folder?: string,
  expiresIn = 3600
): Promise<UploadFileResult> => {
  const provider = getStorageProvider();
  return provider.getPresignedUploadUrl({
    filename,
    contentType,
    folder,
    expiresIn,
  });
};

/**
 * Uploads a file from the browser to the storage provider
 * This function is meant to be used in client components
 *
 * @param file - The file object from an input element
 * @param folder - Optional folder path to store the file in
 * @returns Promise with the URL of the uploaded file
 */
export const uploadFileFromBrowser = async (
  file: File,
  folder?: string
): Promise<UploadFileResult> => {
  try {
    // For small files (< 10MB), use direct upload
    if (file.size < 10 * 1024 * 1024) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder || '');

      const response = await fetch(API_STORAGE_UPLOAD, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload file');
      }

      return await response.json();
    }
    // For larger files, use pre-signed URL

    // First, get a pre-signed URL
    const presignedUrlResponse = await fetch(API_STORAGE_PRESIGNED_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        folder: folder || '',
      }),
    });

    if (!presignedUrlResponse.ok) {
      const error = await presignedUrlResponse.json();
      throw new Error(error.message || 'Failed to get pre-signed URL');
    }

    const { url, key } = await presignedUrlResponse.json();

    // Then upload directly to the storage provider
    const uploadResponse = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload file using pre-signed URL');
    }

    // Get the public URL
    const fileUrlResponse = await fetch(API_STORAGE_FILE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key }),
    });

    if (!fileUrlResponse.ok) {
      const error = await fileUrlResponse.json();
      throw new Error(error.message || 'Failed to get file URL');
    }

    return await fileUrlResponse.json();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unknown error occurred during file upload';
    throw new Error(message);
  }
};
