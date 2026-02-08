import { Scanner } from "@yudiel/react-qr-scanner";
import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { verifyQrToken } from "../../services/api";

export default function Scan() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [manualToken, setManualToken] = useState("");
  const [lastToken, setLastToken] = useState("");
  const [history, setHistory] = useState([]);
  const lastScanRef = useRef({ value: "", time: 0 });

  async function handleVerify(token, source = "scan") {
    if (!token) {
      setStatus("error");
      setErrorMessage("No QR token detected. Please try again.");
      return;
    }

    setStatus("verifying");
    setErrorMessage("");

    try {
      const data = await verifyQrToken(token);
      setLastToken(token);
      setHistory((prev) => [
        { token, source, time: new Date().toISOString(), status: "success" },
        ...prev,
      ].slice(0, 5));

      navigate("/result", {
        state: {
          batchId: token,
          verificationData: data,
          verificationStatus: "success",
        },
      });
    } catch (error) {
      const message = error.message || "Failed to verify QR token.";
      setErrorMessage(message);
      setLastToken(token);
      setHistory((prev) => [
        { token, source, time: new Date().toISOString(), status: "error" },
        ...prev,
      ].slice(0, 5));

      navigate("/result", {
        state: {
          batchId: token,
          verificationStatus: "error",
          errorMessage: message,
        },
      });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#eef2ff] to-[#e0f2fe] px-4 sm:px-6 lg:px-10 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
            PharmaTrace Consumer Verification
          </p>
          <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900">
            Scan & Verify Medicine
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600">
            Point your camera at the QR code to check authenticity in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/70 shadow-xl p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Live Scanner</h2>
                <p className="text-xs text-slate-500">Center the QR inside the frame</p>
              </div>
              <div className="text-xs rounded-full px-3 py-1 border border-slate-200 bg-slate-50 text-slate-600">
                {status === "verifying" ? "Verifying..." : "Ready"}
              </div>
            </div>

            <div className="mt-4 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 relative">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute left-3 top-3 h-8 w-8 border-l-2 border-t-2 border-emerald-400" />
                <div className="absolute right-3 top-3 h-8 w-8 border-r-2 border-t-2 border-emerald-400" />
                <div className="absolute left-3 bottom-3 h-8 w-8 border-l-2 border-b-2 border-emerald-400" />
                <div className="absolute right-3 bottom-3 h-8 w-8 border-r-2 border-b-2 border-emerald-400" />
              </div>

              <Scanner
                constraints={{ facingMode: "environment" }}
                onScan={(result) => {
                  const token = result?.[0]?.rawValue;
                  if (!token) return;

                  const now = Date.now();
                  if (
                    lastScanRef.current.value === token &&
                    now - lastScanRef.current.time < 3000
                  ) {
                    return;
                  }

                  lastScanRef.current = { value: token, time: now };
                  handleVerify(token, "scan");
                }}
                onError={(error) => {
                  setStatus("error");
                  setErrorMessage(error?.message || "Camera error");
                }}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs text-slate-500">Last detected</p>
                <p className="mt-1 text-sm font-semibold text-slate-900 truncate">
                  {lastToken || "No scan yet"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs text-slate-500">Status</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {status === "verifying" ? "Verifying..." : "Ready to scan"}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/70 shadow-xl p-5 sm:p-6">
              <h3 className="text-base font-semibold text-slate-900">Manual Verification</h3>
              <p className="text-xs text-slate-500 mt-1">
                Paste a QR token if your camera is unavailable.
              </p>
              <div className="mt-4 space-y-3">
                <input
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="Paste QR token here"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-300"
                />
                <button
                  type="button"
                  onClick={() => handleVerify(manualToken, "manual")}
                  className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
                >
                  Verify Token
                </button>
              </div>
              {status === "error" && errorMessage && (
                <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-700">
                  {errorMessage}
                </div>
              )}
            </div>

            <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/70 shadow-xl p-5 sm:p-6">
              <h3 className="text-base font-semibold text-slate-900">Recent Attempts</h3>
              <p className="text-xs text-slate-500 mt-1">Latest 5 scans</p>
              <div className="mt-4 space-y-2">
                {history.length === 0 ? (
                  <div className="text-xs text-slate-500">No attempts yet</div>
                ) : (
                  history.map((item, idx) => (
                    <div
                      key={`${item.token}-${idx}`}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2"
                    >
                      <div className="text-xs text-slate-700 truncate max-w-[180px]">
                        {item.token}
                      </div>
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-1 rounded-full ${
                          item.status === "success"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 sm:p-6 shadow-xl">
              <h3 className="text-base font-semibold">Scan Tips</h3>
              <ul className="mt-3 space-y-2 text-xs text-slate-200">
                <li>Use good lighting to avoid glare on the QR.</li>
                <li>Hold steady for 1-2 seconds.</li>
                <li>Make sure the QR is fully visible inside the frame.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
