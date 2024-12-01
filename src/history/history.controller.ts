import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { RolesGuard } from "src/auth/roles.guard";
import { BorrowTransaction } from "src/borrowing/entities/borrow-transaction.entity";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { PaginationResponse } from "src/common/types/pagination-response";
import { Roles } from "src/users/decorators/roles.decorator";
import { Role } from "src/users/enums/role.enum";
import { HistoryService } from "./history.service";
import { Penalty } from "src/penalties/entities/penalty.entity";

@Roles(Role.Admin)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("history")
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get("borrow-transactions")
  getBorrowTransactionsHistory(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginationResponse<BorrowTransaction>> {
    return this.historyService.getBorrowTransactionsHistory(paginationDto);
  }

  @Get("penalties")
  getPenaltyHistory(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginationResponse<Penalty>> {
    return this.historyService.getPenaltyHistory(paginationDto);
  }
}
