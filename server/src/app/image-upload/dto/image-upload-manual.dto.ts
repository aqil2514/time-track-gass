import {
  IsInt,
  Min,
  Max,
  IsArray,
  ArrayMinSize,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { toZonedTime } from 'date-fns-tz';
import { TIMEZONE } from 'src/constants/timezone';
import { format } from 'date-fns/format';

@ValidatorConstraint({ name: 'isSlotAvailable', async: false })
export class IsSlotAvailableConstraint implements ValidatorConstraintInterface {
  validate(slotId: number, args: ValidationArguments) {
    const object = args.object as UploadImageManualDto;

    const uploadDate = toZonedTime(new Date(object.date), TIMEZONE);
    const today = toZonedTime(new Date(), TIMEZONE);

    const uploadDateString = format(uploadDate, 'yyyy-MM-dd');
    const todayString = format(today, 'yyyy-MM-dd');

    // Kalau tanggalnya sudah lampau, semua slot valid
    if (uploadDateString < todayString) return true;

    // Kalau hari ini, cek slotId < currentTime
    return slotId < object.currentTime;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Slot ini belum tersedia untuk diunggah.';
  }
}

export class UploadImageManualDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(23)
  @Validate(IsSlotAvailableConstraint)
  slotId: number;

  @IsString()
  os: string;

  @IsDateString()
  date: string;

  @Type(() => Number)
  @IsInt()
  currentTime: number;

  @IsArray()
  @IsOptional()
  @ArrayMinSize(8, { message: 'Minimal harus mengunggah 8 gambar per jam.' })
  images?: any[];
}
