import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SetResetPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Identifier is required' })
  @MinLength(3, { message: 'Identifier is too short' })
  @MaxLength(100, { message: 'Identifier is too long' })
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$|^[a-zA-Z0-9._]+$/, {
    message: 'Must be a valid email or username',
  })
  identifier: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(100, { message: 'Password is too long' })
  @Matches(/[A-Z]/, {
    message: 'Password must contain at least one uppercase letter',
  })
  @Matches(/[0-9]/, {
    message: 'Password must contain at least one number',
  })
  password: string;
}
