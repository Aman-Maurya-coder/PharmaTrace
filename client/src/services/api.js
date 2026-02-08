const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

async function request(path, options = {}) {
  const { method = "GET", body, headers = {}, responseType = "json" } = options;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      message = errorData?.message || errorData?.error || message;
    } catch {
      // Ignore JSON parse errors for non-JSON responses.
    }
    throw new Error(message);
  }

  if (responseType === "blob") {
    return response.blob();
  }
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function verifyQrToken(qrToken) {
  return request(`/api/verify/${encodeURIComponent(qrToken)}`);
}

export function createBatch(payload) {
  return request("/api/batches", { method: "POST", body: payload });
}

export function confirmBatchMint(batchId, payload) {
  return request(`/api/batches/${encodeURIComponent(batchId)}/confirm-mint`, {
    method: "POST",
    body: payload,
  });
}

export function exportBatchManifest(batchId) {
  return request(`/api/batches/${encodeURIComponent(batchId)}/export/manifest`);
}

export function exportBatchQrZip(batchId) {
  return request(`/api/batches/${encodeURIComponent(batchId)}/export/qr-zip`, {
    responseType: "blob",
  });
}

export function claimBottle(bottleId, payload) {
  return request(`/api/bottles/${encodeURIComponent(bottleId)}/claim`, {
    method: "POST",
    body: payload,
  });
}

export function requestBottleReset(bottleId, payload) {
  return request(`/api/bottles/${encodeURIComponent(bottleId)}/reset-request`, {
    method: "POST",
    body: payload,
  });
}

export function approveBottleReset(bottleId, payload) {
  return request(`/api/bottles/${encodeURIComponent(bottleId)}/reset-approve`, {
    method: "POST",
    body: payload,
  });
}

export function getManufacturerOverview() {
  return request("/api/analytics/manufacturer/overview");
}

export function getGeoAnalytics() {
  return request("/api/analytics/geo");
}
