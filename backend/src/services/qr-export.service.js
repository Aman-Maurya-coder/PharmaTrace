import { Readable } from "stream";
import archiver from "archiver";
import QRCode from "qrcode";
import { Bottle } from "../models/bottle.model.js";
import { fileService } from "./file.service.js";
import { qrGenerationService } from "./qr-generation.service.js";
import { securityService } from "./security.service.js";

class QRExportService {
  async getManifestStream(batchId, query = {}) {
    const page = Math.max(1, Number.parseInt(query.page ?? 1, 10));
    const limit = Math.min(5000, Math.max(1, Number.parseInt(query.limit ?? 5000, 10)));

    const cursor = Bottle.find({ batchId: String(batchId) })
      .select("bottleId batchId state")
      .sort({ bottleId: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
      .cursor();

    async function* generator() {
      yield "bottleId,batchId,state\n";
      for await (const doc of cursor) {
        const line = [
          fileService.csvEscape(doc.bottleId),
          fileService.csvEscape(doc.batchId),
          fileService.csvEscape(doc.state)
        ].join(",");
        yield `${line}\n`;
      }
    }

    return {
      stream: Readable.from(generator()),
      filename: `manifest_${batchId}.csv`,
      contentType: "text/csv"
    };
  }

  async getQrZipStream(batchId) {
    // Validate QR token secret early for clearer error
    securityService.getQrTokenSecret();

    const total = await Bottle.countDocuments({ batchId: String(batchId) });
    if (total === 0) {
      const err = new Error("No bottles found for this batch");
      err.status = 404;
      throw err;
    }

    const archive = archiver("zip", { zlib: { level: 9 } });
    const cursor = Bottle.find({ batchId: String(batchId) })
      .select("bottleId")
      .sort({ bottleId: 1 })
      .lean()
      .cursor();

    setImmediate(async () => {
      try {
        for await (const doc of cursor) {
          const token = await qrGenerationService.generateToken({ bottleId: doc.bottleId });
          const pngBuffer = await QRCode.toBuffer(token, { type: "png" });
          archive.append(pngBuffer, { name: `${doc.bottleId}.png` });
        }
        archive.finalize();
      } catch (err) {
        archive.emit("error", err);
      }
    });

    return {
      stream: archive,
      filename: `qr_${batchId}.zip`,
      contentType: "application/zip"
    };
  }
}

export const qrExportService = new QRExportService();
