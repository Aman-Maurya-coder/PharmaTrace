import { Router } from "express";
import { scanController } from "../controllers/scan.controller.js";

const router = Router();

router.post("/validate", scanController.validate);
router.post("/claim", scanController.claim);

export default router;