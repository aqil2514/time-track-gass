import { IsNumberString, IsOptional } from 'class-validator';

export class PaginationDto {
  @IsNumberString()
  @IsOptional()
  page?: string;

  @IsNumberString()
  @IsOptional()
  limit?: string;
}
