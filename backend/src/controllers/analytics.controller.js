import { analyticsService } from "../services/analytics.service.js";
import { geoService } from "../services/geo.service.js";

class AnalyticsController {
  async summary(req, res, next) {
    try {
      const result = await analyticsService.getSummary(req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async manufacturerOverview(req, res, next) {
    try {
      const result = await analyticsService.getManufacturerOverview(req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async geo(req, res, next) {
    try {
      const result = await geoService.getGeoOverview(req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const analyticsController = new AnalyticsController();
