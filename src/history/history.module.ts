import { Module } from "@nestjs/common";
import { HistoryService } from "./history.service";
import { HistoryController } from "./history.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BorrowTransaction } from "src/borrowing/entities/borrow-transaction.entity";
import { Penalty } from "src/penalties/entities/penalty.entity";

@Module({
  imports: [TypeOrmModule.forFeature([BorrowTransaction, Penalty])],
  controllers: [HistoryController],
  providers: [HistoryService],
})
export class HistoryModule {}
