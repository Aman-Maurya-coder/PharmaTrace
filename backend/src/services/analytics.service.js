import { Batch } from "../models/batch.model.js";

class AnalyticsService {
  async getSummary() {
    const totalBatches = await Batch.countDocuments();
    const result = await Batch.aggregate([
      { $group: { _id: null, totalBottles: { $sum: "$bottleCount" } } }
    ]);
    return { totalBatches, totalBottles: result[0]?.totalBottles ?? 0 };
  }

  async getManufacturerOverview(query = {}) {
    const match = {};
    if (query.manufacturerId) {
      match.manufacturerId = String(query.manufacturerId);
    }
    if (query.from || query.to) {
      match.createdAt = {};
      if (query.from) {
        match.createdAt.$gte = new Date(query.from);
      }
      if (query.to) {
        match.createdAt.$lte = new Date(query.to);
      }
    }

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: "$manufacturerId",
          batchCount: { $sum: 1 },
          bottleCount: { $sum: "$bottleCount" }
        }
      }
    ];

    return Batch.aggregate(pipeline);
  }
}

export const analyticsService = new AnalyticsService();
