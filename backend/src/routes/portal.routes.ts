import { Router } from "express";

import { getPortalSessionController } from "../controllers/portal-auth.controller.js";
import { asyncHandler } from "../utils/async-handler.js";

export function createPortalRouter() {
  const router = Router();

  router.get("/session", asyncHandler(getPortalSessionController));

  return router;
}
