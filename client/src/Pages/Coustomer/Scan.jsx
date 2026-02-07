import { Scanner } from "@yudiel/react-qr-scanner";
import { useNavigate } from "react-router-dom";

export default function Scan() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center
      bg-linear-to-br from-[#EEF2FF] via-[#FDF2F8] to-[#ECFEFF] px-6">

      <div className="w-full max-w-4xl rounded-3xl bg-white/60
        backdrop-blur-xl shadow-xl p-10">

        <h1 className="text-3xl font-bold text-slate-900">
          Scan Medicine QR Code
        </h1>

        <p className="mt-2 text-slate-600">
          Align the QR code inside the frame.
        </p>

        <div className="mt-8 rounded-xl overflow-hidden border">
          <Scanner
            constraints={{ facingMode: "environment" }}
            onScan={(result) => {
              if (result?.[0]?.rawValue) {
                navigate("/result", {
                  state: { batchId: result[0].rawValue },
                });
              }
            }}
            onError={(error) => console.error(error)}
          />
        </div>
      </div>
    </div>
  );
}
