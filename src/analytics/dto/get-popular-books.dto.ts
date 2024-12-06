import { Transform } from "class-transformer";
import { IsIn, IsNumber, IsOptional } from "class-validator";
import { TimePeriod } from "../types/time-period.type";
import { TIME_PERIOD } from "../constants";

export class GetPopularBooksDto {
  @Transform(({ value }) => (typeof value === "string" ? +value : undefined))
  @IsOptional()
  @IsNumber()
  top: number = 10;

  //   @Transform(({ value }) =>
  //     typeof value !== undefined ? dayjs(value).toDate() : undefined,
  //   )
  //   @IsDate()
  //   startTime: Date;

  //   @Transform(({ value }) =>
  //     typeof value !== undefined ? dayjs(value).toDate() : undefined,
  //   )
  //   @IsOptional()
  //   @IsDate()
  //   endTime: Date = dayjs().toDate();

  @IsIn(TIME_PERIOD)
  timePeriod: TimePeriod;
}
