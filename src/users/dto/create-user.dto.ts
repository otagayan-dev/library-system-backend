import { User } from "../entities/user.entity";
import { Role } from "../enums/role.enum";
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from "class-validator";

export class CreateUserDto
  implements Omit<User, "id" | "createdAt" | "updatedAt" | "isActivated">
{
  @IsNotEmpty()
  @MaxLength(50)
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @MaxLength(100)
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsEnum(Role, {
    message: "Invalid user role",
  })
  role: Role;

  @ValidateIf((o) => o.role !== Role.User) // Only validate if role is not Role.User
  @IsNotEmpty()
  @IsString()
  @MinLength(10, {
    message: "Password should be more than 10 characters",
  })
  @MinLength(10, { message: "Password must be at least 10 characters long" })
  @Matches(/(?=.*[a-z])/, {
    message: "Password must contain at least one lowercase letter",
  })
  @Matches(/(?=.*[A-Z])/, {
    message: "Password must contain at least one uppercase letter",
  })
  @Matches(/(?=.*\d)/, { message: "Password must contain at least one number" })
  @Matches(/(?=.*[!@#$%^&*])/, {
    message:
      "Password must contain at least one special character (e.g., !@#$%^&*)",
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  idNumber: string;
}
