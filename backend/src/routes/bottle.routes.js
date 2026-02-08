import { Router } from "express";
import { bottleController } from "../controllers/bottle.controller.js";
import { claimController } from "../controllers/claim.controller.js";
import { resetController } from "../controllers/reset.controller.js";
import { AuthMiddleware } from "../middlewares/auth.js";
import { RoleMiddleware } from "../middlewares/role.js";

const router = Router();

router.get("/", bottleController.list);
router.post("/", AuthMiddleware, bottleController.create);
router.get("/:bottleId", bottleController.getById);
router.post("/:bottleId/claim", claimController.claim);
router.post("/:bottleId/reset-request", AuthMiddleware, resetController.requestReset);
router.post("/:bottleId/reset-approve", AuthMiddleware, RoleMiddleware("admin"), resetController.approveReset);

export default router;
