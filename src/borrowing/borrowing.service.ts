import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { BorrowTransactionDto } from "./dto/borrow-transaction.dto";
import { User } from "src/users/entities/user.entity";
import { In, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Book } from "src/books/entities/book.entity";
import { BorrowTransaction } from "./entities/borrow-transaction.entity";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { BorrowTransactionBook } from "./entities/borrow-transaction-book.entity";
import { BorrowTransactionStatus } from "./enums/borrow-transaction-status.enum";

@Injectable()
export class BorrowingService {
  private readonly logger = new Logger(BorrowingService.name);
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    @InjectRepository(BorrowTransaction)
    private readonly borrowTransactionRepository: Repository<BorrowTransaction>,
    @InjectRepository(BorrowTransactionBook)
    private readonly borrowTransactionBookRepository: Repository<BorrowTransactionBook>,
  ) {}

  private async validateBorrowTransactionDto(
    dto: BorrowTransactionDto,
  ): Promise<{
    userToBorrow: User;
    booksToBorrow: Book[];
  }> {
    const { userId, bookIds } = dto;
    // Check for user pending transactions -------
    const userToBorrow = await this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect(
        "user.borrowTransactions",
        "borrowTransaction",
        "borrowTransaction.status = 'open'",
      )
      .where("user.id = :userId", { userId })
      .getOne();

    if (userToBorrow === null)
      throw new BadRequestException("User doesn't exist");

    const pendingTransactions = userToBorrow.borrowTransactions;

    if (pendingTransactions.length > 0)
      throw new BadRequestException(
        "User has pending transactions and can't borrow more books",
      );

    // Check for book validity -------
    const books = await this.bookRepository.findBy({
      id: In(bookIds),
    });

    if (books.length !== bookIds.length)
      throw new BadRequestException("One or more books are not found");

    const unavailableBooks = books.filter(
      ({ availableStock }) => availableStock <= 0,
    );

    if (unavailableBooks.length > 0)
      throw new BadRequestException(
        `The following books are not available: ${unavailableBooks
          .map(({ title }) => title)
          .join(", ")}`,
      );

    return {
      userToBorrow,
      booksToBorrow: books,
    };
  }

  async borrowBooks(dto: BorrowTransactionDto, createdBy: User) {
    const { userToBorrow, booksToBorrow } =
      await this.validateBorrowTransactionDto(dto);

    this.logger.debug("Set available stock");
    await this.bookRepository
      .createQueryBuilder()
      .update(Book)
      .set({
        availableStock: () => "available_stock - 1",
      })
      .where("id IN (:...ids)", {
        ids: booksToBorrow.map(({ id }) => id),
      })
      .execute();

    const transaction = this.borrowTransactionRepository.create({
      user: userToBorrow,
      createdBy,
    });
    const savedTransaction = await this.borrowTransactionRepository.save(
      transaction,
    );

    const borrowTransactionBooks = booksToBorrow.map((book) =>
      this.borrowTransactionBookRepository.create({
        book,
        borrowTransaction: savedTransaction,
      }),
    );
    await this.borrowTransactionBookRepository.save(borrowTransactionBooks);
  }

  async getOpenTransactions(paginationDto: PaginationDto) {
    const { limit, page, search, sortBy, sortOrder } = paginationDto;
    this.logger.debug({
      paginationDto,
    });

    const queryBuilder =
      this.borrowTransactionRepository.createQueryBuilder("borrowTransaction");

    const [data, total] = await queryBuilder
      .leftJoin("borrowTransaction.user", "user")
      .addSelect([
        "user.id",
        "user.idNumber",
        "user.firstName",
        "user.lastName",
        "user.role",
      ])
      .leftJoin("borrowTransaction.createdBy", "createdBy")
      .addSelect([
        "createdBy.id",
        "createdBy.idNumber",
        "createdBy.firstName",
        "createdBy.lastName",
        "createdBy.role",
      ])
      .leftJoinAndSelect(
        "borrowTransaction.borrowTransactionBooks",
        "borrowTransactionBook",
      )
      .leftJoin("borrowTransactionBook.book", "book")
      .addSelect([
        "book.id",
        "book.title",
        "book.edition",
        "book.coverImageUrl",
      ])
      .orderBy(`user.${sortBy}`, sortOrder)
      .where(
        "(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.idNumber ILIKE :search) AND borrowTransaction.status = :status",
        {
          search: `%${search}%`,
          status: BorrowTransactionStatus.Open,
        },
      )
      .skip((page - 1) * limit)
      .limit(limit)
      .getManyAndCount();

    this.logger.debug({
      data,
      total,
    });

    return {
      data,
      total,
    };
  }
}
