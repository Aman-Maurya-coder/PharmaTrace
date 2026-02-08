import { Batch } from "../models/batch.model.js";
import { bottleService } from "./bottle.service.js";
import { merkleService } from "./merkle.service.js";
import { securityService } from "./security.service.js";

const toInt = (value, fallback) => {
  const num = Number.parseInt(value, 10);
  return Number.isNaN(num) ? fallback : num;
};

class BatchService {
  async list(query = {}) {
    const page = Math.max(1, toInt(query.page, 1));
    const limit = Math.min(100, Math.max(1, toInt(query.limit, 25)));
    const filter = {};
    if (query.manufacturerId) {
      filter.manufacturerId = String(query.manufacturerId);
    }

    const items = await Batch.find(filter)
      .select("-__v -_id")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return { items, page, limit };
  }

  async create(payload) {
    if (!payload?.batchId) {
      const err = new Error("batchId is required");
      err.status = 400;
      throw err;
    }
    const doc = await Batch.create({
      batchId: String(payload.batchId),
      manufacturerId: payload.manufacturerId ? String(payload.manufacturerId) : undefined,
      productId: payload.productId ? String(payload.productId) : undefined,
      name: payload.name ? String(payload.name) : undefined,
      size: payload.size ?? undefined,
      expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : undefined,
      status: payload.status ?? "active"
    });
    return { batchId: doc.batchId, status: doc.status };
  }

  async getById(batchId) {
    return Batch.findOne({ batchId: String(batchId) })
      .select("-__v -_id")
      .lean();
  }

  async confirmMint(batchId, payload = {}) {
    const batch = await Batch.findOne({ batchId: String(batchId) }).lean();
    if (!batch) {
      const err = new Error("Batch not found");
      err.status = 404;
      throw err;
    }

    const quantity = Number.parseInt(payload.quantity, 10);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      const err = new Error("quantity must be a positive number");
      err.status = 400;
      throw err;
    }

    const mintTxHash = payload.mintTxHash ? String(payload.mintTxHash) : null;
    if (!mintTxHash) {
      const err = new Error("mintTxHash is required");
      err.status = 400;
      throw err;
    }

    const companyName = payload.companyName ? String(payload.companyName) : null;
    if (!companyName) {
      const err = new Error("companyName is required");
      err.status = 400;
      throw err;
    }

    const expiryDate = batch.expiresAt
      ? new Date(batch.expiresAt).toISOString().slice(0, 10)
      : "";

    const hashes = [];
    let insertedTotal = 0;
    const chunkSize = 1000;

    for (let offset = 0; offset < quantity; offset += chunkSize) {
      const size = Math.min(chunkSize, quantity - offset);
      const batchDocs = [];

      for (let i = 0; i < size; i += 1) {
        const serialNo = offset + i + 1;
        const bottleId = `${batchId}-${serialNo}-${securityService.generateId("btl")}`;
        const tokenPlain = `${companyName}|${batchId}|${expiryDate}|${serialNo}`;
        const qrTokenHash = securityService.hash(tokenPlain);
        hashes.push(qrTokenHash);
        batchDocs.push({
          bottleId,
          batchId: String(batchId),
          qrTokenHash,
          state: "active"
        });
      }

      const { inserted } = await bottleService.bulkCreate(batchDocs);
      insertedTotal += inserted;
    }

    const merkleRoot = await merkleService.buildRoot(hashes);

    await Batch.updateOne(
      { batchId: String(batchId) },
      {
        $set: {
          status: "minted",
          mintedAt: new Date(),
          merkleRoot: merkleRoot.root,
          mintTxHash
        },
        $inc: { bottleCount: insertedTotal }
      }
    );

    return { inserted: insertedTotal, merkleRoot: merkleRoot.root };
  }
}

export const batchService = new BatchService();
