import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { AuthMiddleware } from "../middlewares/auth.js";

const router = Router();

router.post("/login", authController.login);
router.post("/register", authController.register);
router.get("/me", AuthMiddleware, authController.me);

export default router;
