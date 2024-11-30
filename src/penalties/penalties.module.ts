import { Module } from "@nestjs/common";
import { PenaltiesService } from "./penalties.service";
import { PenaltiesController } from "./penalties.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Penalty } from "./entities/penalty.entity";
import { User } from "src/users/entities/user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Penalty, User])],
  providers: [PenaltiesService],
  controllers: [PenaltiesController],
  exports: [PenaltiesService],
})
export class PenaltiesModule {}
