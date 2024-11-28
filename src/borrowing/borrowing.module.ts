import { Module } from "@nestjs/common";
import { BorrowingController } from "./borrowing.controller";
import { BorrowingService } from "./borrowing.service";
import { UsersModule } from "src/users/users.module";
import { BooksModule } from "src/books/books.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BorrowTransaction } from "./entities/borrow-transaction.entity";
import { BorrowTransactionBook } from "./entities/borrow-transaction-book.entity";
import { User } from "src/users/entities/user.entity";
import { Book } from "src/books/entities/book.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BorrowTransaction,
      User,
      Book,
      BorrowTransactionBook,
    ]),
    UsersModule,
    BooksModule,
  ],
  controllers: [BorrowingController],
  providers: [BorrowingService],
})
export class BorrowingModule {}
