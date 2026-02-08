import { securityService } from "./security.service.js";

class QRGenerationService {
  async generateToken({ bottleId }) {
    return securityService.generateQrToken(bottleId);
  }

  async generatePayload(data) {
    return { payload: JSON.stringify(data ?? {}) };
  }
}

export const qrGenerationService = new QRGenerationService();
