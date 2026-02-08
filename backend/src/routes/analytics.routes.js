import { Router } from "express";
import { analyticsController } from "../controllers/analytics.controller.js";

const router = Router();

router.get("/summary", analyticsController.summary);
router.get("/manufacturer/overview", analyticsController.manufacturerOverview);
router.get("/geo", analyticsController.geo);

export default router;
