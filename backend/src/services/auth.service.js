import { securityService } from "./security.service.js";

class AuthService {
  async register(payload) {
    const id = securityService.generateId("user");
    return { id, provider: "clerk", profile: payload ?? {} };
  }

  async login(payload) {
    return { provider: "clerk", session: payload ?? {} };
  }

  async getProfile(user) {
    return { user: user ?? null };
  }
}

export const authService = new AuthService();
