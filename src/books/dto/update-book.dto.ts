import { PartialType } from "@nestjs/mapped-types";
import { CreateBookDto } from "./create-book.dto";
import { IsBoolean, IsNumber, IsOptional } from "class-validator";
import { Transform } from "class-transformer";

export class UpdateBookDto extends PartialType(CreateBookDto) {
  /**
   * Used to indicate if coverImage is removed
   */
  @IsBoolean()
  @Transform(({ value }) => value === "true")
  removeImage: boolean;
}
