import { User } from "src/users/entities/user.entity";

export type JwtPayload = Pick<User, "idNumber" | "role"> & {
  sub: string;
};
