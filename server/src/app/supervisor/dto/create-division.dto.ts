import { Type } from 'class-transformer';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  IsString,
  IsArray,
  IsNotEmpty,
  IsObject,
  ValidateNested,
  ArrayMinSize,
  Validate,
} from 'class-validator';

@ValidatorConstraint({ name: 'matchCategoriesWithDefinitions', async: false })
export class MatchCategoriesConstraint implements ValidatorConstraintInterface {
  validate(category_definitions: any, args: ValidationArguments) {
    const object = args.object as any;
    const allowed_categories = object.allowed_categories || [];

    if (!category_definitions || typeof category_definitions !== 'object')
      return false;

    const definitionKeys = Object.keys(category_definitions);

    if (allowed_categories.length !== definitionKeys.length) return false;

    return allowed_categories.every(
      (cat: string) => cat in category_definitions,
    );
  }

  defaultMessage(args: ValidationArguments) {
    return 'Setiap kategori yang dipilih wajib memiliki definisi yang sesuai.';
  }
}

export class VisionConfigDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, { message: 'Minimal pilih satu kategori' })
  allowed_categories: string[];

  @IsObject()
  @Validate(MatchCategoriesConstraint)
  category_definitions: Record<string, string>;
}

export class CreateDivisionDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama divisi wajib diisi' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Deskripsi wajib diisi' })
  description: string;

  @IsObject()
  @ValidateNested()
  @Type(() => VisionConfigDto)
  @IsNotEmpty()
  vision_config: VisionConfigDto;
}
