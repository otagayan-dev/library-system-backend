import { Module } from "@nestjs/common";
import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BorrowTransaction } from "src/borrowing/entities/borrow-transaction.entity";

@Module({
  imports: [TypeOrmModule.forFeature([BorrowTransaction])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
