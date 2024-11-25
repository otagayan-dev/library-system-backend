import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { CreateBookDto } from "./dto/create-book.dto";
import { UpdateBookDto } from "./dto/update-book.dto";
import { FindOptionsWhere, In, IsNull, Like, Not, Repository } from "typeorm";
import { Book } from "./entities/book.entity";
import { User } from "src/users/entities/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { DeleteBooksDto } from "./dto/delete-books.dto";
import { FileService } from "src/file/file.service";
import { PaginationDto } from "src/common/dto/pagination.dto";

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
          { title: Like(`%${search}%`) },
          { author: Like(`%${search}%`) },
          { publisher: Like(`%${search}%`) },
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
    this.logger.debug("BookService.update", {
      file,
      updateBookDto,
      id,
    });
    const currentBook = await this.findOne(id);
    const response = await this.bookRepository.update(id, {
      ...updateValues,
      coverImageUrl: removeImage ? null : file?.path,
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
    const books = await this.bookRepository.find({
      where: {
        id: In(bookIds),
        coverImageUrl: Not(IsNull()),
      },
      select: ["coverImageUrl"],
    });
    const result = await this.bookRepository.delete(bookIds);
    await this.fileService.deleteFiles(books.map((book) => book.coverImageUrl));
    return result.affected ?? 0;
  }
}
