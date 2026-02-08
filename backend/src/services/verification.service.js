import { Bottle } from "../models/bottle.model.js";
import { Batch } from "../models/batch.model.js";
import { ScanLog } from "../models/ScanLog.model.js";
import { securityService } from "./security.service.js";

class VerificationService {
  async verifyCode(qrToken, meta = {}) {
    const qrTokenHash = securityService.hash(qrToken);
    const bottle = await Bottle.findOne({ qrTokenHash })
      .select("-__v -_id")
      .lean();

    if (!bottle) {
      await ScanLog.create({
        qrTokenHash,
        deviceHash: meta.deviceHash,
        geo: meta.geo
      });
      return { valid: false, reason: "NOT_FOUND" };
    }

    const batch = await Batch.findOne({ batchId: bottle.batchId })
      .select("-__v -_id")
      .lean();
    const isExpired = batch?.expiresAt ? new Date(batch.expiresAt).getTime() < Date.now() : false;
    const isActive = bottle.state === "active";

    await ScanLog.create({
      qrTokenHash,
      bottleId: bottle.bottleId,
      deviceHash: meta.deviceHash,
      geo: meta.geo
    });

    if (!batch || isExpired) {
      return { valid: false, reason: "EXPIRED", bottleId: bottle.bottleId, batchId: bottle.batchId };
    }

    if (!isActive) {
      return { valid: false, reason: "INACTIVE", bottleId: bottle.bottleId, batchId: bottle.batchId };
    }

    return {
      valid: true,
      bottleId: bottle.bottleId,
      batchId: bottle.batchId,
      batch
    };
  }
}

export const verificationService = new VerificationService();
