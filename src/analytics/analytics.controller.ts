import { Controller, Get, Query } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";
import { AnalyticsDto } from "./dto/common-analytics.dto";

@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("borrow-transaction-traffic")
  getBorrowTransactionTraffic(@Query() dto: AnalyticsDto) {
    return this.analyticsService.getBorrowTransactionTraffic(dto);
  }
}
