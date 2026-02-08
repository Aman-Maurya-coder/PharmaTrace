import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { claimMedicine, verifyQrToken } from "../../services/api";

export default function Result() {
  const { state } = useLocation(); // { batchId }
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [verificationData, setVerificationData] = useState(null);
  const [claimStatus, setClaimStatus] = useState("idle");
  const [claimError, setClaimError] = useState("");
  const [isClaiming, setIsClaiming] = useState(false);
  // loading | success | error

  useEffect(() => {
    let mounted = true;

    async function verifyScannedToken() {
      const qrToken = state?.batchId;
      const preverifiedStatus = state?.verificationStatus;
      const preverifiedData = state?.verificationData;
      const preverifiedError = state?.errorMessage;

      if (preverifiedStatus) {
        if (!mounted) return;
        setVerificationData(preverifiedData || null);
        setStatus(preverifiedStatus === "error" ? "error" : "success");
        if (preverifiedStatus === "error") {
          setErrorMessage(preverifiedError || "Failed to verify QR token.");
        }
        return;
      }

      if (!qrToken) {
        if (mounted) {
          setStatus("error");
          setErrorMessage("No QR token found in scan payload.");
        }
        return;
      }

      try {
        const data = await verifyQrToken(qrToken);
        if (!mounted) return;

        setVerificationData(data);

        const isInvalid =
          data?.valid === false ||
          data?.isAuthentic === false ||
          data?.authentic === false ||
          String(data?.status || "").toLowerCase() === "counterfeit";

        setStatus(isInvalid ? "error" : "success");
      } catch (error) {
        if (!mounted) return;
        setStatus("error");
        setErrorMessage(error.message || "Failed to verify QR token.");
      }
    }

    verifyScannedToken();

    return () => {
      mounted = false;
    };
  }, [state]);

  async function handleClaim() {
    const qrToken = state?.batchId;
    if (!qrToken) {
      setClaimStatus("error");
      setClaimError("No QR token available to claim.");
      return;
    }

    setIsClaiming(true);
    setClaimError("");

    try {
      const result = await claimMedicine(qrToken);
      const claimed = Boolean(result?.claimed ?? result?.state === "claimed");
      setClaimStatus(claimed ? "success" : "error");
      if (!claimed) {
        setClaimError(result?.reason || "Unable to claim this medicine.");
      }
    } catch (error) {
      setClaimStatus("error");
      setClaimError(error.message || "Failed to claim medicine.");
    } finally {
      setIsClaiming(false);
    }
  }

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

            {verificationData && (
              <div className="mt-3 rounded-xl border border-slate-200 p-4 text-left">
                <p className="text-sm text-slate-500">Verification Source</p>
                <p className="font-medium text-slate-900">Backend API</p>
              </div>
            )}

            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-left">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-emerald-800">Claim this medicine</p>
                  <p className="text-xs text-emerald-700">
                    Mark as claimed to prevent duplicate validations.
                  </p>
                </div>
                <button
                  onClick={handleClaim}
                  disabled={isClaiming || claimStatus === "success"}
                  className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {claimStatus === "success"
                    ? "Claimed"
                    : isClaiming
                    ? "Claiming..."
                    : "Claim Medicine"}
                </button>
              </div>

              {claimStatus === "success" && (
                <p className="mt-3 text-xs text-emerald-700">
                  Medicine successfully claimed.
                </p>
              )}
              {claimStatus === "error" && claimError && (
                <p className="mt-3 text-xs text-rose-700">{claimError}</p>
              )}
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
              {errorMessage || "This batch ID does not exist in the registry."}
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
