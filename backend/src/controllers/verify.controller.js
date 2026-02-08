import { verificationService } from "../services/verification.service.js";

class VerifyController {
  async verify(req, res, next) {
    try {
      const lat = req.query.lat ? Number.parseFloat(req.query.lat) : undefined;
      const lng = req.query.lng ? Number.parseFloat(req.query.lng) : undefined;
      const deviceHash = req.headers["x-device-hash"] ? String(req.headers["x-device-hash"]) : undefined;

      const geo = Number.isFinite(lat) && Number.isFinite(lng)
        ? { location: { type: "Point", coordinates: [lng, lat] } }
        : undefined;

      const result = await verificationService.verifyCode(req.params.qrToken, { deviceHash, geo });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const verifyController = new VerifyController();
