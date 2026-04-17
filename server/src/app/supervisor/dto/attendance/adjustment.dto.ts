import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
  ArrayMinSize,
  Matches,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AdjustmentItemDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @ValidateIf((o) => o.id === '-1')
  @IsString({ message: 'Nama Penyesuaian wajib diisi jika membuat data baru' })
  @IsNotEmpty({ message: 'Nama Penyesuaian tidak boleh kosong' })
  adjusment_name?: string;

  @IsNumber()
  @Min(0, { message: 'Menit tidak boleh negatif' })
  added_minutes: number;
}

export class CreateAttendanceAdjustmentDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Pilih minimal 1 penyesuaian' })
  @ValidateNested({ each: true })
  @Type(() => AdjustmentItemDto)
  adjustment: AdjustmentItemDto[];

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, { message: 'Pilih minimal satu karyawan' })
  profile_id: string[];

  @IsString()
  @IsNotEmpty({ message: 'Tanggal harus diisi' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Format tanggal harus YYYY-MM-DD',
  })
  date: string;
}

export class UpdateAttendanceAdjustmentDto extends AdjustmentItemDto {
  @IsString()
  @IsNotEmpty({ message: 'Tanggal harus diisi' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Format tanggal harus YYYY-MM-DD',
  })
  date: string;
}
