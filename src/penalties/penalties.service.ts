import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Penalty } from "./entities/penalty.entity";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import * as dayjs from "dayjs";
import { BorrowTransaction } from "src/borrowing/entities/borrow-transaction.entity";
import { PenaltyCause } from "./enum/penalty-cause.enum";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { User } from "src/users/entities/user.entity";
import { ReportMissingBookDto } from "src/borrowing/dto/report-missing-book.dto";
import { BorrowTransactionBook } from "src/borrowing/entities/borrow-transaction-book.entity";
import { ResolvePenaltyDto } from "./dto/resolve-penalty.dto";

@Injectable()
export class PenaltiesService {
  private readonly logger = new Logger(PenaltiesService.name);
  constructor(
    @InjectRepository(Penalty)
    private readonly penaltyRepository: Repository<Penalty>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  getBorrowTransactionOverdueDays(
    borrowTransaction: BorrowTransaction,
  ): number {
    const daysThreshold = parseInt(
      this.configService.get<string>("BORROW_OVERDUE_DAYS_THRESHOLD"),
      10,
    );

    if (isNaN(daysThreshold))
      throw new Error("BORROW_OVERDUE_DAYS_THRESHOLD is not configured");

    const dateNow = dayjs();
    const borrowDate = dayjs(borrowTransaction.createdAt);
    const borrowedDays = dateNow.diff(borrowDate, "days");

    this.logger.debug({
      daysThreshold,
      dateNow,
      borrowDate,
      borrowedDays,
    });

    return borrowedDays - daysThreshold;
  }
  async createOverdueBorrowTransactionBookPenalties(
    borrowTransaction: BorrowTransaction,
    overdueDays: number,
  ): Promise<Penalty[]> {
    const overdueDailyRate = parseInt(
      this.configService.get<string>("BORROW_OVERDUE_DAILY_RATE"),
      10,
    );

    if (isNaN(overdueDailyRate))
      throw new Error("BORROW_OVERDUE_DAILY_RATE is not configured");

    this.logger.debug("createOverdueBorrowTransactionBookPenalties", {
      borrowTransaction,
    });

    const amountDue = overdueDailyRate * overdueDays;

    const penalties: Penalty[] = borrowTransaction.borrowTransactionBooks.map(
      (borrowTransactionBook) => {
        return this.penaltyRepository.create({
          user: borrowTransaction.user,
          borrowTransactionBook,
          amountDue: amountDue,
          cause: PenaltyCause.ReturnOverdue,
        });
      },
    );

    const createdPenalties = await this.penaltyRepository.insert(penalties);

    this.logger.debug("createOverdueBorrowTransactionBookPenalties", {
      createdPenalties,
    });

    return createdPenalties.generatedMaps as any;
  }

  async createMissingBookPenalty(
    borrowTransactionBook: BorrowTransactionBook,
    amountDue: number,
  ): Promise<void> {
    this.logger.debug("Create missing book penalty", {
      borrowTransactionBook,
      amountDue,
    });
    const penalty = this.penaltyRepository.create({
      user: borrowTransactionBook.borrowTransaction.user,
      amountDue,
      cause: PenaltyCause.LostBook,
      borrowTransactionBook: borrowTransactionBook,
    });
    await this.penaltyRepository.save(penalty);
  }

  async getAllUnresolvedPenalties(dto: PaginationDto): Promise<{
    data: Penalty[];
    total: number;
  }> {
    const { page, limit, sortBy, sortOrder, search } = dto;

    this.logger.debug("getAllUnresolvedPenalties", { dto });

    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });

    const query = this.penaltyRepository
      .createQueryBuilder("penalty")
      .leftJoin("penalty.user", "user")
      .addSelect([
        "user.id",
        "user.firstName",
        "user.lastName",
        "user.idNumber",
        "user.role",
      ]) // Explicitly select the fields you want for the user entity

      .leftJoinAndSelect(
        "penalty.borrowTransactionBook",
        "borrowTransactionBook",
      )
      .leftJoin("borrowTransactionBook.book", "book")
      .addSelect([
        "book.id",
        "book.title",
        "book.edition",
        "book.coverImageUrl",
      ])
      .leftJoin("borrowTransactionBook.updatedBy", "updatedBy")
      .addSelect([
        "updatedBy.id",
        "updatedBy.firstName",
        "updatedBy.lastName",
        "updatedBy.idNumber",
        "updatedBy.role",
      ]) // Explicitly select the fields you want for the user entity
      .where(
        "(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.idNumber ILIKE :search OR book.title ILIKE :search) AND penalty.resolvedAt IS NULL",
        {
          search: `%${search}%`,
        },
      )
      .orderBy(sortBy, sortOrder)
      .skip((page - 1) * limit)
      .limit(limit * page);

    const [data, total] = await query.getManyAndCount();

    return { data, total };
  }

  async resolvePenalty(dto: ResolvePenaltyDto, user: User): Promise<void> {
    const { penaltyId } = dto;

    const penalty = await this.penaltyRepository.findOne({
      where: {
        id: penaltyId,
      },
      select: ["resolvedAt", "id"],
    });
    this.logger.debug("resolvePenalty", { dto, penalty });

    if (!penalty) throw new BadRequestException("Penalty doesn't exist");
    if (penalty.resolvedAt)
      throw new BadRequestException("Penalty already resolved");

    await this.penaltyRepository
      .createQueryBuilder()
      .update(Penalty)
      .set({
        resolvedAt: () => "CURRENT_TIMESTAMP",
        resolvedBy: user,
      })
      .where("id = :id", {
        id: penaltyId,
      })
      .execute();
  }
}
