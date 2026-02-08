import { claimService } from "../services/claim.service.js";

class ClaimController {
  async claim(req, res, next) {
    try {
      const result = await claimService.claim(req.params.bottleId, req.user);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const claimController = new ClaimController();
