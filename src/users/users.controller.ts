import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { Roles } from "./decorators/roles.decorator";
import { Role } from "./enums/role.enum";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { RolesGuard } from "src/auth/roles.guard";
import { PaginationDto } from "src/common/dto/pagination.dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(Role.Admin)
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
  @Roles(Role.Admin)
  @Get()
  findAll(@Query() dto: PaginationDto) {
    return this.usersService.findAll(dto);
  }

  @Roles(Role.Admin)
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }
  @Roles(Role.Admin)
  @Patch(":id")
  update(@Param("id") id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }
  @Roles(Role.Admin)
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.usersService.remove(id);
  }
}
