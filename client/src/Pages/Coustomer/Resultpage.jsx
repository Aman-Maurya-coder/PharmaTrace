import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function ResultPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    // Simulate blockchain verification
    setTimeout(() => {
      if (state?.batchId === "BATCH-2023-XJ9") {
        setStatus("success");
      } else {
        setStatus("error");
      }
    }, 1500);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center
      bg-linear-to-br from-[#EEF2FF] via-[#FDF2F8] to-[#ECFEFF] px-6">

      <div className="w-full max-w-xl bg-white/70
        backdrop-blur-xl rounded-2xl shadow-xl p-8 text-center">

        {status === "loading" && (
          <>
            <p className="text-lg font-medium text-slate-700">
              Verifying on blockchain…
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="text-green-600 text-5xl">✔</div>
            <h2 className="mt-4 text-xl font-bold">
              Authentic Medicine
            </h2>
            <p className="text-slate-600 mt-2">
              Batch verified successfully on blockchain.
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="text-red-600 text-5xl">✖</div>
            <h2 className="mt-4 text-xl font-bold">
              Counterfeit Detected
            </h2>
            <p className="text-slate-600 mt-2">
              Batch ID not found in registry.
            </p>
          </>
        )}

        <button
          onClick={() => navigate("/scan")}
          className="mt-6 px-6 py-3 rounded-full
          bg-blue-600 text-white">
          Scan Another
        </button>
      </div>
    </div>
  );
}

