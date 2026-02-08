import { ScanLog } from "../models/ScanLog.model.js";

class GeoService {
  async getGeoOverview(query = {}) {
    if (query.lng === undefined || query.lat === undefined) {
      const err = new Error("lat and lng are required");
      err.status = 400;
      throw err;
    }

    const lng = Number.parseFloat(query.lng);
    const lat = Number.parseFloat(query.lat);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
      const err = new Error("lat and lng must be valid numbers");
      err.status = 400;
      throw err;
    }
    const distance = Number.parseInt(query.distance ?? 5000, 10);

    const matchStage = {};
    if (query.from || query.to) {
      matchStage.timestamp = {};
      if (query.from) {
        matchStage.timestamp.$gte = new Date(query.from);
      }
      if (query.to) {
        matchStage.timestamp.$lte = new Date(query.to);
      }
    }

    const pipeline = [
      {
        $geoNear: {
          near: { type: "Point", coordinates: [lng, lat] },
          distanceField: "dist",
          maxDistance: distance,
          spherical: true
        }
      },
      ...(Object.keys(matchStage).length ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: "$qrTokenHash",
          count: { $sum: 1 },
          lastSeenAt: { $max: "$timestamp" }
        }
      }
    ];

    return ScanLog.aggregate(pipeline);
  }
}

export const geoService = new GeoService();
