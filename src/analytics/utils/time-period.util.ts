import { TimePeriod } from "../types/time-period.type";

export const TimePeriodToDateTruncMap: Record<TimePeriod, string> = {
  daily: "day",
  weekly: "week",
  monthly: "month",
  yearly: "year",
};

export function getTimePeriodStartDateQuery(timePeriod: TimePeriod): string {
  return `DATE_TRUNC('${TimePeriodToDateTruncMap[timePeriod]}', CURRENT_DATE)${
    timePeriod === "weekly" ? " - INTERVAL 'P1D'" : ""
  }`;
}

export const TimePeriodToTickMap: Record<TimePeriod, string> = {
  daily: "'P0DT1H'",
  weekly: "'P1D'",
  monthly: "'P1D'",
  yearly: "'P1M'",
};

export function getTimePeriodGenerateSeriesQuery(
  timePeriod: TimePeriod,
): string {
  const startTime = getTimePeriodStartDateQuery(timePeriod);
  const endTime = "CURRENT_TIMESTAMP";
  const tick = `${TimePeriodToTickMap[timePeriod]}`;
  return `GENERATE_SERIES(${startTime},${endTime},${tick})`;
}

export const TimePeriodTickToTruncMap: Record<TimePeriod, string> = {
  daily: "'hour'",
  weekly: "'day'",
  monthly: "'day'",
  yearly: "'month'",
};
