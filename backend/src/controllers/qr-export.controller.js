import { qrExportService } from "../services/qr-export.service.js";

class QRExportController {
  async exportManifest(req, res, next) {
    try {
      const { stream, filename, contentType } = await qrExportService.getManifestStream(req.params.batchId, req.query);
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename=\"${filename}\"`);
      stream.on("error", next);
      stream.pipe(res);
    } catch (err) {
      next(err);
    }
  }

  async exportQrZip(req, res, next) {
    try {
      const { stream, filename, contentType } = await qrExportService.getQrZipStream(req.params.batchId);
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename=\"${filename}\"`);
      stream.on("error", next);
      stream.pipe(res);
    } catch (err) {
      next(err);
    }
  }
}

export const qrExportController = new QRExportController();
