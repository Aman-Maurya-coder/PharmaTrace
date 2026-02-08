import { Router } from "express";
import { verifyController } from "../controllers/verify.controller.js";
import { RateLimitMiddleware } from "../middlewares/rateLimit.js";

const router = Router();

router.get("/:qrToken", RateLimitMiddleware, verifyController.verify);

export default router;
