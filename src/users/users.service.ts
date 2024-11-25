import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { FindOptionsWhere, Like, Repository } from "typeorm";
import { User } from "./entities/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { Role } from "./enums/role.enum";
import { DeleteUsersDto } from "./dto/delete-users.dto";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto, user: User): Promise<User> {
    try {
      // Validates if action is permitted
      if (createUserDto.role !== Role.User && user.role !== Role.SuperAdmin)
        throw new UnauthorizedException();
      const createdUser = this.userRepository.create(createUserDto);
      return await this.userRepository.save(createdUser);
    } catch (error) {
      if (error.code === "23505") {
        throw new ConflictException("ID Number already exists");
      }
      throw error;
    }
  }

  findByIdNumber(idNumber: string): Promise<User | null> {
    return this.userRepository.findOneBy({ idNumber });
  }

  async findAll(dto: PaginationDto): Promise<{
    data: User[];
    total: number;
  }> {
    const { page, limit, sortOrder, sortBy, search } = dto;
    const where: FindOptionsWhere<User>[] | undefined = search
      ? [
          {
            firstName: Like(`%${search}%`),
          },
          {
            lastName: Like(`%${search}%`),
          },
          {
            idNumber: Like(`%${search}%`),
          },
        ]
      : undefined;
    const [data, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: {
        [sortBy]: sortOrder,
      },
      where,
    });
    return { data, total };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOneBy({
      id,
    });
    if (user === null) throw new NotFoundException("User not found");
    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    user: User,
  ): Promise<User> {
    const currentUser = await this.findOne(id);
    if (currentUser.role !== Role.User)
      throw new UnauthorizedException(
        "Only users with role 'user' can be updated",
      );
    const { affected } = await this.userRepository.update(id, updateUserDto);
    if (affected === 0) throw new NotFoundException("User not found");
    return this.findOne(id);
  }

  async removeAll(deleteUsersDto: DeleteUsersDto): Promise<number> {
    const { userIds } = deleteUsersDto;

    //Delete only users that have user role
    const result = await this.userRepository
      .createQueryBuilder()
      .delete()
      .from(User)
      .where("id IN (:...userIds)", { userIds })
      .andWhere("role = :role", { role: "user" })
      .execute();

    return result.affected ?? 0;
  }
}
