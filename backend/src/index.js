import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import batchRoutes from "./routes/batch.routes.js";
import bottleRoutes from "./routes/bottle.routes.js";
import verifyRoutes from "./routes/verify.routes.js";
import exportRoutes from "./routes/export.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import { IdempotencyMiddleware } from "./middlewares/idempotency.js";
import { ErrorHandlerMiddleware } from "./middlewares/error-handler.js";
import { connectDB } from "./config/db.js";

dotenv.config();

await connectDB();

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : true,
  credentials: true
}));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));
app.use(IdempotencyMiddleware);

app.use("/api/auth", authRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/bottles", bottleRoutes);
app.use("/api/verify", verifyRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/admin", adminRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "pharmatrace-backend" });
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use(ErrorHandlerMiddleware);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend running on port ${port}`);
});
