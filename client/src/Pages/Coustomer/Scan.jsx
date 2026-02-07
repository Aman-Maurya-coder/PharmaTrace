import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ScanPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      },
      false
    );

    scanner.render(
      (decodedText) => {
        scanner.clear();
        navigate("/result", { state: { batchId: decodedText } });
      },
      (error) => {
        // silent fail (industry standard)
      }
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, []);

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

        <div
          id="reader"
          className="mt-8 rounded-xl overflow-hidden border"
        />
      </div>
    </div>
  );
}
