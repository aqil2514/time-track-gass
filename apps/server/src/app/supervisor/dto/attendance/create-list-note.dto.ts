import { IsString, MinLength, IsInt, Min } from 'class-validator';

export class CreateListNoteDto {
  @IsString()
  @MinLength(3, { message: 'Nama kategori minimal 3 karakter' })
  name: string;

  @IsInt()
  @Min(0)
  added_minutes: number;

  @IsString()
  @MinLength(5, { message: 'Deskripsi minimal 5 karakter' })
  notes: string;
}