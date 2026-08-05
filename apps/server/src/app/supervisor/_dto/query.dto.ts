import { IsNumberString, IsOptional, IsString } from 'class-validator';
import { DateFilterDto } from 'src/shared/dto/date-filter.dto';

export class SupervisorQueryDto extends DateFilterDto {
  @IsString()
  @IsOptional()
  user?: string;

  @IsNumberString()
  @IsOptional()
  page?: string;

  @IsNumberString()
  @IsOptional()
  limit?: string;
}
