import { IsOptional, IsString, IsIn, IsInt, Min } from "class-validator";
import { Transform, Type } from "class-transformer";

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = "createdAt"; // Default field to sort by

  @IsOptional()
  @IsString()
  @IsIn(["ASC", "DESC"])
  @Transform(({ value }) => String(value).toUpperCase())
  sortOrder?: "ASC" | "DESC" = "DESC"; // Default sort order

  @IsOptional()
  @IsString()
  search?: string;
}
