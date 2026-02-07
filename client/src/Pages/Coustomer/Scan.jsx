import { QrReader } from "react-qr-reader";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function ScanPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center
      bg-linear-to-br from-[#EEF2FF] via-[#FDF2F8] to-[#ECFEFF] px-6">

      <div className="w-full max-w-4xl rounded-3xl bg-white/60
        backdrop-blur-xl shadow-xl p-10">

        <h1 className="text-3xl font-bold text-slate-900">
          Scan Medicine QR Code
        </h1>

        <p className="mt-2 text-slate-600">
          Align the QR code within the frame to verify authenticity.
        </p>

        <div className="mt-8 rounded-xl overflow-hidden border">
          <QrReader
            constraints={{ facingMode: "environment" }}
            scanDelay={500}
            onResult={(result, err) => {
              if (!!result) {
                navigate("/result", {
                  state: { batchId: result?.text },
                });
              }
              if (!!err) {
                setError("Camera permission required");
              }
            }}
            style={{ width: "100%" }}
          />
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
