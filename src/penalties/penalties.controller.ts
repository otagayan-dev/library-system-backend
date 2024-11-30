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
import { PaginationDto } from "src/common/dto/pagination.dto";
import { Roles } from "src/users/decorators/roles.decorator";
import { Role } from "src/users/enums/role.enum";
import { PenaltiesService } from "./penalties.service";
import { ResolvePenaltyDto } from "./dto/resolve-penalty.dto";

@Roles(Role.Admin)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("penalties")
export class PenaltiesController {
  constructor(private readonly penaltiesService: PenaltiesService) {}

  @Get("unresolved")
  getUnresolvedPenalties(@Query() dto: PaginationDto) {
    return this.penaltiesService.getAllUnresolvedPenalties(dto);
  }

  @Post("resolve")
  postResolvePenalty(@Body() dto: ResolvePenaltyDto, @Req() req) {
    return this.penaltiesService.resolvePenalty(dto, req.user);
  }
}
