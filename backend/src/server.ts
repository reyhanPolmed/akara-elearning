import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { prisma } from "./lib/prisma.js";
import { startSimilarityWorker, stopSimilarityWorker } from "./services/similarity-worker.service.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`Backend running at ${env.BETTER_AUTH_URL}`);
  startSimilarityWorker();
});

async function shutdown(signal: string) {
  logger.info(`Shutting down due to ${signal}`);
  stopSimilarityWorker();
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
