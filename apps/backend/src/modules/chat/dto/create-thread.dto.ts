import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateThreadDto {
  @ApiProperty({
    description: 'Title or topic of the agronomic advisory conversation',
    example: 'Tomato Early Blight Organic Treatment Strategy',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  title!: string;
}
