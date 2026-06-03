import { IsDateString, IsOptional, IsString } from 'class-validator';

export class SupervisorQueryDto {
  @IsString()
  @IsOptional()
  user?: string;

  @IsDateString()
  date: string;
}
