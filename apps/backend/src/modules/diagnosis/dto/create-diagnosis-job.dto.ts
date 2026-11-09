import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateDiagnosisJobDto {
  @ApiProperty({
    description: 'Storage key, relative path, or URL for the leaf/canopy image to analyze',
    example: 'uploads/plants/tomato-early-blight-sample.jpg',
  })
  @IsString()
  @IsNotEmpty()
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

  @ApiPropertyOptional({
    description: 'Optional ID of the user requesting the diagnosis. Defaults to demo/system user if omitted.',
    example: 'd3b07384-d113-46c4-b81b-5e92be9c3b87',
  })
  @IsOptional()
  @IsString()
  userId?: string;
}
