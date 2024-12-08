import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersModule } from "./users/users.module";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { BooksModule } from "./books/books.module";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";
import { FileModule } from "./file/file.module";
import { BorrowingModule } from "./borrowing/borrowing.module";
import { PenaltiesModule } from "./penalties/penalties.module";
import { HistoryModule } from "./history/history.module";
import { AnalyticsModule } from "./analytics/analytics.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: (() => {
        const env = process.env.NODE_ENV || "development"; // Default to 'development'
        const envFiles = [
          `.env.${env}.local`, // Priority 1
          `.env.${env}`, // Priority 2
          `.env.local`, // Priority 3
          `.env`, // Priority 4
        ];
        return envFiles;
      })(),
    }),
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: "postgres",
      database: process.env.DB,
      password: process.env.DB_PASSWORD,
      autoLoadEntities: true,
      synchronize: true,
      namingStrategy: new SnakeNamingStrategy(),
    }),
    UsersModule,
    AuthModule,
    BooksModule,
    FileModule,
    BorrowingModule,
    PenaltiesModule,
    HistoryModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
