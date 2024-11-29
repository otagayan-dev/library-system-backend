import { Book } from "src/books/entities/book.entity";
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { BorrowTransaction } from "./borrow-transaction.entity";
import { User } from "src/users/entities/user.entity";
import { BorrowTransactionBookStatus } from "../enums/borrow-transaction-status.enum";
import { Penalty } from "src/penalties/entities/penalty.entity";

@Entity()
export class BorrowTransactionBook {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    () => BorrowTransaction,
    (borrowTransaction) => borrowTransaction.borrowTransactionBooks,
    {
      onDelete: "CASCADE",
    },
  )
  borrowTransaction: BorrowTransaction;

  @ManyToOne(() => Book, (book) => book.borrowTransactionBooks, {
    onDelete: "RESTRICT",
  })
  book: Book;

  @Column({
    type: "timestamptz",
    nullable: true,
    default: null,
  })
  updatedAt: Date | null;

  @Column({
    type: "enum",
    enum: BorrowTransactionBookStatus,
    default: BorrowTransactionBookStatus.Borrowed,
  })
  status: BorrowTransactionBookStatus;

  @ManyToOne(() => User, (user) => user.updatedBorrowTransactionBooks, {
    onDelete: "SET NULL",
  })
  updatedBy: User;

  @OneToOne(() => Penalty, (penalty) => penalty.borrowTransactionBook)
  penalty: Penalty;
}
