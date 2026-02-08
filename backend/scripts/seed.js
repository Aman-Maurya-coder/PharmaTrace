import dotenv from "dotenv";
import { connectDB } from "../src/config/db.js";

dotenv.config();

async function run() {
  await connectDB();
  // Optional seed logic for non-production environments only.
  // Intentionally left blank.
  // eslint-disable-next-line no-console
  console.log("Seed complete (no-op)");
  process.exit(0);
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Seed failed", err);
  process.exit(1);
});
