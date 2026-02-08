import { Router } from "express";
import { qrExportController } from "../controllers/qr-export.controller.js";

const router = Router();

router.get("/:batchId/manifest", qrExportController.exportManifest);
router.get("/:batchId/qr-zip", qrExportController.exportQrZip);

export default router;
