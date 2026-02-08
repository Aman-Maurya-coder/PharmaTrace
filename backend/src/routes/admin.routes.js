import { Router } from "express";
import { adminController } from "../controllers/admin.controller.js";
import { AuthMiddleware } from "../middlewares/auth.js";
import { RoleMiddleware } from "../middlewares/role.js";

const router = Router();

router.get("/users", AuthMiddleware, RoleMiddleware("admin"), adminController.listUsers);
router.post("/invite", AuthMiddleware, RoleMiddleware("admin"), adminController.inviteUser);

export default router;
