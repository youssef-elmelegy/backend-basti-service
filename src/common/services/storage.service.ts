import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { env } from '@/env';

/**
 * Result returned by uploadFile / uploadMultipleFiles.
 *
 * The field names mirror the legacy CloudinaryUploadResult so existing
 * dashboard / mobile consumers of POST /uploads/image keep working without
 * any frontend changes. `public_id` is the R2 object key (e.g.
 * "basti/chefs/1700000000-foo.jpg"). For R2 there is no http/https split, so
 * `url` and `secure_url` are identical.
 */
export interface StorageUploadResult {
  public_id: string;
  url: string;
  secure_url: string;
  size: number;
  format: string;
  resource_type: string;
}

export interface StorageDeleteResult {
  results: Record<string, string>;
  success: number;
  failed: number;
  skipped: number;
}

export interface StorageListItem {
  key: string;
  url: string;
  size: number;
  lastModified: string;
}

export interface StorageListResult {
  objects: StorageListItem[];
  isTruncated: boolean;
  nextCursor: string | null;
}

const EXTENSION_CONTENT_TYPE: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  pdf: 'application/pdf',
};

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket = env.R2_BUCKET_NAME;
  private readonly publicBase = env.R2_PUBLIC_URL;

  constructor() {
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
      forcePathStyle: false,
    });
    this.logger.debug(`Storage (R2) configured: bucket=${this.bucket}`);
  }

  async uploadFile(
    buffer: Buffer,
    originalFilename: string,
    folder: string = 'basti',
    resourceType: 'image' | 'video' | 'raw' = 'image',
    contentType?: string,
  ): Promise<StorageUploadResult> {
    const key = this.buildKey(folder, originalFilename);
    const mime = this.resolveContentType(originalFilename, contentType);
    const format = this.extractExtension(originalFilename);

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: mime,
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`R2 upload failed for ${originalFilename}: ${message}`);
      throw new Error(`Storage upload failed: ${message}`);
    }

    const url = this.buildPublicUrl(key);
    this.logger.debug(`File uploaded successfully: ${key}`);

    return {
      public_id: key,
      url,
      secure_url: url,
      size: buffer.length,
      format,
      resource_type: resourceType,
    };
  }

  async uploadMultipleFiles(
    files: { buffer: Buffer; originalFilename: string; contentType?: string }[],
    folder: string = 'basti',
    resourceType: 'image' | 'video' | 'raw' = 'image',
  ): Promise<StorageUploadResult[]> {
    this.logger.debug(`Uploading ${files.length} files to folder: ${folder}`);
    return Promise.all(
      files.map((file) =>
        this.uploadFile(file.buffer, file.originalFilename, folder, resourceType, file.contentType),
      ),
    );
  }

  async deleteMultipleFiles(keys: string[]): Promise<StorageDeleteResult> {
    const results: Record<string, string> = {};
    let success = 0;
    let failed = 0;

    if (keys.length === 0) {
      return { results, success, failed, skipped: 0 };
    }

    this.logger.debug(`Deleting ${keys.length} files from R2`);

    for (let i = 0; i < keys.length; i += 1000) {
      const batch = keys.slice(i, i + 1000);
      try {
        const response = await this.client.send(
          new DeleteObjectsCommand({
            Bucket: this.bucket,
            Delete: {
              Objects: batch.map((Key) => ({ Key })),
              Quiet: false,
            },
          }),
        );

        for (const deleted of response.Deleted ?? []) {
          if (deleted.Key) {
            results[deleted.Key] = 'ok';
            success += 1;
          }
        }
        for (const err of response.Errors ?? []) {
          if (err.Key) {
            results[err.Key] = `failed: ${err.Code ?? 'unknown'}`;
            failed += 1;
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`R2 batch delete failed: ${message}`);
        for (const key of batch) {
          results[key] = `failed: ${message}`;
          failed += 1;
        }
      }
    }

    return { results, success, failed, skipped: 0 };
  }

  async deleteFilesByUrls(urls: string[]): Promise<StorageDeleteResult> {
    this.logger.debug(`Resolving keys from ${urls.length} URLs and deleting`);

    const results: Record<string, string> = {};
    const keysToDelete: string[] = [];
    let skipped = 0;

    for (const url of urls) {
      const key = this.extractKeyFromUrl(url);
      if (key === null) {
        results[url] = 'skipped: not an R2 URL';
        skipped += 1;
      } else {
        keysToDelete.push(key);
      }
    }

    const deleteResult = await this.deleteMultipleFiles(keysToDelete);

    return {
      results: { ...results, ...deleteResult.results },
      success: deleteResult.success,
      failed: deleteResult.failed,
      skipped,
    };
  }

  async listFiles(
    prefix: string,
    cursor?: string,
    maxKeys: number = 100,
  ): Promise<StorageListResult> {
    const limit = Math.min(Math.max(maxKeys, 1), 1000);
    const response = await this.client.send(
      new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        MaxKeys: limit,
        ContinuationToken: cursor,
      }),
    );

    const objects: StorageListItem[] = (response.Contents ?? [])
      .filter((obj) => typeof obj.Key === 'string')
      .map((obj) => ({
        key: obj.Key,
        url: this.buildPublicUrl(obj.Key),
        size: obj.Size ?? 0,
        lastModified: obj.LastModified ? obj.LastModified.toISOString() : '',
      }));

    return {
      objects,
      isTruncated: response.IsTruncated ?? false,
      nextCursor: response.NextContinuationToken ?? null,
    };
  }

  private buildKey(folder: string, originalFilename: string): string {
    const cleanFolder = this.sanitizeFolder(folder);
    const ext = this.extractExtension(originalFilename);
    const base = originalFilename.substring(
      0,
      originalFilename.lastIndexOf('.') === -1
        ? originalFilename.length
        : originalFilename.lastIndexOf('.'),
    );
    const sanitized =
      base
        .replace(/[^a-zA-Z0-9-_]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase()
        .slice(0, 60) || 'file';

    const filename = ext ? `${Date.now()}-${sanitized}.${ext}` : `${Date.now()}-${sanitized}`;
    return cleanFolder ? `${cleanFolder}/${filename}` : filename;
  }

  /**
   * Normalizes a caller-supplied folder into a safe object-key prefix.
   *
   * The upload endpoint accepts `folder` from the client, so this strips any
   * attempt to traverse or inject into the key: only `[a-zA-Z0-9-_]` survive
   * per segment, `.`/`..` and empty segments are dropped, and both depth and
   * length are bounded. Falls back to `basti` when nothing usable remains.
   */
  private sanitizeFolder(folder: string): string {
    const segments = folder
      .split('/')
      .map((segment) =>
        segment
          .replace(/[^a-zA-Z0-9-_]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 40),
      )
      .filter((segment) => segment.length > 0 && segment !== '.' && segment !== '..')
      .slice(0, 5);

    return segments.length > 0 ? segments.join('/') : 'basti';
  }

  private buildPublicUrl(key: string): string {
    const safeKey = key.split('/').map(encodeURIComponent).join('/');
    return `${this.publicBase}/${safeKey}`;
  }

  private extractKeyFromUrl(url: string): string | null {
    const prefix = `${this.publicBase}/`;
    if (!url.startsWith(prefix)) {
      return null;
    }
    try {
      return decodeURIComponent(url.slice(prefix.length));
    } catch {
      return url.slice(prefix.length);
    }
  }

  private resolveContentType(filename: string, override?: string): string {
    if (override && override.trim().length > 0) {
      return override;
    }
    const ext = this.extractExtension(filename);
    return EXTENSION_CONTENT_TYPE[ext] ?? 'application/octet-stream';
  }

  private extractExtension(filename: string): string {
    const dot = filename.lastIndexOf('.');
    if (dot === -1 || dot === filename.length - 1) {
      return '';
    }
    return filename.slice(dot + 1).toLowerCase();
  }
}
