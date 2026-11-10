import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';

export interface PresignedUrlResponse {
  uploadUrl: string;
  fileKey: string;
  publicUrl: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicDomain: string;

  constructor(private readonly configService: ConfigService) {
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID', 'placeholder-account-id');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID', 'placeholder-access-key');
    const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY', 'placeholder-secret-key');

    this.bucketName = this.configService.get<string>('R2_BUCKET_NAME', 'agritech-uploads');
    this.publicDomain = this.configService.get<string>('R2_PUBLIC_DOMAIN', 'https://pub-placeholder.r2.dev');

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.logger.log(`Initialized S3/R2 Storage client for bucket: ${this.bucketName}`);
  }

  /**
   * Generates a pre-signed PUT URL allowing client direct upload to Cloudflare R2 bucket.
   */
  async getPresignedUploadUrl(
    filename: string,
    mimeType: string,
    folder: 'leaves' | 'community',
  ): Promise<PresignedUrlResponse> {
    // Sanitize original filename (remove special chars/spaces)
    const sanitizedFilename = filename.toLowerCase().replace(/[^a-z0-9.-]/g, '_');
    const uniqueId = randomUUID();
    const fileKey = `uploads/${folder}/${uniqueId}-${sanitizedFilename}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
      ContentType: mimeType,
    });

    // Generate signed URL with 300 seconds (5 minutes) expiration
    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 300 });

    const cleanDomain = this.publicDomain.replace(/\/+$/, '');
    const publicUrl = `${cleanDomain}/${fileKey}`;

    this.logger.log(`Generated presigned upload URL for key: ${fileKey} (expires in 300s)`);

    return {
      uploadUrl,
      fileKey,
      publicUrl,
    };
  }
}
