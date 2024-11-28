import { Book } from "src/books/entities/book.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { BorrowTransaction } from "./borrow-transaction.entity";

@Entity()
export class BorrowTransactionBook {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    () => BorrowTransaction,
    (borrowTransaction) => borrowTransaction.borrowTransactionBooks,
  )
  borrowTransaction: BorrowTransaction;

  @ManyToOne(() => Book, (book) => book.borrowTransactionBooks)
  book: Book;

  @Column({
    type: "timestamptz",
    nullable: true,
    default: null,
  })
  returnedAt: Date | null;
}
