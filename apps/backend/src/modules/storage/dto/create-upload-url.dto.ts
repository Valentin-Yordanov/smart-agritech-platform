import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateUploadUrlDto {
  @ApiProperty({
    description: 'Original name of the image file to be uploaded',
    example: 'tomato-early-blight-sample.jpg',
  })
  @IsString()
  @IsNotEmpty()
  filename: string;

  @ApiProperty({
    description: 'MIME type of the target image file',
    example: 'image/jpeg',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^image\/(jpeg|jpg|png|webp)$/i, {
    message: 'Mime type must be an image format: image/jpeg, image/png, or image/webp.',
  })
  mimeType: string;

  @ApiProperty({
    description: 'Storage target namespace folder',
    example: 'leaves',
    enum: ['leaves', 'community'],
  })
  @IsString()
  @IsIn(['leaves', 'community'], {
    message: 'Folder must be either "leaves" (for AI diagnosis) or "community" (for social feed).',
  })
  folder: 'leaves' | 'community';
}
