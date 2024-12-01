import { IsString } from "class-validator";

export class ActivateUserDto {
  @IsString()
  userId: string;
}
