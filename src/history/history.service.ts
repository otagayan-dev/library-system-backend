import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { BorrowTransaction } from "src/borrowing/entities/borrow-transaction.entity";
import { BorrowTransactionStatus } from "src/borrowing/enums/borrow-transaction-status.enum";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { PaginationResponse } from "src/common/types/pagination-response";
import { Penalty } from "src/penalties/entities/penalty.entity";
import { Repository } from "typeorm";

@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);
  constructor(
    @InjectRepository(BorrowTransaction)
    private readonly borrowTransactionRepository: Repository<BorrowTransaction>,
    @InjectRepository(Penalty)
    private readonly penaltyRepository: Repository<Penalty>,
  ) {}

  /**
   * @description Get history of borrow transactions (Borrow transactions.status!=open)
   * @param dto
   */
  async getBorrowTransactionsHistory(
    dto: PaginationDto,
  ): Promise<PaginationResponse<BorrowTransaction>> {
    const {
      page,
      limit,
      search,
      sortBy = "borrowTransaction.createdAt",
      sortOrder = "DESC",
    } = dto;

    const query = this.borrowTransactionRepository
      .createQueryBuilder("borrowTransaction")
      .leftJoin("borrowTransaction.user", "user")
      .addSelect([
        "user.idNumber",
        "user.firstName",
        "user.lastName",
        "user.id",
      ])
      .leftJoin("borrowTransaction.createdBy", "createdBy")
      .addSelect([
        "createdBy.id",
        "createdBy.firstName",
        "createdBy.lastName",
        "createdBy.idNumber",
      ])

      .orderBy(sortBy, sortOrder)
      .where(
        "(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.idNumber ILIKE :search) AND borrowTransaction.status <> :status",
        {
          search: `%${search}%`,
          status: BorrowTransactionStatus.Open,
        },
      )
      .skip((page - 1) * limit)
      .limit(limit * page);

    this.logger.debug("query: ", query.getSql());

    const [data, total] = await query.getManyAndCount();
    this.logger.debug({
      dto,
      total,
      dataLength: data.length,
      skip: (page - 1) * limit,
      limit,
    });
    return {
      data,
      total,
    };
  }

  async getPenaltyHistory(
    dto: PaginationDto,
  ): Promise<PaginationResponse<Penalty>> {
    const { page, limit, sortBy, sortOrder, search } = dto;
    this.logger.debug("getPenaltyHistory", { dto });
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
      .leftJoin("penalty.resolvedBy", "resolvedBy")
      .addSelect([
        "resolvedBy.idNumber",
        "resolvedBy.firstName",
        "resolvedBy.lastName",
      ])
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
        "(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.idNumber ILIKE :search OR book.title ILIKE :search) AND penalty.resolvedAt IS NOT NULL",
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
}
