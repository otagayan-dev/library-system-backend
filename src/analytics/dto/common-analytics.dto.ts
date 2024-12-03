import { IsIn } from "class-validator";
import { TICK_VALUES, TIMESPAN_VALUES } from "../constants";
import { Tick } from "../types/ticks.type";
import { TimeSpan } from "../types/timespan.type";

export class AnalyticsDto {
  @IsIn(TICK_VALUES)
  tick: Tick;

  @IsIn(TIMESPAN_VALUES)
  timeSpan: TimeSpan;
}
