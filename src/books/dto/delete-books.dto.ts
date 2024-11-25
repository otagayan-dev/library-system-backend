import { ArrayNotEmpty, IsArray, IsNumber } from "class-validator";
import { Book } from "../entities/book.entity";

export class DeleteBooksDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  bookIds: Array<Book["id"]>;
}
