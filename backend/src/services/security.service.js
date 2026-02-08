import crypto from "crypto";

class SecurityService {
  generateId(prefix = "id") {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  hash(value) {
    return crypto.createHash("sha256").update(String(value)).digest("hex");
  }

  getQrTokenSecret() {
    const secret = process.env.QR_TOKEN_SECRET;
    if (!secret) {
      const err = new Error("QR_TOKEN_SECRET is required");
      err.status = 500;
      throw err;
    }
    return secret;
  }

  generateQrToken(bottleId) {
    const secret = this.getQrTokenSecret();
    return crypto
      .createHmac("sha256", secret)
      .update(String(bottleId))
      .digest("hex");
  }
}

export const securityService = new SecurityService();
