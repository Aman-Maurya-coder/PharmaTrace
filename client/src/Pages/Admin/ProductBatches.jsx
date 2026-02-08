/*
MintedBatches.jsx
A single-file React component (Tailwind + Framer Motion + react-qr-code)
that displays minted batches in a searchable, filterable table/card list.

Features implemented:
- Columns: Product Name, Batch ID, Expiry Date, Status, Date Minted, Actions
- Filters: Date range (from/to) and Status (All/Active/Used/Expired/Recalled)
- Search bar (searches product name & batch id)
- Rows are expandable for a quick preview (animated with Framer Motion)
- Actions: View (detailed modal), Generate QR (modal), Recall (toggle with confirmation)
- Minimal professional UI, responsive: table on desktop, card-list on mobile
- Demo data included; placeholder hooks for real Web3 fetch integration

Dependencies required (already present in your project):
  framer-motion, react-icons, react-qr-code, uuid

Integration notes:
- Replace `loadBatches()` with actual on-chain or backend fetch when available.
- Recall action currently toggles a local flag. Wire it to your contract/backend to update on-chain state.
*/

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaSearch, FaQrcode, FaEye, FaBug, FaTrashAlt } from "react-icons/fa";
import QRCode from "react-qr-code";
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Components/Sidebar";

const STATUS = {
  ACTIVE: "Active",
  USED: "Used",
  EXPIRED: "Expired",
  RECALLED: "Recalled",
};

// Demo data generator
function demoBatches() {
  const now = Date.now();
  return [
    {
      id: uuidv4(),
      productName: "Paracetamol 500mg",
      batchId: "BATCH-20260207-001",
      expiryDate: new Date(now + 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10), // +30d
      mintedAt: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString(), // -2d
      status: STATUS.ACTIVE,
      quantity: 1000,
      description: "Standard tablet batch",
      recalled: false,
      digitalId: uuidv4(),
    },
    {
      id: uuidv4(),
      productName: "Ibuprofen 200mg",
      batchId: "BATCH-20260101-010",
      expiryDate: new Date(now - 1000 * 60 * 60 * 24 * 10).toISOString().slice(0, 10), // -10d expired
      mintedAt: new Date(now - 1000 * 60 * 60 * 24 * 60).toISOString(), // -60d
      status: STATUS.EXPIRED,
      quantity: 500,
      description: "For pain relief",
      recalled: false,
      digitalId: uuidv4(),
    },
    {
      id: uuidv4(),
      productName: "Amoxicillin 250mg",
      batchId: "BATCH-20260501-007",
      expiryDate: new Date(now + 1000 * 60 * 60 * 24 * 365).toISOString().slice(0, 10), // +365d
      mintedAt: new Date(now - 1000 * 60 * 60 * 24 * 5).toISOString(), // -5d
      status: STATUS.USED,
      quantity: 200,
      description: "Antibiotic capsules",
      recalled: true,
      digitalId: uuidv4(),
    },
  ];
}

export default function MintedBatches() {
  // main data
  const [batches, setBatches] = useState([]);

  // UI filters/search
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // UI state
  const [expandedId, setExpandedId] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [confirmRecall, setConfirmRecall] = useState(null);

  useEffect(() => {
    // load demo data; replace with real fetch
    const d = demoBatches();
    setBatches(d);
  }, []);

  // Derived filtered list
  const filtered = useMemo(() => {
    return batches.filter((b) => {
      // search by product name or batch id
      const q = query.trim().toLowerCase();
      if (q) {
        if (!(`${b.productName} ${b.batchId}`.toLowerCase().includes(q))) return false;
      }

      // status filter
      if (statusFilter !== "All") {
        if (statusFilter === STATUS.EXPIRED) {
          // compute expiry-based
          if (new Date(b.expiryDate) > new Date()) return false;
        } else if (statusFilter === STATUS.RECALLED) {
          if (!b.recalled) return false;
        } else {
          if (b.status !== statusFilter) return false;
        }
      }

      // date range filter by mintedAt
      if (dateFrom) {
        if (new Date(b.mintedAt) < new Date(dateFrom)) return false;
      }
      if (dateTo) {
        // include the whole day of dateTo
        const dTo = new Date(dateTo);
        dTo.setHours(23, 59, 59, 999);
        if (new Date(b.mintedAt) > dTo) return false;
      }

      return true;
    });
  }, [batches, query, statusFilter, dateFrom, dateTo]);

  // Actions
  function toggleExpand(id) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function openQR(batch) {
    setQrData(batch);
  }

  function openView(batch) {
    setViewData(batch);
  }

  function requestRecall(batch) {
    setConfirmRecall(batch);
  }

  function confirmRecallNow() {
    if (!confirmRecall) return;
    setBatches((prev) =>
      prev.map((b) => (b.id === confirmRecall.id ? { ...b, recalled: true, status: STATUS.RECALLED } : b))
    );
    setConfirmRecall(null);
  }

  return (
    <Sidebar>
      <div className="min-h-screen bg-gray-50 p-6 md:p-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold">Minted Batches</h2>
              <p className="text-sm text-gray-500 mt-1">List of all minted batches with quick actions and filters.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-white border rounded-md px-3 py-1 gap-2">
                <FaSearch className="text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search product or batch id"
                  className="outline-none text-sm"
                />
              </div>
              <select className="border rounded-md px-3 py-1 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="All">All status</option>
                <option value={STATUS.ACTIVE}>{STATUS.ACTIVE}</option>
                <option value={STATUS.USED}>{STATUS.USED}</option>
                <option value={STATUS.EXPIRED}>{STATUS.EXPIRED}</option>
                <option value={STATUS.RECALLED}>{STATUS.RECALLED}</option>
              </select>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border rounded-md px-3 py-1 text-sm" />
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border rounded-md px-3 py-1 text-sm" />
            </div>
          </div>
          {/* Desktop table; mobile cards */}
          <div className="hidden md:block bg-white rounded-md shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium">Product Name</th>
                  <th className="px-4 py-3 text-sm font-medium">Batch ID</th>
                  <th className="px-4 py-3 text-sm font-medium">Expiry Date</th>
                  <th className="px-4 py-3 text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-sm font-medium">Date Minted</th>
                  <th className="px-4 py-3 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <React.Fragment key={b.id}>
                    <tr className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{b.productName}</td>
                      <td className="px-4 py-3 text-sm">{b.batchId}</td>
                      <td className="px-4 py-3 text-sm">{b.expiryDate}</td>
                      <td className="px-4 py-3 text-sm">{b.recalled ? STATUS.RECALLED : b.status}</td>
                      <td className="px-4 py-3 text-sm">{new Date(b.mintedAt).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openView(b)} className="px-2 py-1 rounded-md text-sm bg-gray-50 border">View</button>
                          <button onClick={() => openQR(b)} className="px-2 py-1 rounded-md text-sm bg-gray-50 border flex items-center gap-2"><FaQrcode /> QR</button>
                          <button onClick={() => requestRecall(b)} className="px-2 py-1 rounded-md text-sm bg-red-50 border text-red-600">Recall</button>
                          <button onClick={() => toggleExpand(b.id)} className="px-2 py-1 rounded-md text-sm bg-white border">{expandedId === b.id ? "Collapse" : "Expand"}</button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={6} className="p-0">
                        <AnimatePresence>
                          {expandedId === b.id && (
                            <motion.td initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 py-3 bg-gray-50" colSpan={6}>
                              <div className="text-sm text-gray-700">
                                <div><strong>Quantity:</strong> {b.quantity}</div>
                                <div className="mt-1"><strong>Description:</strong> {b.description || "—"}</div>
                                <div className="mt-1"><strong>Digital ID:</strong> <span className="font-mono break-all">{b.digitalId}</span></div>
                              </div>
                            </motion.td>
                          )}
                        </AnimatePresence>
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">No batches match your filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Mobile card list */}
          <div className="md:hidden space-y-3">
            {filtered.map((b) => (
              <motion.div key={b.id} className="bg-white p-4 rounded-md shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{b.productName}</div>
                    <div className="text-xs text-gray-500">{b.batchId}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">{b.recalled ? STATUS.RECALLED : b.status}</div>
                    <div className="text-xs text-gray-400">Expires: {b.expiryDate}</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button onClick={() => openView(b)} className="flex-1 px-3 py-2 border rounded-md text-sm">View</button>
                  <button onClick={() => openQR(b)} className="px-3 py-2 border rounded-md text-sm">QR</button>
                  <button onClick={() => requestRecall(b)} className="px-3 py-2 border rounded-md text-sm text-red-600">Recall</button>
                </div>
                <AnimatePresence>
                  {expandedId === b.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-3 text-sm text-gray-700">
                      <div><strong>Quantity:</strong> {b.quantity}</div>
                      <div className="mt-1"><strong>Minted:</strong> {new Date(b.mintedAt).toLocaleString()}</div>
                      <div className="mt-1"><strong>Digital ID:</strong> <span className="font-mono break-all">{b.digitalId}</span></div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="mt-2 text-right">
                  <button onClick={() => toggleExpand(b.id)} className="text-xs text-indigo-600">{expandedId === b.id ? "Collapse" : "Expand"}</button>
                </div>
              </motion.div>
            ))}
            {filtered.length === 0 && <div className="text-center text-sm text-gray-500">No batches match your filters.</div>}
          </div>
          {/* Modals / overlays */}
          <AnimatePresence>
            {qrData && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-md shadow-lg w-[90%] max-w-md">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">QR for {qrData.productName}</h4>
                    <button onClick={() => setQrData(null)} className="text-sm text-gray-500">Close</button>
                  </div>
                  <div className="flex justify-center">
                    <QRCode value={`medicinebatch:${qrData.digitalId}`} size={160} />
                  </div>
                  <div className="mt-4 text-sm text-gray-600">Digital ID: <span className="font-mono break-all">{qrData.digitalId}</span></div>
                </div>
              </motion.div>
            )}
            {viewData && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-md shadow-lg w-[95%] md:w-3/4 max-w-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">Batch details</h4>
                    <button onClick={() => setViewData(null)} className="text-sm text-gray-500">Close</button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500">Product</div>
                      <div className="font-medium">{viewData.productName}</div>
                      <div className="text-xs text-gray-500 mt-3">Batch ID</div>
                      <div className="font-mono">{viewData.batchId}</div>
                      <div className="text-xs text-gray-500 mt-3">Quantity</div>
                      <div>{viewData.quantity}</div>
                      <div className="text-xs text-gray-500 mt-3">Minted at</div>
                      <div>{new Date(viewData.mintedAt).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Expiry</div>
                      <div>{viewData.expiryDate}</div>
                      <div className="text-xs text-gray-500 mt-3">Status</div>
                      <div>{viewData.recalled ? STATUS.RECALLED : viewData.status}</div>
                      <div className="text-xs text-gray-500 mt-3">Description</div>
                      <div>{viewData.description || "—"}</div>
                      <div className="mt-4">
                        <button onClick={() => openQR(viewData)} className="px-3 py-2 border rounded-md mr-2">Generate QR</button>
                        <button onClick={() => requestRecall(viewData)} className="px-3 py-2 border rounded-md text-red-600">Recall</button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            {confirmRecall && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white p-4 rounded-md shadow-lg w-[90%] max-w-sm">
                  <div className="mb-4">
                    <div className="text-sm font-semibold">Confirm recall</div>
                    <div className="text-xs text-gray-500 mt-1">Are you sure you want to recall <strong>{confirmRecall.productName}</strong> ({confirmRecall.batchId})? This action is irreversible in this demo.</div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setConfirmRecall(null)} className="px-3 py-2 border rounded-md">Cancel</button>
                    <button onClick={confirmRecallNow} className="px-3 py-2 bg-red-600 text-white rounded-md">Recall now</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Sidebar>
  );
}
