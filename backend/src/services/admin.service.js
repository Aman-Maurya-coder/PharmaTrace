class AdminService {
  async listUsers() {
    return { items: [] };
  }

  async inviteUser(payload) {
    return { invited: true, payload };
  }
}

export const adminService = new AdminService();
