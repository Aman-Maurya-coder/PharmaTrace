import { Bottle } from "../models/bottle.model.js";

const toInt = (value, fallback) => {
  const num = Number.parseInt(value, 10);
  return Number.isNaN(num) ? fallback : num;
};

class BottleService {
  async list(query = {}) {
    const page = Math.max(1, toInt(query.page, 1));
    const limit = Math.min(100, Math.max(1, toInt(query.limit, 25)));
    const filter = {};
    if (query.batchId) {
      filter.batchId = String(query.batchId);
    }
    if (query.state) {
      filter.state = String(query.state);
    }

    const items = await Bottle.find(filter)
      .select("-__v -_id")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return { items, page, limit };
  }

  async create(payload) {
    if (!payload?.bottleId || !payload?.batchId || !payload?.qrTokenHash) {
      const err = new Error("bottleId, batchId, and qrTokenHash are required");
      err.status = 400;
      throw err;
    }
    const doc = await Bottle.create({
      bottleId: String(payload.bottleId),
      batchId: String(payload.batchId),
      qrTokenHash: String(payload.qrTokenHash),
      state: payload.state ?? "active",
      manufacturedAt: payload.manufacturedAt ?? undefined
    });
    return { bottleId: doc.bottleId, batchId: doc.batchId, state: doc.state };
  }

  async getById(bottleId) {
    const doc = await Bottle.findOne({ bottleId: String(bottleId) })
      .select("-__v -_id")
      .lean();
    return doc;
  }

  async bulkCreate(bottles) {
    if (!Array.isArray(bottles) || bottles.length === 0) {
      return { inserted: 0 };
    }
    const docs = bottles.map((item) => ({
      bottleId: String(item.bottleId),
      batchId: String(item.batchId),
      qrTokenHash: String(item.qrTokenHash),
      state: item.state ?? "active",
      manufacturedAt: item.manufacturedAt ?? undefined
    }));
    const result = await Bottle.insertMany(docs, { ordered: false });
    return { inserted: result.length };
  }

  async transitionState(bottleId, fromState, toState, extra = {}) {
    const update = {
      $set: {
        state: toState,
        ...extra
      }
    };
    const doc = await Bottle.findOneAndUpdate(
      { bottleId: String(bottleId), state: fromState },
      update,
      { new: true }
    )
      .select("-__v -_id")
      .lean();
    return doc;
  }
}

export const bottleService = new BottleService();
