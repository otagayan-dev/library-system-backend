import { Module } from "@nestjs/common";
import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BorrowTransaction } from "src/borrowing/entities/borrow-transaction.entity";
import { BorrowTransactionBook } from "src/borrowing/entities/borrow-transaction-book.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([BorrowTransaction, BorrowTransactionBook]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
