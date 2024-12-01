import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { BorrowTransactionDto } from "./dto/borrow-transaction.dto";
import { User } from "src/users/entities/user.entity";
import { In, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Book } from "src/books/entities/book.entity";
import { BorrowTransaction } from "./entities/borrow-transaction.entity";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { BorrowTransactionBook } from "./entities/borrow-transaction-book.entity";
import {
  BorrowTransactionBookStatus,
  BorrowTransactionStatus,
} from "./enums/borrow-transaction-status.enum";
import { ReturnBooksDto } from "./dto/return-books.dto";
import { ReportMissingBookDto } from "./dto/report-missing-book.dto";
import { PenaltiesService } from "src/penalties/penalties.service";
import { Penalty } from "src/penalties/entities/penalty.entity";

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
    private readonly penaltiesService: PenaltiesService,
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

  private async validateReturnBooksDto(dto: ReturnBooksDto): Promise<{
    borrowTransaction: BorrowTransaction;
  }> {
    const { borrowTransactionBookIds, borrowTransactionId } = dto;

    const borrowTransaction = await this.borrowTransactionRepository
      .createQueryBuilder("borrowTransaction")
      .leftJoinAndSelect("borrowTransaction.user", "user")
      .leftJoinAndSelect(
        "borrowTransaction.borrowTransactionBooks",
        "borrowTransactionBook",
        "borrowTransactionBook.id IN (:...borrowTransactionBookIds) AND borrowTransactionBook.status = :status",
        {
          borrowTransactionBookIds,
          status: BorrowTransactionBookStatus.Borrowed,
        },
      )
      .leftJoin("borrowTransactionBook.book", "book")
      .addSelect(["book.id", "book.title"])
      .where("borrowTransaction.id = :borrowTransactionId", {
        borrowTransactionId,
      })
      .getOne();

    if (!borrowTransaction)
      throw new BadRequestException("Transaction doesn't exist");

    this.logger.debug("validateReturnBooksDto", { borrowTransaction });
    if (
      borrowTransaction.borrowTransactionBooks.length !==
      borrowTransactionBookIds.length
    )
      throw new BadRequestException(
        "Some transaction books doesn't exist or is already returned",
      );

    return { borrowTransaction };
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
      .where(
        "(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.idNumber ILIKE :search) AND borrowTransaction.status = :status",
        {
          search: `%${search}%`,
          status: BorrowTransactionStatus.Open,
        },
      )
      .orderBy(sortBy, sortOrder)
      .limit(limit * page)
      .skip((page - 1) * limit)
      .getManyAndCount();
    this.logger.debug("getOpenTransactions", {
      dataCount: data.length,
      total,
      limit,
      skip: (page - 1) * limit,
    });

    return {
      data,
      total,
    };
  }

  async getBorrowTransactionBooks(
    borrowTransactionId: BorrowTransaction["id"],
  ): Promise<BorrowTransactionBook[]> {
    this.logger.debug("getBorrowTransactionBooks", { borrowTransactionId });
    const count = await this.borrowTransactionRepository.countBy({
      id: borrowTransactionId,
    });
    if (count === 0)
      throw new NotFoundException("Borrow transaction doesn't exist");

    return this.borrowTransactionBookRepository
      .createQueryBuilder("borrowTransactionBook")
      .leftJoin("borrowTransactionBook.book", "book")
      .addSelect([
        "book.id",
        "book.title",
        "book.edition",
        "book.coverImageUrl",
      ])
      .leftJoin("borrowTransactionBook.updatedBy", "updatedBy")
      .addSelect([
        "updatedBy.idNumber",
        "updatedBy.firstName",
        "updatedBy.lastName",
      ])
      .where(
        "borrowTransactionBook.borrow_transaction_id = :borrowTransactionId",
        {
          borrowTransactionId,
        },
      )
      .getMany();
  }

  async getBorrowedAndMissingBookCountOfBorrowTransaction(
    borrowTransactionId: number,
  ) {
    const bookCounts = await this.borrowTransactionBookRepository
      .createQueryBuilder("borrowTransactionBook")
      .leftJoin("borrowTransactionBook.borrowTransaction", "borrowTransaction")
      .select("borrowTransactionBook.status", "status")
      .addSelect("COUNT(borrowTransactionBook.id)", "count")
      .where("borrowTransaction.id = :borrowTransactionId", {
        borrowTransactionId,
      })
      .andWhere("borrowTransactionBook.status IN (:...statuses)", {
        statuses: [
          BorrowTransactionBookStatus.Missing,
          BorrowTransactionBookStatus.Borrowed,
        ],
      })
      .groupBy("borrowTransactionBook.status")
      .getRawMany();

    const borrowedCount =
      bookCounts.find(
        (item) => item.status === BorrowTransactionBookStatus.Borrowed,
      )?.count || 0;
    const missingCount =
      bookCounts.find(
        (item) => item.status === BorrowTransactionBookStatus.Missing,
      )?.count || 0;

    return { borrowedCount, missingCount };
  }

  async updateBorrowTransactionStatus(
    borrowTransaction: BorrowTransaction,
  ): Promise<{
    isBorrowTransactionCompleted: boolean;
  }> {
    const { borrowedCount, missingCount } =
      await this.getBorrowedAndMissingBookCountOfBorrowTransaction(
        borrowTransaction.id,
      );
    // Set status to closed
    if (borrowedCount === 0) {
      borrowTransaction.status =
        missingCount === 0
          ? BorrowTransactionStatus.Closed
          : BorrowTransactionStatus.ClosedWithErrors;
      await this.borrowTransactionRepository
        .createQueryBuilder()
        .update(BorrowTransaction)
        .set({
          status: borrowTransaction.status,
        })
        .where("id = :id", {
          id: borrowTransaction.id,
        })
        .execute();
    }

    return {
      isBorrowTransactionCompleted:
        borrowTransaction.status === BorrowTransactionStatus.Closed,
    };
  }

  async returnBooks(
    dto: ReturnBooksDto,
    user: User,
  ): Promise<{
    penalties: Penalty[];
    isBorrowTransactionCompleted: boolean;
  }> {
    const { borrowTransactionBookIds } = dto;

    const { borrowTransaction } = await this.validateReturnBooksDto(dto);

    /**
     * @todo
     * Check for overdued books and create penalty
     */
    const overdueDays =
      this.penaltiesService.getBorrowTransactionOverdueDays(borrowTransaction);

    this.logger.debug({ overdueDays });

    let penalties: Penalty[] = [];
    if (overdueDays > 0) {
      penalties =
        await this.penaltiesService.createOverdueBorrowTransactionBookPenalties(
          borrowTransaction,
          overdueDays,
        );
    }

    // Update return data of borrowTransactionBook
    await this.borrowTransactionBookRepository
      .createQueryBuilder()
      .update(BorrowTransactionBook)
      .set({
        updatedAt: () => "CURRENT_TIMESTAMP",
        status: BorrowTransactionBookStatus.Returned,
        updatedBy: user,
      })
      .where("id IN (:...ids)", {
        ids: borrowTransactionBookIds,
      })
      .execute();

    const { isBorrowTransactionCompleted } =
      await this.updateBorrowTransactionStatus(borrowTransaction);

    // Update available_stock of books
    await this.bookRepository
      .createQueryBuilder()
      .update(Book)
      .set({
        availableStock: () => "available_stock + 1",
      })
      .where("id IN (:...ids)", {
        ids: borrowTransaction.borrowTransactionBooks.map(
          ({ book }) => book.id,
        ),
      })
      .execute();

    return {
      penalties,
      isBorrowTransactionCompleted,
    };
  }

  async reportMissingBook(dto: ReportMissingBookDto, user: User) {
    const { borrowTransactionBookId } = dto;

    const borrowTransactionBook = await this.borrowTransactionBookRepository
      .createQueryBuilder("borrowTransactionBook")
      .leftJoin("borrowTransactionBook.borrowTransaction", "borrowTransaction")
      .addSelect(["borrowTransaction.id", "borrowTransaction.status"])
      .leftJoin("borrowTransactionBook.book", "book")
      .addSelect(["book.id"])
      .addSelect(["borrowTransaction.id"])
      .leftJoinAndSelect("borrowTransaction.user", "user")
      .where("borrowTransactionBook.id = :borrowTransactionBookId", {
        borrowTransactionBookId,
      })
      .getOne();

    if (!borrowTransactionBook)
      throw new BadRequestException("Book transaction doesn't exist");

    // Update borrowTransactionBookRepository status
    await this.borrowTransactionBookRepository
      .createQueryBuilder()
      .update(BorrowTransactionBook)
      .set({
        status: BorrowTransactionBookStatus.Missing,
        updatedBy: user,
        updatedAt: () => "CURRENT_TIMESTAMP",
      })
      .where("id = :id", {
        id: borrowTransactionBookId,
      })
      .execute();

    await this.updateBorrowTransactionStatus(
      borrowTransactionBook.borrowTransaction,
    );

    // Minus the current stock of the book
    await this.bookRepository
      .createQueryBuilder()
      .update(Book)
      .set({
        stock: () => "stock - 1",
      })
      .where("id = :bookId", {
        bookId: borrowTransactionBook.book.id,
      })
      .execute();

    /**
     * @todo Create penalties
     */
    await this.penaltiesService.createMissingBookPenalty(
      borrowTransactionBook,
      dto.amountDue,
    );
  }
}
