import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Result() {
  const { state } = useLocation(); // { batchId }
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); 
  // loading | success | error

  useEffect(() => {
    // Simulate blockchain verification (replace with contract call later)
    const timer = setTimeout(() => {
      if (state?.batchId === "BATCH-2023-XJ9") {
        setStatus("success");
      } else {
        setStatus("error");
      }
    }, 1400);

    return () => clearTimeout(timer);
  }, [state]);

  return (
    <div className="min-h-screen flex items-center justify-center
      bg-linear-to-br from-[#EEF2FF] via-[#FDF2F8] to-[#ECFEFF] px-6">

      <div className="w-full max-w-xl bg-white/70 backdrop-blur-xl
        rounded-2xl shadow-xl p-8 text-center">

        {/* Loading */}
        {status === "loading" && (
          <>
            <div className="mx-auto h-14 w-14 rounded-full border-4
              border-blue-200 border-t-blue-600 animate-spin" />
            <p className="mt-4 text-lg font-medium text-slate-700">
              Verifying on blockchain…
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Please wait a moment
            </p>
          </>
        )}

        {/* Success */}
        {status === "success" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center
              justify-center rounded-full bg-green-50 text-green-600 text-4xl">
              ✔
            </div>
            <h2 className="mt-4 text-2xl font-bold text-slate-900">
              Authentic Medicine
            </h2>
            <p className="mt-2 text-slate-600">
              This batch was successfully verified on the blockchain.
            </p>

            <div className="mt-6 rounded-xl border border-slate-200 p-4 text-left">
              <p className="text-sm text-slate-500">Batch ID</p>
              <p className="font-medium text-slate-900">
                {state?.batchId}
              </p>
            </div>
          </>
        )}

        {/* Error */}
        {status === "error" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center
              justify-center rounded-full bg-red-50 text-red-600 text-4xl">
              ✖
            </div>
            <h2 className="mt-4 text-2xl font-bold text-slate-900">
              Counterfeit Detected
            </h2>
            <p className="mt-2 text-slate-600">
              This batch ID does not exist in the registry.
            </p>

            <div className="mt-6 rounded-xl border border-slate-200 p-4 text-left">
              <p className="text-sm text-slate-500">Scanned Batch ID</p>
              <p className="font-medium text-slate-900">
                {state?.batchId ?? "Unknown"}
              </p>
            </div>
          </>
        )}

        {/* CTA */}
        <button
          onClick={() => navigate("/scan")}
          className="mt-8 w-full rounded-full bg-blue-600
          px-6 py-3 font-medium text-white hover:bg-blue-700 transition">
          Scan Another Medicine
        </button>
      </div>
    </div>
  );
}
