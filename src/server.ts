import { Server } from "http";
import app from "./app";
import config from "./config";
import { logger } from "./shared/logger";
import prisma from "./shared/prisma";
import { bootstrapSuperAdmin } from "./utils";

process.on("uncaughtException", error => {
  console.error("❌ UNCAUGHT EXCEPTION");
  console.error(error);
  process.exit(1);
});

let server: Server;

async function bootstrap() {
  try {
    logger.info("🔍 Checking database connection...");
    await prisma.$connect();
    logger.info("✅ Database connected successfully");

    // Run Seeder
    try {
      await bootstrapSuperAdmin();
      logger.info("✅ Seeder executed successfully");
    } catch (seedErr) {
      logger.error("❌ Seeder failed", seedErr);
      // Seeder fail holeo server bondho hobena (production safe)
    }

    // Start Server
    const PORT = config.port || 5000; // config.port priority
    const HOST = "0.0.0.0"; // Important for Render & Docker

    server = app.listen(Number(PORT), HOST, () => {
      logger.info(`🚀 Server is running on port ${PORT}`);
    });
  } catch (err) {
    logger.error("❌ Failed to start application");
    console.error(err);
    process.exit(1);
  }

  // Handle unhandled Promise errors
  process.on("unhandledRejection", error => {
    console.error("❌ UNHANDLED REJECTION", error);
    if (server) {
      server.close(() => process.exit(1));
    } else {
      process.exit(1);
    }
  });

  // Graceful shutdown (Render uses SIGTERM)
  process.on("SIGTERM", async () => {
    logger.info("🔻 SIGTERM received. Shutting down gracefully...");
    if (server) server.close();
    await prisma.$disconnect();
    process.exit(0);
  });
}

bootstrap();
