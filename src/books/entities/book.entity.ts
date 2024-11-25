import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { BookGenre } from "../enums/book-genre.enum";
import { BookFormat } from "../enums/book-format.enum";
import { User } from "src/users/entities/user.entity";
import { TimestampedEntity } from "src/common/entities/TimestampedEntity";

@Entity()
export class Book extends TimestampedEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: "text",
  })
  title: string;

  @Column({
    type: "varchar",
    length: 255,
  })
  author: string;

  @Column({
    type: "text",
    default: "",
  })
  description: string;

  @Column({
    type: "enum",
    enum: BookGenre,
    enumName: "BookGenre",
    array: true,
  })
  genres: BookGenre[];

  @Column({
    type: "enum",
    enum: BookFormat,
    enumName: "BookFormat",
  })
  format: BookFormat;

  @Column({
    type: "varchar",
    length: 150,
  })
  publisher: string;

  @Column({
    type: "date",
    nullable: true,
  })
  publishedDate: Date | null;

  @Column({
    type: "varchar",
    length: 100,
    nullable: true,
  })
  edition: string | null;

  @Column({
    type: "int",
  })
  pages: number;

  @Column({
    type: "text",
    nullable: true,
    default: null,
  })
  coverImageUrl: string | null;

  @Column({ type: "int", nullable: true, default: null })
  price: number | null;

  @Column({ type: "int" })
  stock: number;

  @ManyToOne(() => User, { nullable: false })
  createdBy: User;
}
