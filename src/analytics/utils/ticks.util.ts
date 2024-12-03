import { Tick } from "../types/ticks.type";
import { TimeSpan } from "../types/timespan.type";

export function getDateTruncExpression(field: string, tick: Tick): string {
  switch (tick) {
    case "1min":
      return `DATE_TRUNC('minute', ${field})`;
    case "5min":
      return `DATE_TRUNC('hour', ${field}) + 
                FLOOR(EXTRACT(minute FROM ${field}) / 5) * INTERVAL '5 minutes'`;
    case "10min":
      return `DATE_TRUNC('hour', ${field}) + 
                FLOOR(EXTRACT(minute FROM ${field}) / 10) * INTERVAL '10 minutes'`;
    case "30min":
      return `DATE_TRUNC('hour', ${field}) + 
                FLOOR(EXTRACT(minute FROM ${field}) / 30) * INTERVAL '30 minutes'`;
    case "1hr":
      return `DATE_TRUNC('hour', ${field})`;
    case "6hrs":
      return `DATE_TRUNC('day', ${field}) + 
                FLOOR(EXTRACT(hour FROM ${field}) / 6) * INTERVAL '6 hours'`;
    case "1day":
      return `DATE_TRUNC('day', ${field})`;
    default:
      throw new Error(`Unsupported tick value: ${tick}`);
  }
}

const TickIntervalShortNotationMap: Record<Tick, string> = {
  "1min": "'P0DT1M'",
  "5min": "'P0DT5M'",
  "10min": "'P0DT10M'",
  "30min": "'P0DT30M'",
  "1hr": "'P0DT1H'",
  "6hrs": "'P0DT6H'",
  "1day": "'P1D'",
};

export function getTickIntervalShortNotation(tick: Tick): string {
  return TickIntervalShortNotationMap[tick];
}

const TimespanShortNotationMap: Record<TimeSpan, string> = {
  "1hr": "'P0DT1H'",
  "3hr": "'P0DT3H'",
  "6hr": "'P0DT6H'",
  "12hr": "'P0DT12H'",
  "24hr": "'P1D'",
  "48hr": "'P2D'",
  "3days": "'P3D'",
  "1week": "'P1W'",
  "2weeks": "'P2W'",
  "1month": "'P1M'",
};

export function getTimeSpanShortNotation(timeSpan: TimeSpan): string {
  return TimespanShortNotationMap[timeSpan];
}
