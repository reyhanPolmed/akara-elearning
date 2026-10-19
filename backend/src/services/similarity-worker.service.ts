import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { isWinnowingConfigured, runSimilarityWorkerCycle } from "./winnowing.service.js";

let timer: NodeJS.Timeout | undefined;
let running = false;

async function runCycle() {
  if (running) return;
  running = true;

  try {
    await runSimilarityWorkerCycle();
  } catch (error) {
    logger.error({ err: error }, "Similarity worker cycle failed");
  } finally {
    running = false;
  }
}

export function startSimilarityWorker() {
  if (!isWinnowingConfigured()) {
    logger.warn("Similarity worker disabled: WINNOWING_API_BASE_URL or WINNOWING_TENANT_ID is missing");
    return;
  }

  void runCycle();
  timer = setInterval(() => {
    void runCycle();
  }, env.WINNOWING_SYNC_INTERVAL_MS);
  timer.unref();

  logger.info({ intervalMs: env.WINNOWING_SYNC_INTERVAL_MS }, "Similarity worker started");
}

export function stopSimilarityWorker() {
  if (timer) clearInterval(timer);
}
