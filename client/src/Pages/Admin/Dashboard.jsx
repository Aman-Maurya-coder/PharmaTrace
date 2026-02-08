import { motion } from "framer-motion";
import {
  FaLayerGroup,
  FaBoxOpen,
  FaExclamationTriangle,
  FaCheckCircle,
  FaPlus,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Components/Sidebar";

const stats = [
  {
    title: "Total Batches Minted",
    value: "128",
    icon: <FaLayerGroup size={24} />,
    color: "bg-blue-500",
  },
  {
    title: "Active Products",
    value: "64",
    icon: <FaBoxOpen size={24} />,
    color: "bg-green-500",
  },
  {
    title: "Recalled Products",
    value: "8",
    icon: <FaExclamationTriangle size={24} />,
    color: "bg-red-500",
  },
  {
    title: "Total Verifications",
    value: "2,340",
    icon: <FaCheckCircle size={24} />,
    color: "bg-purple-500",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <Sidebar>
      {/* TOP BAR */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          Dashboard Overview
        </h1>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/admin/create-batch")}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md"
        >
          <FaPlus />
          Create New Batch
        </motion.button>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            whileHover={{ y: -5 }}
            className="bg-white p-5 rounded-xl shadow-md flex items-center gap-4"
          >
            <div
              className={`${stat.color} text-white p-3 rounded-lg flex items-center justify-center`}
            >
              {stat.icon}
            </div>

            <div>
              <p className="text-gray-500 text-sm">{stat.title}</p>
              <h2 className="text-2xl font-bold text-gray-800">
                {stat.value}
              </h2>
            </div>
          </motion.div>
        ))}
      </div>
    </Sidebar>
  );
}
