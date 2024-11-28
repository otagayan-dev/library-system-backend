import { Book } from "src/books/entities/book.entity";
import { User } from "src/users/entities/user.entity";
import {
  Column,
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { BorrowTransactionBook } from "./borrow-transaction-book.entity";
import { BorrowTransactionStatus } from "../enums/borrow-transaction-status.enum";

@Entity()
export class BorrowTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.borrowTransactions)
  user: User;

  @OneToMany(
    () => BorrowTransactionBook,
    (borrowTransactionBook) => borrowTransactionBook.borrowTransaction,
  )
  borrowTransactionBooks: BorrowTransactionBook[];

  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column({
    type: "enum",
    enum: BorrowTransactionStatus,
    default: BorrowTransactionStatus.Open,
  })
  status: BorrowTransactionStatus;

  @ManyToOne(() => User, (user) => user.createdBorrowTransactions)
  createdBy: User;
}
