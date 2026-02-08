class BlockchainService {
  async getNetworkStatus() {
    return { connected: false };
  }
}

export const blockchainService = new BlockchainService();
