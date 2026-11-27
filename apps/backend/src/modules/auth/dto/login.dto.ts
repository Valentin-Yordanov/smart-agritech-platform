import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'farmer.john@agritech.local',
  })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  @MaxLength(254, { message: 'Email address is too long.' })
  @IsNotEmpty({ message: 'Email is required.' })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecureCropPass2026!',
  })
  @MaxLength(128, { message: 'Password is too long.' })
  @IsNotEmpty({ message: 'Password is required.' })
  @IsString({ message: 'Password is required.' })
  password: string;
}
