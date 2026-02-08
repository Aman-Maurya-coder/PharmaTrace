import { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { motion } from "framer-motion";
import {
  FaWallet,
  FaUpload,
  FaCheckCircle,
  FaSpinner,
  FaDownload,
  FaQrcode,
  FaInfoCircle,
  FaTimes,
} from "react-icons/fa";
import QRCode from "react-qr-code";
import { v4 as uuidv4 } from "uuid";
import Sidebar from "../Components/Sidebar";

/**
 * MintNewMedicineBatch.jsx — updated:
 * - preview/status moved to modal that opens after clicking Mint
 * - Confirm & Mint button inside modal performs blockchain tx
 * - Responsive modal (full-screen on mobile)
 * - UI polish: hover, focus, disabled states
 */

export default function MintNewMedicineBatch() {
  // ---------- FORM STATE ----------
  const [form, setForm] = useState({
    productName: "",
    batchId: "",
    mfgDate: "",
    expiryDate: "",
    totalUnits: "",
    description: "",
    restAllowed: true,
    disableScanAfterExpiry: true,
    maxValidations: 5,
  });
  const [formErrors, setFormErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);

  // preview modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [previewDigitalId, setPreviewDigitalId] = useState(null);
  const [previewMetadata, setPreviewMetadata] = useState(null);

  const qrRef = useRef(null);

  // ---------- WEB3 STATE ----------
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState(null);

  // ---------- TX STATE ----------
  const [estimating, setEstimating] = useState(false);
  const [estimatedGas, setEstimatedGas] = useState(null);
  const [txLoading, setTxLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [successData, setSuccessData] = useState(null);

  // ---------- INIT PROVIDER ----------
  useEffect(() => {
    if (window.ethereum) {
      const p = new ethers.BrowserProvider(window.ethereum);
      setProvider(p);

      const handleAccounts = async (accounts) => {
        try {
          if (!accounts || accounts.length === 0) {
            setAddress("");
            setSigner(null);
            setBalance(null);
          } else {
            const s = await p.getSigner();
            setSigner(s);
            const addr = await s.getAddress();
            const bal = await p.getBalance();
            setAddress(addr);
            setBalance(ethers.formatEther(bal));
          }
        } catch (e) {
          console.error("accounts change handler:", e);
        }
      };

      p
        .listAccounts()
        .then((arr) => handleAccounts(arr || []))
        .catch(() => {});
      window.ethereum?.on("accountsChanged", handleAccounts);
      window.ethereum?.on("chainChanged", () => {
        window.location.reload();
      });

      return () => {
        try {
          window.ethereum?.removeListener("accountsChanged", handleAccounts);
        } catch (e) {}
      };
    }
  }, []);

  // ---------- CONNECT WALLET ----------
  async function connectWallet() {
    if (!window.ethereum) {
      alert("Install MetaMask to continue");
      return;
    }

    try {
      const p = new ethers.BrowserProvider(window.ethereum);
      await p.send("eth_requestAccounts", []);
      const s = await p.getSigner();
      const addr = await s.getAddress();
      const bal = await p.getBalance();

      setProvider(p);
      setSigner(s);
      setAddress(addr);
      setBalance(ethers.formatEther(bal));
    } catch (err) {
      console.error(err);
      alert("Failed to connect wallet");
    }
  }

  // ---------- HANDLE INPUT CHANGE ----------
  function handleChange(e) {
    const { name, type, value, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  // ---------- IMAGE UPLOAD ----------
  function handleImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  // ---------- VALIDATION ----------
  function validate() {
    const errors = {};
    if (!form.productName.trim()) errors.productName = "Product name is required";
    if (!form.batchId.trim()) errors.batchId = "Batch ID is required";
    if (!form.mfgDate) errors.mfgDate = "Manufacturing date required";
    if (!form.expiryDate) errors.expiryDate = "Expiry date required";
    if (form.mfgDate && form.expiryDate && form.mfgDate > form.expiryDate)
      errors.expiryDate = "Expiry must be after manufacturing date";
    if (!form.totalUnits || Number(form.totalUnits) <= 0)
      errors.totalUnits = "Enter a valid number of units";
    if (!Number.isInteger(Number(form.maxValidations)) || Number(form.maxValidations) < 1)
      errors.maxValidations = "Max validations must be an integer ≥ 1";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // ---------- ESTIMATE GAS ----------
  async function estimateGas() {
    if (!provider || !address) {
      alert("Connect wallet first");
      return;
    }
    setEstimating(true);
    setEstimatedGas(null);
    try {
      let gasPrice;
      try {
        gasPrice = await provider.getGasPrice();
      } catch (err) {
        gasPrice = 0n;
      }
      const estimatedUnits = 120000n;
      const costEth = gasPrice ? ethers.formatEther(gasPrice * estimatedUnits) : "0";
      setEstimatedGas({ units: estimatedUnits.toString(), eth: Number(costEth).toFixed(6) });
    } catch (err) {
      console.error(err);
      setEstimatedGas(null);
    } finally {
      setEstimating(false);
    }
  }

  // ---------- OPEN PREVIEW MODAL (called when user clicks Mint) ----------
  function openPreviewModal() {
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    // prepare preview id and metadata (do not mint yet)
    const id = uuidv4();
    const metadata = {
      digitalId: id,
      productName: form.productName,
      batchId: form.batchId,
      mfgDate: form.mfgDate,
      expiryDate: form.expiryDate,
      totalUnits: Number(form.totalUnits),
      description: form.description,
      restAllowed: !!form.restAllowed,
      disableScanAfterExpiry: !!form.disableScanAfterExpiry,
      maxValidations: Number(form.maxValidations),
      image: imagePreview,
      createdAt: new Date().toISOString(),
    };
    setPreviewDigitalId(id);
    setPreviewMetadata(metadata);
    setModalOpen(true);
  }

  // ---------- DOWNLOAD QR (modal) ----------
  function downloadQR(forId) {
    try {
      const container = document.getElementById("qr-code-container-modal");
      if (!container) return alert("QR not available");
      const svg = container.querySelector("svg");
      if (!svg) return alert("QR not available");
      const serializer = new XMLSerializer();
      const source = serializer.serializeToString(svg);
      const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(form.batchId || "medicine-batch")}-${forId || previewDigitalId}-qr.svg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("downloadQR", err);
      alert("Failed to download QR");
    }
  }

  // ---------- CONFIRM & MINT (called inside modal) ----------
  async function confirmAndMint() {
    if (!signer) {
      alert("Connect wallet first");
      return;
    }
    if (!previewDigitalId || !previewMetadata) {
      alert("Preview not ready");
      return;
    }

    setTxLoading(true);
    setTxHash(null);
    setSuccessData(null);

    try {
      // Optional: upload metadata to IPFS here and get metadataUri
      // const metadataUri = await uploadToIPFS(previewMetadata);

      // Fallback tx to self to produce a tx hash
      const tx = await signer.sendTransaction({
        to: address,
        value: 0n,
        // optionally include data with metadataUri if using a contract
      });
      const receipt = await tx.wait();
      const hash = receipt?.hash ?? tx.hash;

      setTxHash(hash);

      const success = {
        digitalId: previewDigitalId,
        metadata: previewMetadata,
        explorer: `https://sepolia.etherscan.io/tx/${hash}`,
      };

      setSuccessData(success);

      // keep modal open and show success — you can auto-close after a while if desired
    } catch (err) {
      console.error(err);
      alert("Transaction failed — check console");
    } finally {
      setTxLoading(false);
    }
  }

  // ---------- helper ----------
  const isFormReady = () =>
    form.productName && form.batchId && form.mfgDate && form.expiryDate && Number(form.totalUnits) > 0;

  // ---------- UI ----------
  return (
    <Sidebar>
      <div className="min-h-screen bg-gray-50 p-6 md:p-10">
        <div className="max-w-6xl mx-auto">
          {/* HEADER */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-semibold text-gray-800 flex items-center gap-3">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-400">
                  Mint New Medicine Batch
                </span>
                <span className="text-indigo-400"><FaQrcode /></span>
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Create an on-chain digital identity for the medicine batch — review in the popup before confirming.
              </p>

              {/* show a compact last-success card beneath on small screens */}
              {successData && (
                <div className="mt-4 inline-flex items-center gap-3 bg-white rounded-lg px-3 py-2 shadow-sm">
                  <FaCheckCircle className="text-green-600" />
                  <div className="text-sm">
                    <div className="font-semibold">Last minted</div>
                    <div className="text-xs text-gray-500">{successData.digitalId}</div>
                  </div>
                  <a
                    href={successData.explorer}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-4 text-xs underline text-indigo-600"
                  >
                    View tx
                  </a>
                </div>
              )}
            </div>

            {/* WALLET CARD */}
            <motion.div
              whileHover={{ y: -3 }}
              className="flex items-center gap-4 bg-gradient-to-r from-indigo-600 via-sky-500 to-cyan-400 text-white px-4 py-2 rounded-lg shadow-lg"
            >
              <FaWallet size={20} />
              <div className="text-right">
                <div className="text-xs opacity-80">Wallet</div>
                <div className="text-sm font-medium">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected"}
                </div>
                <div className="text-xs opacity-80">
                  Balance: {balance ? `${Number(balance).toFixed(4)} ETH` : "-"}
                </div>
              </div>
              <button
                onClick={connectWallet}
                className="ml-3 bg-white text-indigo-700 px-3 py-1 rounded-md text-sm font-semibold hover:shadow-md transform hover:-translate-y-0.5 transition"
                aria-label="Connect wallet"
              >
                {address ? "Connected" : "Connect"}
              </button>
            </motion.div>
          </div>

          {/* MAIN GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* FORM */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Product name */}
                <div>
                  <label className="text-sm text-gray-600 flex items-center gap-2">
                    Product Name <span className="text-xs text-gray-400">(required)</span>
                  </label>
                  <input
                    name="productName"
                    value={form.productName}
                    onChange={handleChange}
                    className={`w-full mt-1 border rounded-lg p-3 focus:ring-2 focus:ring-indigo-200 transition ${
                      formErrors.productName ? "border-red-300" : "border-gray-200"
                    }`}
                    placeholder="Paracetamol 500mg"
                    aria-invalid={!!formErrors.productName}
                  />
                  {formErrors.productName && (
                    <div className="text-xs text-red-500 mt-1">{formErrors.productName}</div>
                  )}
                </div>

                {/* Batch ID */}
                <div>
                  <label className="text-sm text-gray-600">Batch ID <span className="text-xs text-gray-400">(required)</span></label>
                  <input
                    name="batchId"
                    value={form.batchId}
                    onChange={handleChange}
                    className={`w-full mt-1 border rounded-lg p-3 focus:ring-2 focus:ring-indigo-200 transition ${
                      formErrors.batchId ? "border-red-300" : "border-gray-200"
                    }`}
                    placeholder="BATCH-20260207-001"
                    aria-invalid={!!formErrors.batchId}
                  />
                  {formErrors.batchId && <div className="text-xs text-red-500 mt-1">{formErrors.batchId}</div>}
                </div>

                {/* Mfg Date */}
                <div>
                  <label className="text-sm text-gray-600">Manufacturing Date</label>
                  <input
                    type="date"
                    name="mfgDate"
                    value={form.mfgDate}
                    onChange={handleChange}
                    className={`w-full mt-1 border rounded-lg p-3 focus:ring-2 focus:ring-indigo-200 transition ${
                      formErrors.mfgDate ? "border-red-300" : "border-gray-200"
                    }`}
                    aria-invalid={!!formErrors.mfgDate}
                  />
                  {formErrors.mfgDate && <div className="text-xs text-red-500 mt-1">{formErrors.mfgDate}</div>}
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="text-sm text-gray-600">Expiry Date</label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={form.expiryDate}
                    onChange={handleChange}
                    className={`w-full mt-1 border rounded-lg p-3 focus:ring-2 focus:ring-indigo-200 transition ${
                      formErrors.expiryDate ? "border-red-300" : "border-gray-200"
                    }`}
                    aria-invalid={!!formErrors.expiryDate}
                  />
                  {formErrors.expiryDate && <div className="text-xs text-red-500 mt-1">{formErrors.expiryDate}</div>}
                </div>

                {/* Total Units */}
                <div>
                  <label className="text-sm text-gray-600">Total Units Produced</label>
                  <input
                    type="number"
                    min={1}
                    name="totalUnits"
                    value={form.totalUnits}
                    onChange={handleChange}
                    className={`w-full mt-1 border rounded-lg p-3 focus:ring-2 focus:ring-indigo-200 transition ${
                      formErrors.totalUnits ? "border-red-300" : "border-gray-200"
                    }`}
                    placeholder="e.g., 1000"
                  />
                  {formErrors.totalUnits && <div className="text-xs text-red-500 mt-1">{formErrors.totalUnits}</div>}
                </div>

                {/* Max Validations */}
                <div>
                  <label className="text-sm text-gray-600">Max Validations per Unit <span className="text-xs text-gray-400 ml-2">(prevents abuse)</span></label>
                  <input
                    type="number"
                    min={1}
                    name="maxValidations"
                    value={form.maxValidations}
                    onChange={handleChange}
                    className={`w-full mt-1 border rounded-lg p-3 focus:ring-2 focus:ring-indigo-200 transition ${
                      formErrors.maxValidations ? "border-red-300" : "border-gray-200"
                    }`}
                    placeholder="e.g., 5"
                  />
                  {formErrors.maxValidations && <div className="text-xs text-red-500 mt-1">{formErrors.maxValidations}</div>}
                </div>

                {/* Toggles */}
                <div className="flex items-center gap-3">
                  <div>
                    <label className="text-sm text-gray-600">Allow Returns / Restock</label>
                    <div className="text-xs text-gray-400">If enabled users can return units.</div>
                  </div>
                  <div className="ml-auto">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" name="restAllowed" checked={!!form.restAllowed} onChange={handleChange} className="sr-only" />
                      <div className={`w-11 h-6 rounded-full transition ${form.restAllowed ? "bg-indigo-600" : "bg-gray-300"}`} aria-hidden />
                      <span className={`ml-3 text-sm ${form.restAllowed ? "text-gray-800" : "text-gray-500"}`}>{form.restAllowed ? "Enabled" : "Disabled"}</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div>
                    <label className="text-sm text-gray-600">Disable Scan After Expiry</label>
                    <div className="text-xs text-gray-400">Automatically block scans after expiry date.</div>
                  </div>
                  <div className="ml-auto">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" name="disableScanAfterExpiry" checked={!!form.disableScanAfterExpiry} onChange={handleChange} className="sr-only" />
                      <div className={`w-11 h-6 rounded-full transition ${form.disableScanAfterExpiry ? "bg-indigo-600" : "bg-gray-300"}`} aria-hidden />
                      <span className={`ml-3 text-sm ${form.disableScanAfterExpiry ? "text-gray-800" : "text-gray-500"}`}>{form.disableScanAfterExpiry ? "Enabled" : "Disabled"}</span>
                    </label>
                  </div>
                </div>

                {/* description */}
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600">Optional Description</label>
                  <textarea name="description" value={form.description} onChange={handleChange} rows={3} className="w-full mt-1 border rounded-lg p-3 focus:ring-2 focus:ring-indigo-200 transition border-gray-200" placeholder="Notes about production, QC, packaging..." />
                </div>

                {/* image */}
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600 flex items-center gap-2">Image Upload <span className="text-xs text-gray-400">(optional)</span> <FaInfoCircle className="text-gray-300" /></label>
                  <div className="mt-1 flex items-center gap-3">
                    <label className="flex items-center gap-2 border border-dashed px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                      <FaUpload />
                      <span>Choose image</span>
                      <input type="file" accept="image/*" onChange={handleImage} hidden />
                    </label>
                    {imagePreview ? (
                      <img src={imagePreview} className="w-24 h-24 object-cover rounded-md border" alt="preview" />
                    ) : (
                      <div className="w-24 h-24 rounded-md border border-dashed flex items-center justify-center text-xs text-gray-400">No image</div>
                    )}
                  </div>
                </div>
              </div>

              {/* GAS + ACTIONS */}
              <div className="mt-6 flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
                <div className="text-sm text-gray-500">
                  {estimating ? (
                    <span className="flex items-center gap-2"><FaSpinner className="animate-spin" /> Estimating gas...</span>
                  ) : estimatedGas ? (
                    <span>Est. gas: <strong>{estimatedGas.units}</strong> units • ~ <strong>{estimatedGas.eth} ETH</strong></span>
                  ) : (
                    "Press Estimate Gas to preview cost"
                  )}
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                  <button
                    onClick={estimateGas}
                    className="px-4 py-2 border rounded-lg bg-white hover:shadow-sm transition text-sm"
                    type="button"
                  >
                    {estimating ? <span className="flex items-center gap-2"><FaSpinner className="animate-spin" /> Estimating</span> : "Estimate Gas"}
                  </button>

                  {/* IMPORTANT: this opens preview modal; actual mint happens in modal */}
                  <button
                    onClick={openPreviewModal}
                    disabled={!isFormReady()}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white font-semibold transition transform ${
                      !isFormReady()
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg active:scale-[0.99]"
                    }`}
                    type="button"
                  >
                    <FaCheckCircle />
                    <span>Mint on Blockchain</span>
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: small helpful box (kept minimal) */}
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-xl shadow-sm">
                <h4 className="text-sm font-semibold mb-2">Quick Tips</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>Use a unique Batch ID (e.g., BATCH-YYYYMMDD-001).</li>
                  <li>Set Max Validations to reduce duplicate scan abuse.</li>
                  <li>Upload image & metadata to IPFS for permanence (recommended).</li>
                </ul>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm">
                <h4 className="text-sm font-semibold mb-2">Estimated Cost</h4>
                <div className="text-gray-600 text-sm">
                  {estimatedGas ? (
                    <div>
                      <div>Gas units: <strong>{estimatedGas.units}</strong></div>
                      <div>Approx: <strong>{estimatedGas.eth} ETH</strong></div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400">Estimate gas to see cost here</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== MODAL (preview + confirm) ===== */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black"
              onClick={() => {
                if (!txLoading) setModalOpen(false);
              }}
            />

            {/* modal content */}
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="relative z-60 w-full max-w-3xl mx-4 md:mx-0 bg-white rounded-xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold">Preview Batch — Review & Confirm</h3>
                  <span className="text-sm text-gray-400">Review data before minting</span>
                </div>

                <div className="flex items-center gap-2">
                  {txHash && (
                    <a href={successData?.explorer} target="_blank" rel="noreferrer" className="text-xs underline text-indigo-600">
                      View tx
                    </a>
                  )}
                  <button
                    onClick={() => !txLoading && setModalOpen(false)}
                    className="p-2 rounded-md hover:bg-gray-100 transition"
                    aria-label="Close preview"
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* left: metadata */}
                <div>
                  <div className="text-sm text-gray-500 mb-3">Digital ID</div>
                  <div className="font-mono break-all mb-4 text-sm">{previewDigitalId}</div>

                  <div className="space-y-2 text-sm text-gray-700">
                    <div><strong>Product:</strong> {previewMetadata?.productName}</div>
                    <div><strong>Batch ID:</strong> {previewMetadata?.batchId}</div>
                    <div><strong>MFG:</strong> {previewMetadata?.mfgDate}</div>
                    <div><strong>EXP:</strong> {previewMetadata?.expiryDate}</div>
                    <div><strong>Total Units:</strong> {previewMetadata?.totalUnits}</div>
                    <div><strong>Max Validations:</strong> {previewMetadata?.maxValidations}</div>
                    <div><strong>Allow Returns:</strong> {previewMetadata?.restAllowed ? "Yes" : "No"}</div>
                    <div><strong>Disable After Expiry:</strong> {previewMetadata?.disableScanAfterExpiry ? "Yes" : "No"}</div>
                  </div>

                  <div className="mt-4 text-xs text-gray-500">
                    Tip: upload metadata (image + JSON) to IPFS and store the returned URI on-chain for permanent access.
                  </div>
                </div>

                {/* right: QR + actions */}
                <div className="flex flex-col items-center">
                  <div id="qr-code-container-modal" className="bg-white p-3 rounded-md">
                    <QRCode value={`medicinebatch:${previewDigitalId}`} size={180} />
                  </div>

                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => downloadQR(previewDigitalId)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border hover:shadow-sm transition"
                    >
                      <FaDownload /> Download QR (SVG)
                    </button>

                    <button
                      onClick={confirmAndMint}
                      disabled={txLoading}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-semibold transition transform ${
                        txLoading ? "bg-indigo-400 cursor-wait" : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg active:scale-[0.99]"
                      }`}
                    >
                      {txLoading ? (
                        <>
                          <FaSpinner className="animate-spin" />
                          <span>Minting...</span>
                        </>
                      ) : (
                        <>
                          <FaCheckCircle />
                          <span>Confirm & Mint</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* show success inside modal after mint */}
                  {successData && successData.digitalId === previewDigitalId && (
                    <div className="mt-4 w-full bg-green-50 border border-green-100 p-3 rounded-md text-sm text-green-800">
                      Mint successful — <a href={successData.explorer} target="_blank" rel="noreferrer" className="underline">view transaction</a>
                    </div>
                  )}
                </div>
              </div>

              {/* optional metadata dump */}
              <div className="p-4 border-t bg-gray-50">
                <div className="max-h-44 overflow-auto text-xs text-gray-700 p-2 bg-white rounded">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(previewMetadata, null, 2)}</pre>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </Sidebar>
  );
}
