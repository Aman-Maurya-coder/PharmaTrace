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
import { FaSearch, FaQrcode, FaEye, FaChevronDown, FaChevronUp } from "react-icons/fa";
import QRCode from "react-qr-code";
import { v4 as uuidv4 } from "uuid";
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

  const stats = useMemo(() => {
    const total = filtered.length;
    const recalled = filtered.filter((b) => b.recalled).length;
    const active = filtered.filter((b) => !b.recalled && b.status === STATUS.ACTIVE).length;
    const expired = filtered.filter((b) => new Date(b.expiryDate) < new Date()).length;
    return { total, active, recalled, expired };
  }, [filtered]);

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
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 p-4 sm:p-6 lg:p-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900">Minted Batches</h2>
              <p className="text-sm text-slate-500 mt-1">Search, filter, and manage minted batches with quick actions.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
                <div className="text-xs text-slate-500">Total</div>
                <div className="text-lg font-semibold text-slate-900">{stats.total}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
                <div className="text-xs text-slate-500">Active</div>
                <div className="text-lg font-semibold text-emerald-700">{stats.active}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
                <div className="text-xs text-slate-500">Expired</div>
                <div className="text-lg font-semibold text-amber-700">{stats.expired}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
                <div className="text-xs text-slate-500">Recalled</div>
                <div className="text-lg font-semibold text-rose-700">{stats.recalled}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr_0.5fr_0.5fr] gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <FaSearch className="text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search product or batch ID"
                  className="w-full bg-transparent outline-none text-sm text-slate-700"
                />
              </div>
              <select
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All status</option>
                <option value={STATUS.ACTIVE}>{STATUS.ACTIVE}</option>
                <option value={STATUS.USED}>{STATUS.USED}</option>
                <option value={STATUS.EXPIRED}>{STATUS.EXPIRED}</option>
                <option value={STATUS.RECALLED}>{STATUS.RECALLED}</option>
              </select>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              />
            </div>
          </div>
          {/* Desktop table; mobile cards */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Product</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Batch ID</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Expiry</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Minted</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <React.Fragment key={b.id}>
                    <tr className="border-b border-slate-100 hover:bg-slate-50/70 transition">
                      <td className="px-5 py-4 text-sm font-medium text-slate-900">{b.productName}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">{b.batchId}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">{b.expiryDate}</td>
                      <td className="px-5 py-4 text-sm">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                            b.recalled
                              ? "bg-rose-50 text-rose-700"
                              : b.status === STATUS.ACTIVE
                              ? "bg-emerald-50 text-emerald-700"
                              : b.status === STATUS.EXPIRED
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {b.recalled ? STATUS.RECALLED : b.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">{new Date(b.mintedAt).toLocaleString()}</td>
                      <td className="px-5 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openView(b)}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <FaEye />
                            View
                          </button>
                          <button
                            onClick={() => openQR(b)}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <FaQrcode />
                            QR
                          </button>
                          <button
                            onClick={() => requestRecall(b)}
                            className="inline-flex items-center rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                          >
                            Recall
                          </button>
                          <button
                            onClick={() => toggleExpand(b.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            {expandedId === b.id ? <FaChevronUp /> : <FaChevronDown />}
                            {expandedId === b.id ? "Collapse" : "Expand"}
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={6} className="p-0">
                        <AnimatePresence>
                          {expandedId === b.id && (
                            <motion.td initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-5 py-4 bg-slate-50" colSpan={6}>
                              <div className="text-sm text-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                  <div className="text-xs text-slate-500">Quantity</div>
                                  <div className="font-semibold">{b.quantity}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-slate-500">Description</div>
                                  <div>{b.description || "—"}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-slate-500">Digital ID</div>
                                  <div className="font-mono break-all">{b.digitalId}</div>
                                </div>
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
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">No batches match your filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Mobile card list */}
          <div className="md:hidden space-y-3">
            {filtered.map((b) => (
              <motion.div key={b.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{b.productName}</div>
                    <div className="text-xs text-slate-500">{b.batchId}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-slate-700">{b.recalled ? STATUS.RECALLED : b.status}</div>
                    <div className="text-xs text-slate-400">Expires: {b.expiryDate}</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button onClick={() => openView(b)} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm">View</button>
                  <button onClick={() => openQR(b)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">QR</button>
                  <button onClick={() => requestRecall(b)} className="px-3 py-2 border border-rose-200 rounded-lg text-sm text-rose-600">Recall</button>
                </div>
                <AnimatePresence>
                  {expandedId === b.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-3 text-sm text-slate-700">
                      <div><strong>Quantity:</strong> {b.quantity}</div>
                      <div className="mt-1"><strong>Minted:</strong> {new Date(b.mintedAt).toLocaleString()}</div>
                      <div className="mt-1"><strong>Digital ID:</strong> <span className="font-mono break-all">{b.digitalId}</span></div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="mt-2 text-right">
                  <button onClick={() => toggleExpand(b.id)} className="text-xs text-emerald-700">{expandedId === b.id ? "Collapse" : "Expand"}</button>
                </div>
              </motion.div>
            ))}
            {filtered.length === 0 && <div className="text-center text-sm text-slate-500">No batches match your filters.</div>}
          </div>
          {/* Modals / overlays */}
          <AnimatePresence>
            {qrData && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 px-4">
                <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-slate-900">QR for {qrData.productName}</h4>
                    <button onClick={() => setQrData(null)} className="text-xs text-slate-500">Close</button>
                  </div>
                  <div className="flex justify-center rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <QRCode value={`medicinebatch:${qrData.digitalId}`} size={160} />
                  </div>
                  <div className="mt-4 text-sm text-slate-600">Digital ID: <span className="font-mono break-all">{qrData.digitalId}</span></div>
                </div>
              </motion.div>
            )}
            {viewData && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 px-4">
                <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-2xl border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-slate-900">Batch details</h4>
                    <button onClick={() => setViewData(null)} className="text-xs text-slate-500">Close</button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-slate-500">Product</div>
                        <div className="font-semibold text-slate-900">{viewData.productName}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Batch ID</div>
                        <div className="font-mono text-slate-800">{viewData.batchId}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Quantity</div>
                        <div className="text-slate-800">{viewData.quantity}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Minted at</div>
                        <div className="text-slate-800">{new Date(viewData.mintedAt).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-slate-500">Expiry</div>
                        <div className="text-slate-800">{viewData.expiryDate}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Status</div>
                        <div className="text-slate-800">{viewData.recalled ? STATUS.RECALLED : viewData.status}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Description</div>
                        <div className="text-slate-800">{viewData.description || "—"}</div>
                      </div>
                      <div className="pt-2">
                        <button onClick={() => openQR(viewData)} className="px-3 py-2 border border-slate-200 rounded-lg mr-2">Generate QR</button>
                        <button onClick={() => requestRecall(viewData)} className="px-3 py-2 border border-rose-200 rounded-lg text-rose-600">Recall</button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            {confirmRecall && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 px-4">
                <div className="bg-white p-5 rounded-2xl shadow-xl w-full max-w-sm border border-slate-200">
                  <div className="mb-4">
                    <div className="text-sm font-semibold text-slate-900">Confirm recall</div>
                    <div className="text-xs text-slate-500 mt-1">Are you sure you want to recall <strong>{confirmRecall.productName}</strong> ({confirmRecall.batchId})? This action is irreversible in this demo.</div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setConfirmRecall(null)} className="px-3 py-2 border border-slate-200 rounded-lg">Cancel</button>
                    <button onClick={confirmRecallNow} className="px-3 py-2 bg-rose-600 text-white rounded-lg">Recall now</button>
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
