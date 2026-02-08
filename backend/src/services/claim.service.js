import { bottleService } from "./bottle.service.js";

class ClaimService {
  async claim(bottleId, user) {
    const updated = await bottleService.transitionState(bottleId, "active", "claimed", {
      claimedAt: new Date(),
      claimedBy: user?.id ?? null
    });

    if (updated) {
      return { claimed: true, bottleId, state: updated.state };
    }

    const existing = await bottleService.getById(bottleId);
    if (existing?.state === "claimed") {
      return { claimed: true, bottleId, state: existing.state };
    }

    return { claimed: false, bottleId, reason: "NOT_ACTIVE" };
  }
}

export const claimService = new ClaimService();
