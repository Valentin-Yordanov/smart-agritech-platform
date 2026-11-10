import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({
    description: 'User inquiry, symptom description, or follow-up question',
    example: 'What copper hydroxide dosage should I use and what is the re-entry interval?',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  content!: string;

  @ApiPropertyOptional({
    description: 'Optional UUID of an existing diagnosis to ground the discussion in vision detection context',
    example: '6b568fd6-5e58-4bc2-8d7d-5a82fa2c10b2',
  })
  @IsOptional()
  @IsUUID('4', { message: 'diagnosisId must be a valid UUIDv4' })
  diagnosisId?: string;
}
