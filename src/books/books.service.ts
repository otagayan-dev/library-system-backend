import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { CreateBookDto } from "./dto/create-book.dto";
import { UpdateBookDto } from "./dto/update-book.dto";
import {
  FindOptionsWhere,
  ILike,
  In,
  IsNull,
  Like,
  Not,
  QueryFailedError,
  Repository,
} from "typeorm";
import { Book } from "./entities/book.entity";
import { User } from "src/users/entities/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { DeleteBooksDto } from "./dto/delete-books.dto";
import { FileService } from "src/file/file.service";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { BorrowTransactionBookStatus } from "src/borrowing/enums/borrow-transaction-status.enum";

@Injectable()
export class BooksService {
  private logger = new Logger(BooksService.name);

  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    private readonly fileService: FileService,
  ) {}

  async create(
    createBookDto: CreateBookDto,
    coverImage: Express.Multer.File | undefined,
    user: User,
  ) {
    const book = this.bookRepository.create({
      ...createBookDto,
      createdBy: user,
      coverImageUrl: coverImage?.path,
    });

    return this.bookRepository.save(book);
  }

  async findAll(dto: PaginationDto): Promise<{
    data: Book[];
    total: number;
  }> {
    const { page, limit, sortBy, sortOrder, search } = dto;

    const where: FindOptionsWhere<Book>[] = search
      ? [
          { title: ILike(`%${search}%`) },
          { author: ILike(`%${search}%`) },
          { publisher: ILike(`%${search}%`) },
        ]
      : undefined;

    const [data, total] = await this.bookRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: {
        [sortBy]: sortOrder, // Dynamic sorting
      },
      where,
    });

    return { data, total };
  }

  async findOne(id: number): Promise<Book> {
    const book = await this.bookRepository.findOneBy({
      id,
    });

    if (!book) throw new NotFoundException("Book not found");
    return book;
  }

  async update(
    id: number,
    file: Express.Multer.File | undefined,
    updateBookDto: UpdateBookDto,
  ): Promise<Book> {
    const { removeImage, ...updateValues } = updateBookDto;

    const currentBook = await this.findOne(id);

    const borrowedBookCount = currentBook.stock - currentBook.availableStock;

    const toAddStock =
      (updateValues.stock ?? currentBook.stock) - currentBook.stock;

    const newStockValue = updateValues.stock ?? currentBook.stock;

    if (borrowedBookCount > newStockValue)
      throw new BadRequestException(
        "The total stock cannot be reduced to less than the number of borrowed copies. Please ensure that the stock is at least equal to the borrowed quantity.",
      );

    const response = await this.bookRepository.update(id, {
      ...updateValues,
      coverImageUrl: removeImage ? null : file?.path,
      availableStock: currentBook.availableStock + toAddStock,
    });

    if (response.affected === 0) throw new Error("No book was updated");
    if (removeImage && currentBook.coverImageUrl !== null)
      await this.fileService.deleteFile(currentBook.coverImageUrl);
    return this.findOne(id);
  }

  remove(id: number) {
    return `This action removes a #${id} book`;
  }

  async removeAll(deleteBooksDto: DeleteBooksDto) {
    const { bookIds } = deleteBooksDto;
    try {
      const books = await this.bookRepository.find({
        where: {
          id: In(bookIds),
          coverImageUrl: Not(IsNull()),
        },
        select: ["coverImageUrl"],
      });

      const result = await this.bookRepository.delete(bookIds);
      await this.fileService.deleteFiles(
        books.map((book) => book.coverImageUrl),
      );
      return result.affected ?? 0;
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        error.message.includes("violates foreign key constraint")
      ) {
        throw new BadRequestException(
          "Selected books have history of transactions and can't be deleted",
        );
        // Add custom handling for query-related errors
      } else {
        console.error("Unexpected error:", error.message);
        throw new Error(error);
      }
    }
  }
}
