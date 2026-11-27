import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Matches, Max, Min } from 'class-validator';
import { UPLOAD_KEY_PATTERN } from '../../../common/security';

export class CreateDiagnosisJobDto {
  @ApiProperty({
    description: 'Storage key returned by POST /storage/upload-url',
    example: 'uploads/scans/6b568fd6-5e58-4bc2-8d7d-5a82fa2c10b2-leaf.jpg',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(UPLOAD_KEY_PATTERN, { message: 'imageKey must be a key issued by the upload-url endpoint.' })
  imageKey: string;

  @ApiPropertyOptional({
    description: 'GPS Latitude of the captured crop specimen (-90.0 to 90.0)',
    example: 42.6977,
    minimum: -90,
    maximum: 90,
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({
    description: 'GPS Longitude of the captured crop specimen (-180.0 to 180.0)',
    example: 23.3219,
    minimum: -180,
    maximum: 180,
  })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
}
