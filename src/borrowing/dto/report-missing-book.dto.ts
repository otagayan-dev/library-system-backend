import { IsNumber, Min } from "class-validator";

export class ReportMissingBookDto {
  @IsNumber()
  borrowTransactionBookId: number;

  @IsNumber()
  @Min(1)
  amountDue: number;
}
