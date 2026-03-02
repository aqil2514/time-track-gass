import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Match } from 'src/decorators/match.decorator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  @MinLength(3, { message: 'Full name must be at least 3 characters' })
  @MaxLength(100, { message: 'Full name must be at most 100 characters' })
  fullName: string;

  @IsString()
  @IsNotEmpty({ message: 'Username is required' })
  @MinLength(3, { message: 'Username must be at least 3 characters' })
  @MaxLength(30, { message: 'Username must be at most 30 characters' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  username: string;

  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsEnum(['worker', 'supervisor'])
  @IsOptional()
  role?: 'worker' | 'supervisor';

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/[A-Z]/, {
    message: 'Password must contain at least one uppercase letter',
  })
  @Matches(/[0-9]/, {
    message: 'Password must contain at least one number',
  })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Please confirm your password' })
  @Match('password', { message: 'Passwords do not match' })
  confirmPassword: string;
}
