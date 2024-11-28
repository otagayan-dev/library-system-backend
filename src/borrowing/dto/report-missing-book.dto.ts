import { IsNumber } from "class-validator";

export class ReportMissingBookDto {
  @IsNumber()
  borrowTransactionBookId: number;
}
