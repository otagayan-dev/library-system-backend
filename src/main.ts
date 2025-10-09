import { NestFactory, Reflector } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ClassSerializerInterceptor, ValidationPipe } from "@nestjs/common";
import * as cookieParser from "cookie-parser";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { NestExpressApplication } from "@nestjs/platform-express";

const prepareFolders = () => {
  // Create the directory if it doesn't exist
  const uploadPath = "./uploads/books";
  if (!existsSync(uploadPath)) {
    mkdirSync(uploadPath, { recursive: true });
  }
};

async function bootstrap() {
  prepareFolders();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  /**
   * For class-validator and class-transformers
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  /**
   * For class-transformers
   */
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  app.use(cookieParser());
  app.enableCors({
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    origin: ["http://localhost:5173"], // allowed domains
    credentials: true,
  });

  // Serve static files from the uploads folder
  app.useStaticAssets(join(__dirname, "..", "uploads"), {
    prefix: "/uploads",
    setHeaders: (res) => {
      res.setHeader("Access-Control-Allow-Origin", "*"); // or specific domain
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    },
  });

  await app.listen(3000);
}
bootstrap();
