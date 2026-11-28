import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { IMAGE_MIME_TYPES, isProductionEnv } from '../../common/security';
import { MAX_UPLOAD_BYTES, UploadFolder } from './dto/create-upload-url.dto';

export interface PresignedUrlResponse {
  uploadUrl: string;
  fileKey: string;
  // Empty for private chat uploads: they are only reachable through short-lived signed GET URLs
  publicUrl: string;
}

export interface PrivateObject {
  data: Uint8Array;
  contentType: string;
  size: number;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly privateBucketName: string;
  private readonly publicDomain: string;

  constructor(private readonly configService: ConfigService) {
    const accountId = this.configService.get<string>(
      'R2_ACCOUNT_ID',
      'placeholder-account-id',
    );
    const accessKeyId = this.configService.get<string>(
      'R2_ACCESS_KEY_ID',
      'placeholder-access-key',
    );
    const secretAccessKey = this.configService.get<string>(
      'R2_SECRET_ACCESS_KEY',
      'placeholder-secret-key',
    );

    this.bucketName = this.configService.get<string>(
      'R2_BUCKET_NAME',
      'agritech-uploads',
    );
    this.privateBucketName =
      this.configService.get<string>('R2_PRIVATE_BUCKET_NAME') ||
      this.bucketName;
    if (this.privateBucketName === this.bucketName) {
      const log = isProductionEnv()
        ? this.logger.error.bind(this.logger)
        : this.logger.warn.bind(this.logger);
      log(
        'R2_PRIVATE_BUCKET_NAME is not set; chat attachments will share the public bucket.',
      );
    }
    this.publicDomain =
      this.configService.get<string>('R2_PUBLIC_DOMAIN') ||
      this.configService.get<string>('R2_PUBLIC_URL') ||
      'https://pub-placeholder.r2.dev';

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.logger.log(
      `Initialized S3/R2 Storage client for bucket: ${this.bucketName}`,
    );
  }

  /**
   * Generates a pre-signed PUT URL allowing client direct upload to Cloudflare R2 bucket.
   */
  async getPresignedUploadUrl(
    userId: string,
    filename: string,
    mimeType: string,
    folder: UploadFolder,
    size: number,
  ): Promise<PresignedUrlResponse> {
    const isChat = folder === 'chat';
    if (
      !isChat &&
      !(IMAGE_MIME_TYPES as readonly string[]).includes(mimeType)
    ) {
      throw new BadRequestException(
        'Only JPEG, PNG or WEBP images can be uploaded here.',
      );
    }

    // Keep only safe characters (no slashes, so no path traversal) and cap the length
    const sanitizedFilename =
      filename
        .toLowerCase()
        .replace(/[^a-z0-9.-]/g, '_')
        .replace(/\.{2,}/g, '.')
        .slice(-100) || 'file';
    const uniqueId = randomUUID();
    const fileKey = isChat
      ? `uploads/chat/${userId}/${uniqueId}-${sanitizedFilename}`
      : `uploads/${folder}/${uniqueId}-${sanitizedFilename}`;

    const command = new PutObjectCommand({
      Bucket: isChat ? this.privateBucketName : this.bucketName,
      Key: fileKey,
      ContentType: mimeType,
      // Signed into the URL: R2 rejects a body whose length differs
      ContentLength: size,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 300,
    });
    const publicUrl = isChat
      ? ''
      : `${this.publicDomain.replace(/\/+$/, '')}/${fileKey}`;

    this.logger.log(
      `Generated presigned upload URL for key: ${fileKey} (expires in 300s)`,
    );

    return { uploadUrl, fileKey, publicUrl };
  }

  /** Short-lived GET URL for a private chat object; callers must check ownership first. */
  async getPrivateDownloadUrl(key: string, expiresIn = 600): Promise<string> {
    return getSignedUrl(
      this.s3Client,
      new GetObjectCommand({ Bucket: this.privateBucketName, Key: key }),
      { expiresIn },
    );
  }

  /** Reads a private chat object into memory, refusing anything above the upload limit. */
  async getPrivateObject(
    key: string,
    maxBytes = MAX_UPLOAD_BYTES,
  ): Promise<PrivateObject> {
    const res = await this.s3Client.send(
      new GetObjectCommand({ Bucket: this.privateBucketName, Key: key }),
      { abortSignal: AbortSignal.timeout(20_000) },
    );
    if (!res.Body || (res.ContentLength ?? 0) > maxBytes) {
      throw new BadRequestException(
        'Attachment is missing or larger than 10 MB.',
      );
    }
    const data = await res.Body.transformToByteArray();
    if (data.byteLength > maxBytes) {
      throw new BadRequestException('Attachment is larger than 10 MB.');
    }
    return {
      data,
      contentType: res.ContentType || 'application/octet-stream',
      size: data.byteLength,
    };
  }
}
