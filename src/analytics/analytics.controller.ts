import { Controller, Get, Query } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";
import { AnalyticsDto } from "./dto/common-analytics.dto";
import { GetPopularBooksDto } from "./dto/get-popular-books.dto";

@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("borrow-transaction-traffic")
  getBorrowTransactionTraffic(@Query() dto: AnalyticsDto) {
    return this.analyticsService.getBorrowTransactionTraffic(dto);
  }

  @Get("popular-books")
  getPopularBooks(@Query() dto: GetPopularBooksDto) {
    return this.analyticsService.getPopularBooks(dto);
  }
}
