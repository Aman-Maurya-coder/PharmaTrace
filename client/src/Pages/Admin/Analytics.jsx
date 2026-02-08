import { useEffect, useState } from "react";
import Sidebar from "../Components/Sidebar";
import { getGeoAnalytics, getManufacturerOverview } from "../../services/api";

export default function Analytics() {
  const [overview, setOverview] = useState(null);
  const [geo, setGeo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadAnalytics() {
      try {
        const [overviewData, geoData] = await Promise.all([
          getManufacturerOverview(),
          getGeoAnalytics(),
        ]);

        if (!mounted) return;
        setOverview(overviewData);
        setGeo(geoData);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || "Failed to load analytics");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadAnalytics();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Sidebar>
      <div className="min-h-screen bg-gray-50 p-6 md:p-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-semibold text-gray-800">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manufacturer overview and geo analytics from backend APIs.
          </p>

          {loading && <p className="mt-6 text-sm text-gray-600">Loading analytics...</p>}
          {!loading && error && <p className="mt-6 text-sm text-red-600">{error}</p>}

          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">
                  GET /api/analytics/manufacturer/overview
                </h2>
                <pre className="text-xs bg-gray-50 rounded p-3 overflow-auto">
                  {JSON.stringify(overview, null, 2)}
                </pre>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">
                  GET /api/analytics/geo
                </h2>
                <pre className="text-xs bg-gray-50 rounded p-3 overflow-auto">
                  {JSON.stringify(geo, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </Sidebar>
  );
}
