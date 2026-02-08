import { verificationService } from "../services/verification.service.js";
import { claimService } from "../services/claim.service.js";

class ScanController {
  async validate(req, res, next) {
    try {
      const qrToken = req.body?.qrToken ?? req.body?.medicineHash;
      if (!qrToken) {
        return res.status(400).json({ error: "qrToken is required" });
      }

      const result = await verificationService.verifyCode(String(qrToken));
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  }

  async claim(req, res, next) {
    try {
      const bottleId = req.body?.bottleId;
      const qrToken = req.body?.qrToken ?? req.body?.medicineHash;

      if (bottleId) {
        const result = await claimService.claim(String(bottleId), req.user);
        return res.json(result);
      }

      if (!qrToken) {
        return res.status(400).json({ error: "qrToken or bottleId is required" });
      }

      const verification = await verificationService.verifyCode(String(qrToken));
      if (!verification?.valid || !verification?.bottleId) {
        return res.status(400).json({ claimed: false, reason: verification?.reason ?? "INVALID" });
      }

      const result = await claimService.claim(String(verification.bottleId), req.user);
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  }
}

export const scanController = new ScanController();