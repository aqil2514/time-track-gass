import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Identifier is required' })
  @MinLength(3, { message: 'Identifier is too short' })
  @MaxLength(100, { message: 'Identifier is too long' })
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$|^[a-zA-Z0-9._]+$/, {
    message: 'Must be a valid email or username',
  })
  identifier: string;
}
