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
  Req,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { Roles } from "./decorators/roles.decorator";
import { Role } from "./enums/role.enum";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { RolesGuard } from "src/auth/roles.guard";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { SecretKeyGuard } from "src/auth/secret-key.guard";
import { DeleteUsersDto } from "./dto/delete-users.dto";

@UseGuards(SecretKeyGuard, JwtAuthGuard, RolesGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(Role.Admin)
  @Post()
  create(@Body() createUserDto: CreateUserDto, @Req() request) {
    return this.usersService.create(
      createUserDto,
      request.bypassGuards
        ? {
            id: "root",
            role: Role.SuperAdmin,
          }
        : request.user,
    );
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
  update(
    @Param("id") id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req,
  ) {
    return this.usersService.update(id, updateUserDto, req.user);
  }
  @Roles(Role.Admin)
  @Delete()
  removeAll(@Body() deleteUsersDto: DeleteUsersDto) {
    return this.usersService.removeAll(deleteUsersDto);
  }
}
