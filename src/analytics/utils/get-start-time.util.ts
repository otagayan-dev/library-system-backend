import { Dayjs } from "dayjs";
import { TimeSpan } from "../types/timespan.type";

export function getStartTime(endTime: Dayjs, timeSpan: TimeSpan): Dayjs {
  switch (timeSpan) {
    case "1hr":
      return endTime.subtract(1, "hour");
    case "3hr":
      return endTime.subtract(3, "hour");
    case "6hr":
      return endTime.subtract(6, "hour");
    case "12hr":
      return endTime.subtract(12, "hour");
    case "24hr":
      return endTime.subtract(24, "hour");
    case "48hr":
      return endTime.subtract(48, "hour");
    case "3days":
      return endTime.subtract(3, "day");
    case "1week":
      return endTime.subtract(1, "week");
    default:
      throw new Error(`Unsupported timespan value: ${timeSpan}`);
  }
}
