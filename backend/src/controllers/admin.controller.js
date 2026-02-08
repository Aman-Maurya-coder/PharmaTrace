import { adminService } from "../services/admin.service.js";

class AdminController {
  async listUsers(req, res, next) {
    try {
      const result = await adminService.listUsers(req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async inviteUser(req, res, next) {
    try {
      const result = await adminService.inviteUser(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const adminController = new AdminController();
