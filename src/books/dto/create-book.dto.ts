import { OmitType, PickType } from "@nestjs/mapped-types";
import { Book } from "../entities/book.entity";
import { BookFormat } from "../enums/book-format.enum";
import { BookGenre } from "../enums/book-genre.enum";
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { Transform, Type } from "class-transformer";

export class CreateBookDto
  implements
    Omit<
      Book,
      | "id"
      | "createdAt"
      | "createdBy"
      | "updatedAt"
      | "coverImageUrl"
      | "price"
      | "edition"
    >,
    Partial<Pick<Book, "edition" | "price">>
{
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  author: string;

  @IsString()
  @IsOptional()
  description: string | null;

  @IsArray()
  @IsNotEmpty()
  @IsEnum(BookGenre, { each: true })
  @Transform(({ value }) =>
    typeof value === "string" ? value.split(",") : value,
  )
  genres: BookGenre[];

  @IsEnum(BookFormat)
  format: BookFormat;

  @IsString()
  @MaxLength(150)
  publisher: string;

  @Type(() => Date)
  @IsOptional()
  @IsDate()
  publishedDate: Date | null;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  edition?: string | null;

  @IsNumber()
  @Transform(({ value }) => +value)
  pages: number;

  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? +value : undefined))
  @IsNumber()
  price?: number;

  @IsNumber()
  @Transform(({ value }) => +value)
  stock: number;
}
