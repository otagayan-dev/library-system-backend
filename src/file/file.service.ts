import { Injectable, Logger } from "@nestjs/common";
import { promises as fs } from "fs";

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      this.logger.log(`File deleted: ${filePath}`);
    } catch (error) {
      if (error.code === "ENOENT") {
        this.logger.warn(`File not found: ${filePath}`);
      } else {
        this.logger.error(`Failed to delete file: ${filePath}`, error.stack);
        throw new Error(`Could not delete file: ${filePath}`);
      }
    }
  }

  async deleteFiles(filePaths: string[]): Promise<void> {
    const deletionPromises = filePaths.map((filePath) =>
      this.deleteFile(filePath).catch((error) => {
        // Handle individual file deletion errors without stopping the process
        this.logger.warn(
          `Error deleting file: ${filePath}, Error: ${error.message}`,
        );
      }),
    );

    await Promise.all(deletionPromises);
    this.logger.log(`All files deletion attempted.`);
  }
}
