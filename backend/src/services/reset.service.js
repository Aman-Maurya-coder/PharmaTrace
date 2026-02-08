import { ResetRequest } from "../models/ResetRequest.model.js";
import { bottleService } from "./bottle.service.js";
import { auditLogService } from "./audit-log.service.js";

class ResetService {
  async requestReset(bottleId, payload, user) {
    const maxResets = 3;
    const count = await ResetRequest.countDocuments({ bottleId: String(bottleId) });
    if (count >= maxResets) {
      return { requested: false, reason: "RESET_LIMIT" };
    }

    const lastRequest = await ResetRequest.findOne({ bottleId: String(bottleId) })
      .sort({ createdAt: -1 })
      .lean();
    if (lastRequest?.createdAt) {
      const diff = Date.now() - new Date(lastRequest.createdAt).getTime();
      if (diff < 24 * 60 * 60 * 1000) {
        return { requested: false, reason: "RESET_WINDOW" };
      }
    }

    const doc = await ResetRequest.create({
      bottleId: String(bottleId),
      status: "pending",
      reason: payload?.reason ? String(payload.reason) : undefined,
      requestedBy: user?.id ?? null
    });

    await auditLogService.record({
      entityType: "ResetRequest",
      entityId: doc.id ?? doc._id,
      action: "requested",
      actorId: user?.id ?? null
    });

    return { requested: true, resetRequestId: doc.id ?? null };
  }

  async approveReset(bottleId, user) {
    const request = await ResetRequest.findOneAndUpdate(
      { bottleId: String(bottleId), status: "pending" },
      { $set: { status: "approved", approvedBy: user?.id ?? null } },
      { new: true }
    ).lean();

    if (!request) {
      return { approved: false, reason: "NOT_FOUND" };
    }

    await bottleService.transitionState(bottleId, "claimed", "active", { resetAt: new Date() });

    await auditLogService.record({
      entityType: "ResetRequest",
      entityId: request.id ?? request._id,
      action: "approved",
      actorId: user?.id ?? null
    });

    return { approved: true, bottleId };
  }
}

export const resetService = new ResetService();
