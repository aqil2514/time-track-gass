import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsInt, IsOptional, IsNumber, Min, IsIn } from 'class-validator';

export class CreateUserManagementDto {
  @IsString()
  userId: string;

  @IsInt()
  @Min(1, { message: 'Jam mingguan minimal 1 jam' })
  weeklyHour: number;

  @IsInt()
  @Min(1, { message: 'Jam bulanan minimal 1 jam' })
  monthlyHour: number;

  @IsString()
  @IsIn(['fee', 'daily-sync'], { message: 'Tipe penalti tidak valid' })
  penaltyType: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyPenalty?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyBonus?: number;
}

export class UpdateUserManagementDto extends PartialType(CreateUserManagementDto) {}