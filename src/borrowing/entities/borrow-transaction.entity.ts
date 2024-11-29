import { User } from "src/users/entities/user.entity";
import {
  Column,
  Entity,
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

  @ManyToOne(() => User, (user) => user.borrowTransactions, {
    onDelete: "RESTRICT",
  })
  user: User;

  @OneToMany(
    () => BorrowTransactionBook,
    (borrowTransactionBook) => borrowTransactionBook.borrowTransaction,
    { cascade: true },
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

  @ManyToOne(() => User, (user) => user.createdBorrowTransactions, {
    onDelete: "SET NULL",
  })
  createdBy: User;
}
