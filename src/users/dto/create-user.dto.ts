import { User } from "../entities/user.entity";
import { Role } from "../entities/role.enum";
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateUserDto implements Omit<User, "id"> {
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

  @IsEmail()
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(30)
  username: string;
}
