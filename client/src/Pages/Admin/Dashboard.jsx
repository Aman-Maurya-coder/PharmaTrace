import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  FaLayerGroup,
  FaBoxOpen,
  FaExclamationTriangle,
  FaCheckCircle,
  FaPills,
  FaFingerprint,
  FaRecycle,
  FaChartLine,
  FaArrowUp,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Components/Sidebar";
import { getGeoAnalytics, getManufacturerOverview } from "../../services/api";

const defaultData = {
  numberOfMedicines: 0,
  totalMedicineCount: 0,
  totalQRScans: 0,
  uniqueMedicines: 0,
  duplicateScanAttempts: 0,
  confirmedCounterfeits: 0,
  returnedMedicines: 0,
  restockedMedicines: 0,
  monthSeries: [],
  sources: { verified: 0, suspicious: 0, manual: 0 },
};

const topCards = [
  {
    title: "Number of Medicines",
    valueKey: "numberOfMedicines",
    icon: <FaPills size={24} />,
    gradient: "from-pink-500 via-rose-500 to-orange-400",
    change: "+12%",
  },
  {
    title: "Total Medicine Count",
    valueKey: "totalMedicineCount",
    icon: <FaBoxOpen size={24} />,
    gradient: "from-indigo-600 via-cyan-500 to-teal-400",
    change: "+8%",
  },
  {
    title: "Total QR Scans",
    valueKey: "totalQRScans",
    icon: <FaQrcode size={24} />,
    gradient: "from-green-500 via-emerald-400 to-lime-400",
    change: "+24%",
  },
  {
    title: "Unique Medicines",
    valueKey: "uniqueMedicines",
    icon: <FaFingerprint size={24} />,
    gradient: "from-violet-600 via-purple-500 to-fuchsia-500",
    change: "+15%",
  },
];

const lowerCards = [
  {
    title: "Duplicate Scan Attempts",
    valueKey: "duplicateScanAttempts",
    icon: <FaExclamationTriangle size={20} />,
    gradient: "from-red-500 to-rose-600",
    textColor: "text-red-600",
  },
  {
    title: "Confirmed Counterfeits",
    valueKey: "confirmedCounterfeits",
    icon: <FaCheckCircle size={20} />,
    gradient: "from-purple-500 to-purple-700",
    textColor: "text-purple-600",
  },
  {
    title: "Returned Medicines",
    valueKey: "returnedMedicines",
    icon: <FaRedoAlt size={20} />,
    gradient: "from-amber-500 to-orange-600",
    textColor: "text-amber-600",
  },
  {
    title: "Restocked Medicines",
    valueKey: "restockedMedicines",
    icon: <FaRecycle size={20} />,
    gradient: "from-green-500 to-emerald-600",
    textColor: "text-green-600",
  },
];

function MiniColumnChart({ series = [] }) {
  const max = Math.max(...series, 1);
  return (
    <div className="w-full h-32 px-2">
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full">
        <defs>
          <linearGradient id="gradBar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {series.map((v, i) => {
          const barWidth = 100 / series.length;
          const height = (v / max) * 36;
          const x = i * barWidth;
          const y = 40 - height;
          return (
            <g key={i}>
              <rect
                x={`${x + 1.5}%`}
                y={y}
                width={`${barWidth - 3}%`}
                height={height}
                rx="2"
                fill="url(#gradBar)"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Donut({ parts = {} }) {
  const total = Object.values(parts).reduce((a, b) => a + b, 0) || 1;
  const pct = (n) => Math.round((n / total) * 100);
  const v = pct(parts.verified);
  const s = pct(parts.suspicious);
  const m = pct(parts.manual);
  const gradient = `conic-gradient(#06b6d4 0% ${v}%, #f97316 ${v}% ${v + s}%, #a78bfa ${v + s}% 100%)`;

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="rounded-full w-32 h-32 shadow-lg flex items-center justify-center relative"
        style={{ background: gradient }}
      >
        <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">{v}%</div>
            <div className="text-xs text-gray-500">Verified</div>
          </div>
        </div>
      </div>

      <div className="w-full space-y-2 text-sm">
        <div className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-sm" />
            <span className="text-gray-700 font-medium">Verified</span>
          </div>
          <span className="text-gray-600 font-semibold">{v}%</span>
        </div>
        <div className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-400 shadow-sm" />
            <span className="text-gray-700 font-medium">Suspicious</span>
          </div>
          <span className="text-gray-600 font-semibold">{s}%</span>
        </div>
        <div className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-400 shadow-sm" />
            <span className="text-gray-700 font-medium">Manual</span>
          </div>
          <span className="text-gray-600 font-semibold">{m}%</span>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(defaultData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        const [overview, geo] = await Promise.all([
          getManufacturerOverview(),
          getGeoAnalytics(),
        ]);

        if (!mounted) return;

        const monthSeries =
          overview?.monthSeries ||
          overview?.scanSeries ||
          overview?.monthlyScans ||
          [];

        const sources = overview?.sources || geo?.sources || {
          verified: geo?.verified ?? 0,
          suspicious: geo?.suspicious ?? 0,
          manual: geo?.manual ?? 0,
        };

        setData({
          numberOfMedicines:
            overview?.numberOfMedicines ?? overview?.totalBatches ?? 0,
          totalMedicineCount:
            overview?.totalMedicineCount ?? overview?.totalUnits ?? 0,
          totalQRScans:
            overview?.totalQRScans ?? overview?.totalScans ?? 0,
          uniqueMedicines:
            overview?.uniqueMedicines ?? overview?.uniqueBatches ?? 0,
          duplicateScanAttempts:
            overview?.duplicateScanAttempts ?? overview?.duplicateScans ?? 0,
          confirmedCounterfeits:
            overview?.confirmedCounterfeits ?? overview?.counterfeitCount ?? 0,
          returnedMedicines:
            overview?.returnedMedicines ?? overview?.returns ?? 0,
          restockedMedicines:
            overview?.restockedMedicines ?? overview?.restocks ?? 0,
          monthSeries: Array.isArray(monthSeries) ? monthSeries : [],
          sources,
        });
      } catch (err) {
        if (!mounted) return;
        setError(err.message || "Failed to load dashboard data.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Sidebar>
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* ===== MODERN HEADER ===== */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent">
                  Dashboard Overview
                </h1>
                <div className="h-1.5 w-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 rounded-full mt-3 shadow-sm" />
                <p className="text-gray-600 mt-3 text-base">
                  Supply chain & anti-counterfeit analytics
                </p>
                {loading && (
                  <p className="text-xs text-gray-500 mt-2">Loading data…</p>
                )}
                {error && (
                  <p className="text-xs text-rose-600 mt-2">{error}</p>
                )}
              </div>

            </div>
          </motion.div>

          {/* ===== TOP GRADIENT CARDS ===== */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {topCards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative overflow-hidden rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer"
              >
                {/* Gradient Background - ALWAYS VISIBLE */}
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient}`} />

                {/* Animated gradient overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-tr ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                {/* Shine effect */}
                <div className="absolute -inset-1 bg-white/10 blur-xl group-hover:bg-white/20 transition-all duration-500" />

                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 group-hover:bg-white/30 transition-all duration-300">
                      {card.icon}
                    </div>
                    <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold">
                      <FaArrowUp size={10} />
                      {card.change}
                    </div>
                  </div>

                  <p className="text-sm font-medium opacity-90 mb-2">{card.title}</p>
                  <h2 className="text-3xl sm:text-4xl font-bold drop-shadow-lg">
                    {String(data[card.valueKey]).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  </h2>
                </div>

                {/* Decorative element */}
                <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-2xl group-hover:scale-150 transition-transform duration-700" />
              </motion.div>
            ))}
          </section>

          {/* ===== LOWER SECTION ===== */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">

              {/* Small stat cards - IMPROVED */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {lowerCards.map((c, index) => (
                  <motion.div
                    key={c.title}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    className="relative overflow-hidden bg-white rounded-2xl p-5 shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer border border-gray-100"
                  >
                    {/* Gradient accent bar */}
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${c.gradient}`} />

                    <div className="flex items-center gap-4">
                      <div className={`relative p-4 rounded-xl bg-gradient-to-br ${c.gradient} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        {c.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">{c.title}</p>
                        <div className="flex items-baseline gap-2">
                          <div className={`text-2xl font-bold ${c.textColor}`}>
                            {String(data[c.valueKey]).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                          </div>
                          <span className="text-xs text-gray-400">this month</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Activity Chart - IMPROVED */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FaChartLine className="text-indigo-600" />
                      <h3 className="text-xl font-bold text-gray-800">
                        Scan Activity
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500">
                      Monthly trends in scans and verifications
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-indigo-50 to-cyan-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-600 mb-1">Total Scans</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                      {data.totalQRScans}
                    </p>
                  </div>
                </div>

                <MiniColumnChart series={data.monthSeries} />

                <div className="flex justify-between mt-4 text-xs text-gray-500">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                  <span>Jul</span>
                  <span>Aug</span>
                </div>
              </motion.div>
            </div>

            {/* Right column - IMPROVED */}
            <div className="space-y-6">
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
              >
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-lg font-bold text-gray-800">Traffic Sources</h4>
                  <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Live
                  </span>
                </div>

                <Donut parts={data.sources} />
              </motion.div>
            </div>
          </section>
        </div>
      </main>
    </Sidebar>
  );
}