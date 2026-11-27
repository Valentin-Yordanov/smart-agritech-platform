import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl, Matches, MaxLength, MinLength } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({
    description: 'Title of the agronomic post or observation',
    example: 'Managing Early Blight Outbreak in Greenhouse Tomatoes',
    minLength: 5,
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(150)
  title!: string;

  @ApiProperty({
    description: 'Detailed description of the observation, questions, or field experience',
    example: 'Observed target-like concentric rings on lower leaves after heavy humidity...',
    minLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(10000)
  content!: string;

  @ApiPropertyOptional({
    description: 'Optional URL or R2 storage link to an image of the plant / issue',
    example: 'https://pub-placeholder.r2.dev/uploads/leaf-blight-sample.jpg',
  })
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true }, { message: 'imageUrl must be a valid https URL' })
  @MaxLength(500)
  // Only images uploaded through our presigned flow, never arbitrary third-party links
  @Matches(/\/uploads\/community\/[0-9a-f-]{36}-[a-z0-9._-]+$/, {
    message: 'imageUrl must point to an image uploaded through the community upload flow.',
  })
  imageUrl?: string;
}
