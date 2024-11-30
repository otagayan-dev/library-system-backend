import { BorrowTransactionBook } from "src/borrowing/entities/borrow-transaction-book.entity";
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { PenaltyCause } from "../enum/penalty-cause.enum";
import { TimestampedEntity } from "src/common/entities/TimestampedEntity";
import { User } from "src/users/entities/user.entity";

@Entity()
export class Penalty extends TimestampedEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.penalties)
  user: User;

  @JoinColumn()
  @OneToOne(
    () => BorrowTransactionBook,
    (borrowTransactionBook) => borrowTransactionBook.penalty,
  )
  borrowTransactionBook: BorrowTransactionBook;

  @Column({
    type: "int",
  })
  amountDue: number;

  @Column({
    type: "text",
    nullable: true,
  })
  causeOthers: string | null;

  @Column({
    type: "enum",
    enum: PenaltyCause,
  })
  cause: PenaltyCause;

  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column({ type: "timestamptz", nullable: true, default: null })
  resolvedAt: Date | null;

  @ManyToOne(() => User, (user) => user.resolvedPenalties, {
    onDelete: "RESTRICT",
  })
  resolvedBy: User;
}
