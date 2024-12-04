import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { BorrowTransaction } from "src/borrowing/entities/borrow-transaction.entity";
import { DataSource, Repository } from "typeorm";
import {
  getDateTruncExpression,
  getTickIntervalShortNotation,
  getTimeSpanShortNotation,
} from "./utils/ticks.util";
import { AnalyticsDto } from "./dto/common-analytics.dto";

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  constructor(
    @InjectRepository(BorrowTransaction)
    private readonly borrowTransactionRepository: Repository<BorrowTransaction>,
    private readonly dataSource: DataSource,
  ) {}

  async getBorrowTransactionTraffic(dto: AnalyticsDto) {
    const { tick, timeSpan } = dto;

    const query = this.dataSource
      .createQueryBuilder()
      .select("interval", "interval")
      .addSelect('COUNT("borrowTransaction".id)', "count")
      .from(
        `(SELECT generate_series(
         ${getDateTruncExpression(
           `CURRENT_TIMESTAMP - INTERVAL ${getTimeSpanShortNotation(timeSpan)}`,
           tick,
         )}, 
          ${getDateTruncExpression("CURRENT_TIMESTAMP::timestamp", tick)}, 
          ${getTickIntervalShortNotation(tick)}
        ) AS interval)`,
        "interval_series",
      )
      .leftJoin(
        (subQuery) =>
          subQuery
            .select(
              getDateTruncExpression(`"borrowTransaction"."created_at"`, tick),
              "created_at",
            )
            .addSelect('"borrowTransaction"."id"', "id")
            .from(BorrowTransaction, "borrowTransaction"),
        "borrowTransaction",
        '"borrowTransaction"."created_at" = "interval_series".interval',
      )
      .groupBy("interval_series.interval")
      .orderBy("interval_series.interval", "ASC");

    this.logger.debug("Query: ", query.getQuery());

    return query.getRawMany();
  }
}
