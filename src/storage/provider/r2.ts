import { AwsClient } from 'aws4fetch';
import { storageConfig } from '../config/storage-config';
import {
  ConfigurationError,
  type DownloadFileResult,
  type PresignedUploadUrlParams,
  type StorageConfig,
  StorageError,
  type StorageProvider,
  UploadError,
  type UploadFileParams,
  type UploadFileResult,
} from '../types';

/**
 * Cloudflare R2 storage provider using aws4fetch
 *
 * This provider is designed to work in Cloudflare Workers environment
 * where Node.js fs module is not available.
 *
 * Uses aws4fetch for S3-compatible API calls via fetch.
 */
export class R2Provider implements StorageProvider {
  private config: StorageConfig;
  private client: AwsClient | null = null;

  constructor(config: StorageConfig = storageConfig) {
    this.config = config;
  }

  public getProviderName(): string {
    return 'R2';
  }

  private getClient(): AwsClient {
    if (this.client) {
      return this.client;
    }

    const accessKeyId =
      process.env.STORAGE_ACCESS_KEY_ID || this.config.accessKeyId;
    const secretAccessKey =
      process.env.STORAGE_SECRET_ACCESS_KEY || this.config.secretAccessKey;

    if (!accessKeyId || !secretAccessKey) {
      throw new ConfigurationError('Storage credentials are not configured');
    }

    this.client = new AwsClient({
      accessKeyId,
      secretAccessKey,
      service: 's3',
      region: 'auto',
    });

    return this.client;
  }

  private getEndpoint(): string {
    const endpoint = process.env.STORAGE_ENDPOINT || this.config.endpoint;
    if (!endpoint) {
      throw new ConfigurationError('Storage endpoint is not configured');
    }
    return endpoint.replace(/\/$/, '');
  }

  private getBucketName(): string {
    const bucketName =
      process.env.STORAGE_BUCKET_NAME || this.config.bucketName;
    if (!bucketName) {
      throw new ConfigurationError('Storage bucket name is not configured');
    }
    return bucketName;
  }

  private generateUniqueFilename(originalFilename: string): string {
    const extension = originalFilename.split('.').pop() || '';
    const uuid = crypto.randomUUID();
    return `${uuid}${extension ? `.${extension}` : ''}`;
  }

  public async uploadFile(params: UploadFileParams): Promise<UploadFileResult> {
    try {
      const { file, filename, contentType, folder } = params;
      const client = this.getClient();
      const endpoint = this.getEndpoint();
      const bucketName = this.getBucketName();

      const uniqueFilename = this.generateUniqueFilename(filename);
      const key = folder ? `${folder}/${uniqueFilename}` : uniqueFilename;

      // Convert file to ArrayBuffer
      let body: ArrayBuffer;
      if (file instanceof Blob) {
        body = await file.arrayBuffer();
      } else if (Buffer.isBuffer(file)) {
        body = file.buffer.slice(
          file.byteOffset,
          file.byteOffset + file.byteLength
        );
      } else {
        body = file;
      }

      const url = `${endpoint}/${bucketName}/${key}`;

      console.log(`[R2Provider] Uploading to: ${url}`);
      console.log(`[R2Provider] File size: ${body.byteLength} bytes`);

      const response = await client.fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': contentType,
          'Content-Length': body.byteLength.toString(),
        },
        body,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[R2Provider] Upload failed: ${response.status} ${errorText}`
        );
        throw new UploadError(`Upload failed: ${response.status} ${errorText}`);
      }

      console.log(`[R2Provider] Upload successful: ${key}`);

      // Generate the public URL
      const publicUrl = process.env.STORAGE_PUBLIC_URL || this.config.publicUrl;
      let resultUrl: string;

      if (publicUrl) {
        resultUrl = `${publicUrl.replace(/\/$/, '')}/${key}`;
      } else {
        resultUrl = url;
      }

      return { url: resultUrl, key };
    } catch (error) {
      if (error instanceof ConfigurationError || error instanceof UploadError) {
        throw error;
      }
      const message =
        error instanceof Error ? error.message : 'Unknown error during upload';
      console.error('[R2Provider] Upload error:', message);
      throw new UploadError(message);
    }
  }

  public async deleteFile(key: string): Promise<void> {
    try {
      const client = this.getClient();
      const endpoint = this.getEndpoint();
      const bucketName = this.getBucketName();

      const url = `${endpoint}/${bucketName}/${key}`;

      const response = await client.fetch(url, {
        method: 'DELETE',
      });

      if (!response.ok && response.status !== 404) {
        const errorText = await response.text();
        throw new StorageError(
          `Delete failed: ${response.status} ${errorText}`
        );
      }
    } catch (error) {
      if (
        error instanceof ConfigurationError ||
        error instanceof StorageError
      ) {
        throw error;
      }
      const message =
        error instanceof Error ? error.message : 'Unknown error during delete';
      throw new StorageError(message);
    }
  }

  public async downloadFile(key: string): Promise<DownloadFileResult> {
    try {
      const client = this.getClient();
      const endpoint = this.getEndpoint();
      const bucketName = this.getBucketName();

      const url = `${endpoint}/${bucketName}/${key}`;

      console.log(`[R2Provider] Downloading from: ${url}`);

      const response = await client.fetch(url, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[R2Provider] Download failed: ${response.status} ${errorText}`
        );
        throw new StorageError(
          `Download failed: ${response.status} ${errorText}`
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      const content = Buffer.from(arrayBuffer);
      const contentType = response.headers.get('Content-Type') || undefined;

      console.log(
        `[R2Provider] Download successful: ${key}, size: ${content.length} bytes`
      );

      return { content, contentType };
    } catch (error) {
      if (
        error instanceof ConfigurationError ||
        error instanceof StorageError
      ) {
        throw error;
      }
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown error during download';
      console.error('[R2Provider] Download error:', message);
      throw new StorageError(message);
    }
  }

  public async getPresignedUploadUrl(
    params: PresignedUploadUrlParams
  ): Promise<UploadFileResult> {
    // R2 doesn't support presigned URLs in the same way as S3
    // For now, throw an error - use direct upload instead
    throw new StorageError(
      'Presigned URLs are not supported by R2Provider. Use direct upload instead.'
    );
  }
}
