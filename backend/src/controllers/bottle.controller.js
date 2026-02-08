import { bottleService } from "../services/bottle.service.js";

class BottleController {
  async list(req, res, next) {
    try {
      const result = await bottleService.list(req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const result = await bottleService.create(req.body, req.user);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const result = await bottleService.getById(req.params.bottleId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const bottleController = new BottleController();
