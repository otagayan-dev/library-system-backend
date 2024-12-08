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
import { BorrowTransactionBook } from "src/borrowing/entities/borrow-transaction-book.entity";
import { GetPopularBooksDto } from "./dto/get-popular-books.dto";
import { Book } from "src/books/entities/book.entity";
import {
  getTimePeriodGenerateSeriesQuery,
  getTimePeriodStartDateQuery,
  TimePeriodTickToTruncMap,
} from "./utils/time-period.util";
import { GetTopActiveUsersDto } from "./dto/get-top-active-users.dto";
import { User } from "src/users/entities/user.entity";

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  constructor(
    @InjectRepository(BorrowTransactionBook)
    private readonly borrowTransactionBookRepository: Repository<BorrowTransactionBook>,
    private readonly dataSource: DataSource,
  ) {}

  async getPopularBooks(dto: GetPopularBooksDto) {
    const { top, timePeriod } = dto;

    //Get popular books first
    const query = this.borrowTransactionBookRepository
      .createQueryBuilder("borrowTransactionBook")
      .select("book.id", "id")
      .addSelect("book.title", "title")
      .addSelect("book.cover_image_url", "coverImageUrl")
      .addSelect("CAST(COUNT(book.id) AS INT)", "borrowCount")
      .leftJoin("borrowTransactionBook.book", "book")
      .leftJoin("borrowTransactionBook.borrowTransaction", "borrowTransaction")
      .where(
        `borrowTransaction.createdAt BETWEEN ${getTimePeriodStartDateQuery(
          timePeriod,
        )} AND CURRENT_TIMESTAMP`,
      )
      .groupBy("book.id")
      .addGroupBy("book.title")
      .addGroupBy("book.cover_image_url")
      .orderBy('"borrowCount"', "DESC")
      .limit(top);

    const popularBooks = await query.getRawMany<Book>();

    const analyticsQuery = this.dataSource
      .createQueryBuilder()
      .select("interval", "interval");
    for (const book of popularBooks) {
      analyticsQuery.addSelect(
        `CAST(COUNT (*) FILTER (WHERE book_id = ${book.id}) AS INT) AS "${book.id}"`,
      );
    }

    analyticsQuery
      .from(
        `(SELECT ${getTimePeriodGenerateSeriesQuery(timePeriod)} AS interval)`,
        "intervalSeries",
      )
      .leftJoin(
        (subQuery) =>
          subQuery
            .select("book_id", "book_id")
            .addSelect(
              `DATE_TRUNC(${TimePeriodTickToTruncMap[timePeriod]}, created_at)`,
              "created_at",
            )
            .from(BorrowTransactionBook, "borrowTransactionBook")
            .innerJoin(
              BorrowTransaction,
              "borrowTransaction",
              '"borrowTransaction"."id" = "borrowTransactionBook"."borrow_transaction_id"',
            )
            .where(
              `created_at BETWEEN ${getTimePeriodStartDateQuery(
                timePeriod,
              )} AND CURRENT_TIMESTAMP`,
            ),
        "transactions",
        '"transactions"."created_at"="intervalSeries"."interval"',
      )
      .groupBy("interval")
      .orderBy("interval", "ASC");

    const analytics = await analyticsQuery.getRawMany();

    return {
      popularBooks,
      analytics,
    };
  }

  async getBorrowTransactionTraffic(dto: AnalyticsDto) {
    const { tick, timeSpan } = dto;

    const query = this.dataSource
      .createQueryBuilder()
      .select("interval", "interval")
      .addSelect('CAST(COUNT("borrowTransaction".id) AS INT)', "count")
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

    return query.getRawMany();
  }

  async getTopActiveUsers(dto: GetTopActiveUsersDto) {
    const { top, timePeriod } = dto;

    /**
     * Get top active users
     * Users with most borrowTransactions in a given timePeriod
     */
    const query = this.dataSource
      .createQueryBuilder()
      .select('"user".id', "id")
      .addSelect('"user".id_number', "idNumber")
      .addSelect('"user".first_name', "firstName")
      .addSelect('"user".last_name', "lastName")
      .addSelect('"user".role', "role")
      .addSelect("CAST(COUNT(user.id) AS INT)", "transactionCount")
      .from(BorrowTransaction, "borrowTransaction")
      .leftJoin(User, "user", '"borrowTransaction".user_id = "user".id')
      .where(
        `"borrowTransaction".created_at BETWEEN ${getTimePeriodStartDateQuery(
          timePeriod,
        )} AND CURRENT_TIMESTAMP`,
      )
      .groupBy('"user".id')
      .orderBy('"transactionCount"', "DESC")
      .limit(top);

    const topActiveUsers = await query.getRawMany<
      User & {
        transactionCount: string;
      }
    >();

    const analyticsQuery = this.dataSource
      .createQueryBuilder()
      .select("interval", "interval");

    for (const user of topActiveUsers) {
      analyticsQuery.addSelect(
        `CAST(COUNT(*) FILTER (WHERE "userTransaction".user_id = '${user.id}' ) as INT)`,
        user.id,
      );
    }

    analyticsQuery
      .from(
        `(SELECT ${getTimePeriodGenerateSeriesQuery(timePeriod)}  as interval)`,
        "intervalSeries",
      )
      .leftJoin(
        (query) => {
          const subQuery = query
            .select(
              `DATE_TRUNC(${TimePeriodTickToTruncMap[timePeriod]}, "borrowTransaction".created_at)`,
              "created_at",
            )
            .addSelect('"user".id', "user_id")
            .from(BorrowTransaction, "borrowTransaction")
            .leftJoin(User, "user", '"user".id = "borrowTransaction".user_id')
            .where(
              `"borrowTransaction".created_at BETWEEN ${getTimePeriodStartDateQuery(
                timePeriod,
              )} AND CURRENT_TIMESTAMP`,
            );

          if (topActiveUsers.length !== 0) {
            subQuery.andWhere("user_id IN (:...userIds)", {
              userIds: topActiveUsers.map(({ id }) => id),
            });
          }

          return subQuery;
        },
        "userTransaction",
        '"userTransaction".created_at = "intervalSeries".interval',
      )
      .groupBy("interval")
      .orderBy("interval", "ASC");

    const analytics = await analyticsQuery.getRawMany();

    return {
      topActiveUsers,
      analytics,
    };
  }
}
