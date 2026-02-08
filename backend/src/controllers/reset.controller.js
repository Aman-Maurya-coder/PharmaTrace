import { resetService } from "../services/reset.service.js";

class ResetController {
  async requestReset(req, res, next) {
    try {
      const result = await resetService.requestReset(req.params.bottleId, req.body, req.user);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async approveReset(req, res, next) {
    try {
      const result = await resetService.approveReset(req.params.bottleId, req.user);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const resetController = new ResetController();
