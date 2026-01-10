// src/common/dto/pagination.dto.ts
import { IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type as ClassTransformerType } from 'class-transformer'; // Cambia el import

export class PaginationDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @ClassTransformerType(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @ClassTransformerType(() => Number)
  limit?: number = 10;
}

