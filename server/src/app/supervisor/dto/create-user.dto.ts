import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  @MinLength(3)
  @MaxLength(100)
  fullName: string;

  @IsString()
  @IsNotEmpty({ message: 'Username is required' })
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  username: string;

  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsNotEmpty()
  email: string;

  @IsEnum(['worker', 'supervisor'])
  role: 'worker' | 'supervisor';

  @IsString()
  @IsNotEmpty()
  division: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/[A-Z]/, { message: 'Password must contain uppercase' })
  @Matches(/[0-9]/, { message: 'Password must contain number' })
  password: string;
}