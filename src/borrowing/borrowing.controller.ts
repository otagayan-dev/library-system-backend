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
}
