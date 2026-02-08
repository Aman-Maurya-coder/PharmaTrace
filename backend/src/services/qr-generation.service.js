class QRGenerationService {
  parseSerialNo(bottleId) {
    const parts = String(bottleId).split("-");
    if (parts.length < 2) return null;
    const serialCandidate = parts[parts.length - 2];
    const serialNo = Number.parseInt(serialCandidate, 10);
    return Number.isFinite(serialNo) ? serialNo : null;
  }

  async generateToken({ bottleId, batchId, companyName, expiryDate }) {
    const serialNo = this.parseSerialNo(bottleId);
    if (!serialNo || !batchId || !companyName || !expiryDate) {
      const err = new Error("Unable to generate QR token payload");
      err.status = 500;
      throw err;
    }

    return `${companyName}|${batchId}|${expiryDate}|${serialNo}`;
  }

  async generatePayload(data) {
    return { payload: JSON.stringify(data ?? {}) };
  }
}

export const qrGenerationService = new QRGenerationService();
