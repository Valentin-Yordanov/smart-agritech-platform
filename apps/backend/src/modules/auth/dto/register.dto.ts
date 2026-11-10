import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'farmer.john@agritech.local',
  })
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Password with minimum 8 characters',
    example: 'SecureCropPass2026!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  password: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Atanasoff',
    minLength: 2,
  })
  @IsString()
  @MinLength(2, { message: 'Full name must be at least 2 characters long.' })
  fullName: string;
}
