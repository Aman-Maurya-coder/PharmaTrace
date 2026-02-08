import { motion } from "framer-motion";
import {
  FaThLarge,
  FaPlus,
  FaClipboardList,
  FaChartLine,
  FaCogs,
} from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";

/* 🔁 Change paths anytime */
const sidebarItems = [
  {
    name: "Dashboard",
    icon: <FaThLarge />,
    path: "/dashboard",
  },
  {
    name: "Create Batch",
    icon: <FaPlus />,
    path: "/admin/addProduct",
  },
  {
    name: "My Batches",
    icon: <FaClipboardList />,
    path: "/admin/productBatch",
  },
  // {
  //   name: "Analytics",
  //   icon: <FaChartLine />,
  //   path: "/admin/analytics",
  // },
  {
    name: "Settings",
    icon: <FaCogs />,
    path: "/admin/settings",
  },
];

export default function Sidebar({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* ================= SIDEBAR ================= */}
      <aside className="w-64 bg-white shadow-md hidden md:block">
        <div className="p-5 text-xl font-bold text-gray-800">
          Manufacturer Panel
        </div>

        <nav className="mt-4">
          {sidebarItems.map((item, index) => {
            const isActive = location.pathname === item.path;

            return (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-3 px-5 py-3 mx-3 my-2 
                  rounded-lg cursor-pointer transition
                  ${
                    isActive
                      ? "bg-blue-100 text-blue-600 font-semibold"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.name}</span>
              </motion.div>
            );
          })}
        </nav>
      </aside>

      {/* ================= PAGE CONTENT ================= */}
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}
