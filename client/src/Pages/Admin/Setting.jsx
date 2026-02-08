import { useState } from "react";
import { motion } from "framer-motion";
import {
    FaBuilding,
    FaWallet,
    FaNetworkWired,
    FaBell,
    FaCode,
} from "react-icons/fa";
import { useUser } from "@clerk/clerk-react";
import Sidebar from "../Components/Sidebar";

/* ---------------- TAB CONFIG ---------------- */
const tabs = [
    { id: "company", label: "Company Profile", icon: <FaBuilding /> },
    { id: "wallet", label: "Connected Wallet", icon: <FaWallet /> },
    { id: "network", label: "Network Settings", icon: <FaNetworkWired /> },
    { id: "notifications", label: "Notifications", icon: <FaBell /> },
    { id: "developer", label: "Developer Panel", icon: <FaCode /> },
];

export default function Settings() {
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState("company");
    const [network, setNetwork] = useState("sepolia");

    return (
        <Sidebar>
            <div className="bg-white rounded-xl shadow-md p-6">
                <h1 className="text-2xl font-semibold mb-6">Settings</h1>

                {/* ---------------- TABS ---------------- */}
                <div className="flex gap-3 border-b mb-6 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition
                ${activeTab === tab.id
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-800"
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ---------------- CONTENT ---------------- */}
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                >
                    {activeTab === "company" && (
                        <div className="space-y-4 max-w-xl">
                            <div>
                                <label className="text-sm font-medium">Company Name</label>
                                <input
                                    className="w-full mt-1 p-2 border rounded-lg"
                                    placeholder="Your Company Name"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Email (Clerk)</label>
                                <input
                                    className="w-full mt-1 p-2 border rounded-lg bg-gray-100"
                                    value={user?.primaryEmailAddress?.emailAddress || ""}
                                    disabled
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Account ID</label>
                                <input
                                    className="w-full mt-1 p-2 border rounded-lg bg-gray-100"
                                    value={user?.id || ""}
                                    disabled
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Company Logo</label>
                                <input type="file" className="w-full mt-1" />
                            </div>

                            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">
                                Save Changes
                            </button>
                        </div>
                    )}

                    {activeTab === "wallet" && (
                        <div className="space-y-4 max-w-xl">
                            <div>
                                <label className="text-sm font-medium">Connected Wallet</label>
                                <input
                                    className="w-full mt-1 p-2 border rounded-lg bg-gray-100"
                                    value="0x8A2F...93bD"
                                    disabled
                                />
                            </div>

                            <div className="flex gap-3">
                                <button className="px-4 py-2 bg-gray-200 rounded-lg">
                                    Switch Wallet
                                </button>
                                <button className="px-4 py-2 bg-red-500 text-white rounded-lg">
                                    Disconnect
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === "network" && (
                        <div className="space-y-4 max-w-xl">
                            <label className="text-sm font-medium">
                                Ethereum Network
                            </label>

                            <div className="flex gap-4">
                                {["sepolia", "mainnet"].map((net) => (
                                    <button
                                        key={net}
                                        onClick={() => setNetwork(net)}
                                        className={`px-4 py-2 rounded-lg border
                      ${network === net
                                                ? "bg-blue-600 text-white"
                                                : "bg-gray-100"
                                            }`}
                                    >
                                        {net === "sepolia"
                                            ? "Sepolia Testnet"
                                            : "Ethereum Mainnet"}
                                    </button>
                                ))}
                            </div>

                            <p className="text-sm text-gray-500">
                                ⚠️ Network change affects minting & verification.
                            </p>
                        </div>
                    )}

                    {activeTab === "notifications" && (
                        <div className="space-y-4 max-w-xl">
                            <label className="flex items-center gap-2">
                                <input type="checkbox" defaultChecked />
                                Email alerts for recalled products
                            </label>

                            <label className="flex items-center gap-2">
                                <input type="checkbox" defaultChecked />
                                Email alerts for suspicious scans
                            </label>

                            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">
                                Save Preferences
                            </button>
                        </div>
                    )}

                    {activeTab === "developer" && (
                        <div className="space-y-4 max-w-2xl">
                            <div>
                                <label className="text-sm font-medium">
                                    Smart Contract Address
                                </label>
                                <input
                                    className="w-full mt-1 p-2 border rounded-lg bg-gray-100"
                                    value="0x1234...ABCD"
                                    disabled
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Contract ABI</label>
                                <textarea
                                    rows={5}
                                    className="w-full mt-1 p-2 border rounded-lg bg-gray-100 font-mono text-sm"
                                    value={`[
  { "name": "mintBatch", "type": "function" },
  { "name": "verifyBatch", "type": "function" }
]`}
                                    disabled
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">
                                    Example Web3 Call
                                </label>
                                <pre className="bg-black text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
                                    {`await contract.mintBatch(
  productName,
  batchId,
  expiryDate
);`}
                                </pre>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </Sidebar>
    );
}
