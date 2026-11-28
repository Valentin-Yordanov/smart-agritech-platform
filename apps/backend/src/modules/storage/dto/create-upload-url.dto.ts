import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { CHAT_MIME_TYPES } from '../../../common/security';

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export type UploadFolder = 'scans' | 'leaves' | 'community' | 'chat';

export class CreateUploadUrlDto {
  @ApiProperty({
    description: 'Original name of the file to be uploaded',
    example: 'tomato-early-blight-sample.jpg',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  filename: string;

  @ApiProperty({
    description:
      'MIME type; documents (PDF, TXT, CSV, DOCX) are only accepted for the chat folder',
    example: 'image/jpeg',
  })
  @IsString()
  @IsIn(CHAT_MIME_TYPES, {
    message:
      'Unsupported file type. Allowed: JPEG, PNG, WEBP, PDF, TXT, CSV, DOCX.',
  })
  mimeType: string;

  @ApiProperty({
    description:
      'Storage target namespace folder; "chat" goes to the private bucket',
    example: 'scans',
    enum: ['scans', 'leaves', 'community', 'chat'],
  })
  @IsString()
  @IsIn(['scans', 'leaves', 'community', 'chat'], {
    message:
      'Folder must be "scans", "leaves" (legacy), "community" or "chat".',
  })
  folder: UploadFolder;

  @ApiProperty({
    description:
      'Exact file size in bytes (max 10 MB); it is signed into the URL so larger uploads are rejected by R2',
    example: 482133,
  })
  @IsInt()
  @Min(1)
  @Max(MAX_UPLOAD_BYTES, { message: 'File must be 10 MB or smaller.' })
  size: number;
}
