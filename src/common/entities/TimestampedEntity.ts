import { CreateDateColumn } from "typeorm";

export abstract class TimestampedEntity {
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @CreateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
