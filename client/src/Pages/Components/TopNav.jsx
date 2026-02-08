import { useNavigate } from "react-router-dom";

export default function TopNav() {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-3 rounded-lg px-2 py-1 text-left transition hover:bg-slate-100"
          aria-label="Go to landing page"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-gradient-to-br from-emerald-100 to-cyan-100">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 2L15.5 8.5L22 10L17 15L18.5 22L12 18.5L5.5 22L7 15L2 10L8.5 8.5L12 2Z"
                stroke="#0f766e"
                strokeWidth="0.9"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold text-slate-900">PharmaTrace</span>
            <span className="block text-xs text-slate-500">Decentralized Verification</span>
          </span>
        </button>
      </div>
    </header>
  );
}
