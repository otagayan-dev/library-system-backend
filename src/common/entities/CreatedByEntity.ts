import { User } from "src/users/entities/user.entity";
import { ManyToOne } from "typeorm";

export class CreatedByEntity {
  @ManyToOne(() => User)
  createdBy: User;
}
