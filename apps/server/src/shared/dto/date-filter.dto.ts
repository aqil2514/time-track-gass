import { IsDateString, IsOptional } from 'class-validator';

export class DateFilterDto {
  @IsDateString()
  @IsOptional()
  date?: string;

  @IsDateString()
  @IsOptional()
  from?: string;

  @IsDateString()
  @IsOptional()
  to?: string;
}
