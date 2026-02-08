import axios from "axios";

// Configure axios defaults
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add JWT token to requests if available
// Falls back to VITE_API_TOKEN for local dev when no auth flow is present.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken") || import.meta.env.VITE_API_TOKEN;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============================================
// BATCH ENDPOINTS
// ============================================

/**
 * Step 1: Create a new batch on the backend
 * Backend generates bottles, QR codes, and merkle root
 * Returns batchId and status READY_TO_MINT
 */
export const createBatch = async (batchData) => {
  const response = await api.post("/batches", {
    productName: batchData.productName,
    batchId: batchData.batchId,
    mfgDate: batchData.mfgDate,
    expiryDate: batchData.expiryDate,
    quantity: batchData.quantity,
    disableScanAfterExpiry: batchData.disableScanAfterExpiry,
    maxValidations: batchData.maxValidations,
    claimMode: batchData.claimMode,
    resetAllowed: batchData.resetAllowed,
    resetWindow: batchData.resetWindow,
    maxResets: batchData.maxResets,
    market: batchData.market,
    mrp: batchData.mrp,
    description: batchData.description,
  });
  return response.data;
};

/**
 * Step 3: Confirm blockchain mint with backend
 * Send the transaction hash after successful blockchain mint
 */
export const confirmBatchMint = async (batchId, txHash) => {
  const response = await api.post(`/batches/${batchId}/confirm-mint`, {
    txHash,
  });
  return response.data;
};

/**
 * Get batch details by ID
 */
export const getBatchById = async (batchId) => {
  const response = await api.get(`/batches/${batchId}`);
  return response.data;
};

/**
 * List all batches
 */
export const listBatches = async (params = {}) => {
  const response = await api.get("/batches", { params });
  return response.data;
};

/**
 * Download QR codes package for a batch
 */
export const downloadQRPackage = async (batchId) => {
  const response = await api.get(`/batches/${batchId}/qr-package`, {
    responseType: "blob",
  });
  return response.data;
};

// ============================================
// ANALYTICS ENDPOINTS
// ============================================

/**
 * Get manufacturer overview analytics
 * @returns {Promise} Overview analytics data
 */
export const getManufacturerOverview = async () => {
  const response = await api.get("/analytics/manufacturer/overview");
  return response.data;
};

/**
 * Get geographic analytics data
 * @returns {Promise} Geographic analytics data
 */
export const getGeoAnalytics = async () => {
  const response = await api.get("/analytics/geo");
  return response.data;
};

// ============================================
// MEDICINE VALIDATION ENDPOINTS
// ============================================

/**
 * Verify QR token (bottle/medicine validation)
 * @param {string} qrToken - The QR code token to verify
 * @returns {Promise} Verification data
 */
export const verifyQrToken = async (qrToken) => {
  const response = await api.post("/scan/validate", { qrToken });
  return response.data;
};

export const validateMedicine = (medicineHash) =>
  api.post("/scan/validate", { medicineHash });

export const claimMedicine = (medicineHash) =>
  api.post("/scan/claim", { medicineHash });
