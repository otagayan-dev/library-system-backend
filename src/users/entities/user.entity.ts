import { BeforeInsert, Column, Entity, PrimaryColumn } from "typeorm";
import { Role } from "./role.enum";
import * as crypto from "crypto";
import * as bcrypt from "bcrypt";
import { Exclude } from "class-transformer";

@Entity()
export class User {
  @PrimaryColumn()
  id: string;

  @Column({
    type: "varchar",
    length: 100,
  })
  firstName: string;

  @Column({
    type: "varchar",
    length: 100,
  })
  lastName: string;

  @Column({
    type: "enum",
    enum: Role,
    enumName: "Role",
    default: Role.User,
  })
  role: Role;

  @Column({
    type: "text",
  })
  @Exclude()
  password: string;

  @Column({
    type: "varchar",
    length: 254,
  })
  email: string;

  @Column({
    type: "varchar",
    length: 30,
    unique: true,
  })
  username: string;

  @BeforeInsert()
  private generateId(): void {
    this.id = crypto.randomBytes(16).toString("hex"); // Generates a 32-character hexadecimal hash
  }

  @BeforeInsert()
  private async hashPassword(): Promise<void> {
    const saltOrRounds = 10;
    const hashedPassword = await bcrypt.hash(this.password, saltOrRounds);
    this.password = hashedPassword;
  }
}
