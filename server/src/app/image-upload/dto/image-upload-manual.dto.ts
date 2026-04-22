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
} from 'class-validator';
import { Type } from 'class-transformer';

@ValidatorConstraint({ name: 'isSlotAvailable', async: false })
export class IsSlotAvailableConstraint implements ValidatorConstraintInterface {
  validate(slotId: number, args: ValidationArguments) {
    const object = args.object as UploadImageManualDto;
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

  @Type(() => Number)
  @IsInt()
  currentTime: number;

  @IsArray()
  @IsOptional()
  @ArrayMinSize(8, { message: 'Minimal harus mengunggah 8 gambar per jam.' })
  images?: any[];
}
