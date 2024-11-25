import { User } from "src/users/entities/user.entity";

export type JwtPayload = Pick<User, "username" | "role"> & {
  sub: string;
};
