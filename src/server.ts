import { Server } from "http";
import app from "./app";
import config from "./config";
import { logger } from "./shared/logger";
import prisma from "./shared/prisma";
import { bootstrapSuperAdmin } from "./utils";

process.on("uncaughtException", error => {
  console.log(error);
  process.exit(1);
});

let server: Server;

async function bootstrap() {
  try {
    logger.info("Checking database connection...");
    await prisma.$connect();
    logger.info("Database connected successfully");
    await bootstrapSuperAdmin();
    // server = app.listen(config.port, () => {
    //   logger.info(`🛢   Database is connected successfully`);
    //   logger.info(`Application  listening on port ${config.port}`);
    // });
    server = app.listen(5000, "0.0.0.0", () => {
      console.log(`Application listening on port ${config.port}`);
    });
  } catch (err) {
    logger.info("Failed to connect database", err);
    // console.log('Failed to connect database', err);
  }

  process.on("unhandledRejection", error => {
    if (server) {
      server.close(() => {
        console.log(error);
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  });
}

bootstrap();
