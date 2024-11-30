import { IsNumber } from "class-validator";
import { Penalty } from "../entities/penalty.entity";

export class ResolvePenaltyDto {
  @IsNumber()
  penaltyId: Penalty["id"];
}
