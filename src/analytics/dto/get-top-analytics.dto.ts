import { Transform } from "class-transformer";
import { IsIn, IsNumber, IsOptional } from "class-validator";
import { TimePeriod } from "../types/time-period.type";
import { TIME_PERIOD } from "../constants";

export class GetTopAnalyticsDto {
  @Transform(({ value }) => (typeof value === "string" ? +value : undefined))
  @IsOptional()
  @IsNumber()
  top: number = 10;

  @IsIn(TIME_PERIOD)
  timePeriod: TimePeriod;
}
