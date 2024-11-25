import { ArrayNotEmpty, IsArray, IsString } from "class-validator";
import { User } from "../entities/user.entity";

export class DeleteUsersDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  userIds: Array<User["id"]>;
}
