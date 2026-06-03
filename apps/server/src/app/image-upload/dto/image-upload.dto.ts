import { IsString, IsNotEmpty, Matches, MaxLength } from 'class-validator';

export class ImageUploadDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5_000_000)
  @Matches(/^data:image\/(webp|png|jpeg);base64,/)
  image: string;
}
