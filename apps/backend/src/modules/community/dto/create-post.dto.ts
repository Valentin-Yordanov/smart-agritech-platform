import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

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
  content!: string;

  @ApiPropertyOptional({
    description: 'Optional URL or R2 storage link to an image of the plant / issue',
    example: 'https://pub-placeholder.r2.dev/uploads/leaf-blight-sample.jpg',
  })
  @IsOptional()
  @IsUrl({}, { message: 'imageUrl must be a valid URL' })
  imageUrl?: string;
}
