import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export class CreateUploadUrlDto {
  @ApiProperty({
    description: 'Original name of the image file to be uploaded',
    example: 'tomato-early-blight-sample.jpg',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  filename: string;

  @ApiProperty({
    description: 'MIME type of the target image file',
    example: 'image/jpeg',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^image\/(jpeg|png|webp)$/, {
    message: 'Mime type must be an image format: image/jpeg, image/png, or image/webp.',
  })
  mimeType: string;

  @ApiProperty({
    description: 'Storage target namespace folder',
    example: 'scans',
    enum: ['scans', 'leaves', 'community'],
  })
  @IsString()
  @IsIn(['scans', 'leaves', 'community'], {
    message: 'Folder must be either "scans", "leaves" (legacy), or "community" (for social feed).',
  })
  folder: 'scans' | 'leaves' | 'community';

  @ApiProperty({
    description: 'Exact file size in bytes (max 10 MB); it is signed into the URL so larger uploads are rejected by R2',
    example: 482133,
  })
  @IsInt()
  @Min(1)
  @Max(MAX_UPLOAD_BYTES, { message: 'Image must be 10 MB or smaller.' })
  size: number;
}
