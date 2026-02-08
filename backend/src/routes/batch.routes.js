import { Router } from "express";
import { batchController } from "../controllers/batch.controller.js";
import { qrExportController } from "../controllers/qr-export.controller.js";
import { AuthMiddleware } from "../middlewares/auth.js";

const router = Router();

router.get("/", batchController.list);
router.post("/", AuthMiddleware, batchController.create);
router.get("/:batchId", batchController.getById);
router.post("/:batchId/confirm-mint", AuthMiddleware, batchController.confirmMint);
router.get("/:batchId/qr-package", qrExportController.exportQrZip);
router.get("/:batchId/export/manifest", qrExportController.exportManifest);
router.get("/:batchId/export/qr-zip", qrExportController.exportQrZip);

export default router;
