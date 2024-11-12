import { ArgumentMetadata, PipeTransform } from "@nestjs/common";
import { validate } from "class-validator";

export class CreateUserValidationPipe implements PipeTransform {
  async transform(value: any, metadata: ArgumentMetadata) {
    const response = await validate(value);
  }
}
