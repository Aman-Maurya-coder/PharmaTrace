import { batchService } from "../services/batch.service.js";

class BatchController {
  async list(req, res, next) {
    try {
      const result = await batchService.list(req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const result = await batchService.create(req.body, req.user);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const result = await batchService.getById(req.params.batchId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async confirmMint(req, res, next) {
    try {
      const result = await batchService.confirmMint(req.params.batchId, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const batchController = new BatchController();
