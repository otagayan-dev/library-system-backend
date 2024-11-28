import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { RolesGuard } from "src/auth/roles.guard";
import { Roles } from "src/users/decorators/roles.decorator";
import { Role } from "src/users/enums/role.enum";
import { BorrowTransactionDto } from "./dto/borrow-transaction.dto";
import { BorrowingService } from "./borrowing.service";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { ReturnBooksDto } from "./dto/return-books.dto";
import { ReportMissingBookDto } from "./dto/report-missing-book.dto";

@Roles(Role.Admin)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("borrowing")
export class BorrowingController {
  constructor(private readonly borrowingService: BorrowingService) {}

  @Post()
  borrowBooks(@Body() dto: BorrowTransactionDto, @Req() req) {
    return this.borrowingService.borrowBooks(dto, req.user);
  }

  @Get("open")
  getOpenTransactions(@Query() dto: PaginationDto) {
    return this.borrowingService.getOpenTransactions(dto);
  }

  @Post("return")
  returnBooks(@Body() dto: ReturnBooksDto, @Req() req) {
    return this.borrowingService.returnBooks(dto, req.user);
  }

  @Post("missing")
  reportMissingBook(@Body() dto: ReportMissingBookDto, @Req() req) {
    return this.borrowingService.reportMissingBook(dto, req.user);
  }
}
