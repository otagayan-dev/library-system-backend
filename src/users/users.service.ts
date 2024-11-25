import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { FindOptionsWhere, Like, Repository } from "typeorm";
import { User } from "./entities/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { PaginationDto } from "src/common/dto/pagination.dto";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const user = this.userRepository.create(createUserDto);
      return await this.userRepository.save(user);
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

  update(id: string, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: string) {
    return this.userRepository.delete(id);
  }
}
