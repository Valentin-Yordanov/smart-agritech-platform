import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'farmer.john@agritech.local',
  })
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  @MaxLength(254, { message: 'Email address is too long.' })
  @IsNotEmpty({ message: 'Email is required.' })
  email: string;

  @ApiProperty({
    description: 'Password: 10-72 characters with uppercase, lowercase, number and special character',
    example: 'SecureCropPass2026!',
    minLength: 10,
  })
  // class-validator runs decorators bottom-up, so the most basic rule is listed last
  @Matches(/[^A-Za-z0-9]/, { message: 'Password must include at least one special character.' })
  @Matches(/\d/, { message: 'Password must include at least one number.' })
  @Matches(/[A-Z]/, { message: 'Password must include at least one uppercase letter.' })
  @Matches(/[a-z]/, { message: 'Password must include at least one lowercase letter.' })
  // bcrypt ignores everything after 72 bytes
  @MaxLength(72, { message: 'Password must be at most 72 characters long.' })
  @MinLength(10, { message: 'Password must be at least 10 characters long.' })
  @IsString({ message: 'Password is required.' })
  password: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Atanasoff',
    minLength: 2,
  })
  @Transform(trim)
  @MaxLength(80, { message: 'Full name must be at most 80 characters long.' })
  @MinLength(2, { message: 'Full name must be at least 2 characters long.' })
  @IsString({ message: 'Full name is required.' })
  fullName: string;
}
