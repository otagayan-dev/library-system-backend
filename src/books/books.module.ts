import { Module } from "@nestjs/common";
import { BooksService } from "./books.service";
import { BooksController } from "./books.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Book } from "./entities/book.entity";
import { FileModule } from "src/file/file.module";

@Module({
  imports: [TypeOrmModule.forFeature([Book]), FileModule],
  controllers: [BooksController],
  providers: [BooksService],
  exports: [BooksService],
})
export class BooksModule {}
