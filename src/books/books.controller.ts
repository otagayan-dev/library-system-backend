import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  Query,
} from "@nestjs/common";
import { BooksService } from "./books.service";
import { CreateBookDto } from "./dto/create-book.dto";
import { UpdateBookDto } from "./dto/update-book.dto";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { RolesGuard } from "src/auth/roles.guard";
import { Roles } from "src/users/decorators/roles.decorator";
import { Role } from "src/users/enums/role.enum";
import { FileInterceptor } from "@nestjs/platform-express";
import { Express } from "express";
import { diskStorage } from "multer";
import { extname } from "path";
import { Book } from "./entities/book.entity";
import { DeleteBooksDto } from "./dto/delete-books.dto";
import { bookImageUploadPath } from "./constants";
import { PaginationDto } from "src/common/dto/pagination.dto";

const CoverImageFileInterceptor = FileInterceptor("coverImage", {
  storage: diskStorage({
    destination: bookImageUploadPath, // Destination folder
    filename: (_req, file, callback) => {
      // Generate a unique filename
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname); // Extract file extension
      const fileName = `${file.fieldname}-${uniqueSuffix}${ext}`;
      callback(null, fileName); // Pass the filename to Multer
    },
  }),
});

@Roles(Role.Admin)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("books")
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @UseInterceptors(CoverImageFileInterceptor)
  @Post()
  create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createBookDto: CreateBookDto,
    @Req() req,
  ) {
    return this.booksService.create(createBookDto, file, req.user);
  }

  @Get()
  findAll(@Query() dto: PaginationDto) {
    return this.booksService.findAll(dto);
  }

  @Get(":id")
  findOne(@Param("id") id: string): Promise<Book> {
    return this.booksService.findOne(+id);
  }

  @UseInterceptors(CoverImageFileInterceptor)
  @Patch(":id")
  update(
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() updateBookDto: UpdateBookDto,
  ) {
    return this.booksService.update(+id, file, updateBookDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.booksService.remove(+id);
  }

  @Delete()
  removeAll(@Body() dto: DeleteBooksDto) {
    return this.booksService.removeAll(dto);
  }
}
