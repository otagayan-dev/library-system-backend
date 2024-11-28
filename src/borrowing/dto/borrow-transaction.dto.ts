import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
} from "class-validator";
import { Book } from "src/books/entities/book.entity";
import { User } from "src/users/entities/user.entity";

export class BorrowTransactionDto {
  @IsString()
  @IsNotEmpty()
  userId: User["id"];

  @IsArray()
  @IsNumber({}, { each: true })
  @ArrayNotEmpty()
  bookIds: Array<Book["id"]>;
}
