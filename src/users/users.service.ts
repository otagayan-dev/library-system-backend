import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import {
  FindOptionsWhere,
  ILike,
  Like,
  QueryFailedError,
  Repository,
} from "typeorm";
import { User } from "./entities/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { Role } from "./enums/role.enum";
import { DeleteUsersDto } from "./dto/delete-users.dto";

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(
    createUserDto: CreateUserDto,
    options: { action: "create"; user: User },
  );
  async create(createUserDto: CreateUserDto, options: { action: "register" });
  async create(
    createUserDto: CreateUserDto,
    options: { action: "register" | "create"; user?: User },
  ): Promise<User> {
    const { action, user } = options;

    try {
      // Validates if action is permitted
      if (
        action === "create" &&
        createUserDto.role !== Role.User &&
        user.role !== Role.SuperAdmin
      )
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
    const { page, limit, sortOrder, sortBy, search = "" } = dto;

    this.logger.debug("FindAll", { dto });
    const [data, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: {
        [sortBy]: sortOrder,
      },
      where: [
        {
          isActivated: true,
          firstName: ILike(`%${search}%`),
        },
        {
          isActivated: true,
          lastName: ILike(`%${search}%`),
        },
        {
          isActivated: true,
          idNumber: ILike(`%${search}%`),
        },
      ],
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
    try {
      const result = await this.userRepository
        .createQueryBuilder()
        .delete()
        .from(User)
        .where("id IN (:...userIds)", { userIds })
        .andWhere("role = :role", { role: "user" })
        .execute();

      return result.affected ?? 0;
    } catch (error: any) {
      if (
        error instanceof QueryFailedError &&
        error.message.includes("violates foreign key constraint")
      ) {
        throw new BadRequestException(
          "Selected users have history of transactions and can't be deleted",
        );
        // Add custom handling for query-related errors
      } else {
        console.error("Unexpected error:", error.message);
        throw new Error(error);
      }
    }
  }
}
