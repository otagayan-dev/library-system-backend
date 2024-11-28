import { ArrayNotEmpty, IsArray, IsNumber } from "class-validator";

export class ReturnBooksDto {
  @IsNumber()
  borrowTransactionId: number;

  @IsArray()
  @IsNumber({}, { each: true })
  @ArrayNotEmpty()
  borrowTransactionBookIds: number[];
}
