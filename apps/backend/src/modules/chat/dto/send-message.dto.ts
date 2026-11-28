import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CHAT_KEY_PATTERN } from '../../../common/security';

export const MAX_CHAT_ATTACHMENTS = 4;
export const MAX_CHAT_IMAGES = 3;

export class ChatAttachmentRefDto {
  @ApiProperty({
    description: 'Key returned by POST /storage/upload-url with folder "chat"',
  })
  @IsString()
  @Matches(CHAT_KEY_PATTERN, {
    message: 'Attachment key must come from the chat upload endpoint.',
  })
  key!: string;

  @ApiProperty({
    description: 'Original file name shown in the chat',
    example: 'soil-report.pdf',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;
}

export class SendMessageDto {
  @ApiPropertyOptional({
    description: 'User inquiry; may be empty when attachments are sent',
    example:
      'What copper hydroxide dosage should I use and what is the re-entry interval?',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Message must be at most 2000 characters long.' })
  content?: string;

  @ApiPropertyOptional({
    description:
      'Optional UUID of an existing diagnosis to ground the discussion in vision detection context',
    example: '6b568fd6-5e58-4bc2-8d7d-5a82fa2c10b2',
  })
  @IsOptional()
  @IsUUID('4', { message: 'diagnosisId must be a valid UUIDv4' })
  diagnosisId?: string;

  @ApiPropertyOptional({
    type: [ChatAttachmentRefDto],
    description: 'Up to 4 files (max 3 images)',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_CHAT_ATTACHMENTS, {
    message: 'At most 4 files can be attached to one message.',
  })
  @ValidateNested({ each: true })
  @Type(() => ChatAttachmentRefDto)
  attachments?: ChatAttachmentRefDto[];

  @ApiPropertyOptional({
    enum: ['en', 'bg'],
    description: 'Answer language for attachment turns',
  })
  @IsOptional()
  @IsIn(['en', 'bg'])
  language?: 'en' | 'bg';
}
