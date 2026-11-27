import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    description: 'Comment text or advice from fellow producer / agronomist',
    example: 'Ensure you isolate affected plants and verify copper spray pre-harvest intervals.',
    minLength: 2,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(2000)
  content!: string;
}
