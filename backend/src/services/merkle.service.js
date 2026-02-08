import { securityService } from "./security.service.js";

class MerkleService {
  async buildRoot(items = []) {
    const payload = Array.isArray(items) ? items.join("") : "";
    const root = payload ? securityService.hash(payload) : "";
    return { root, count: Array.isArray(items) ? items.length : 0 };
  }
}

export const merkleService = new MerkleService();
