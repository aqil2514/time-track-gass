import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmptyObject,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';

class TrackerSettingDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, { message: 'Minimal 1' })
  allowedMode: string[];

  @IsString()
  @Transform(({ obj, value }) => {
    const allowed = obj.allowedMode;

    if (Array.isArray(allowed) && allowed.length > 0) {
      if (!allowed.includes(value)) {
        return allowed[0];
      }
    }

    return value;
  })
  mode: string;
}

export class UserSettingsDto {
  @IsObject()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => TrackerSettingDto)
  tracker: TrackerSettingDto;
}
