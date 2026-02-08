import { useState, useMemo } from "react";
import {
  FaWallet,
  FaCheckCircle,
  FaSpinner,
  FaDownload,
  FaTimes,
  FaShieldAlt,
  FaCube,
  FaExclamationTriangle,
  FaLink,
  FaArrowRight,
} from "react-icons/fa";
import Sidebar from "../Components/Sidebar";
import { useWallet } from "../../hooks/useWallet";
import {
  createBatch,
  confirmBatchMint,
  downloadQRPackage,
} from "../../services/api";
import {
  mintBatchOnChain,
  estimateMintGas,
  getExplorerUrl,
} from "../../services/blockchain";

export default function AddProduct() {
  // ===========================================
  // FORM STATE
  // ===========================================
  const [form, setForm] = useState({
    productName: "",
    batchId: "",
    mfgDate: "",
    expiryDate: "",
    quantity: "",
    description: "",
    disableScanAfterExpiry: true,
    maxValidations: 1,
    claimMode: "CONSUMER",
    resetAllowed: false,
    resetWindow: 24,
    maxResets: 0,
    mrp: "",
  });

  const [formErrors, setFormErrors] = useState({});

  // ===========================================
  // WALLET HOOK
  // ===========================================
  const {
    address,
    balance,
    isConnected,
    isCorrectNet,
    connect,
    switchToCorrectNetwork,
    shortAddress,
    formattedBalance,
    getNetworkName,
  } = useWallet();

  // ===========================================
  // MINTING FLOW STATE
  // ===========================================
  const [currentStep, setCurrentStep] = useState(0); // 0: Form, 1: Backend, 2: Blockchain, 3: Confirm, 4: Success
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Step 1: Backend batch creation
  const [createdBatch, setCreatedBatch] = useState(null);

  // Step 2: Blockchain mint
  const [txHash, setTxHash] = useState(null);

  // Step 3: Backend confirmation
  const [confirmedBatch, setConfirmedBatch] = useState(null);

  // Gas estimation
  const [estimatedGas, setEstimatedGas] = useState(null);
  const [estimatingGas, setEstimatingGas] = useState(false);

  // ===========================================
  // FORM HANDLERS
  // ===========================================
  function handleChange(event) {
    const { name, type, value, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  }



  function validate() {
    const errors = {};
    if (!form.productName.trim())
      errors.productName = "Product name is required.";
    if (!form.batchId.trim()) errors.batchId = "Batch ID is required.";
    if (!form.mfgDate) errors.mfgDate = "Manufacturing date is required.";
    if (!form.expiryDate) errors.expiryDate = "Expiry date is required.";
    if (form.mfgDate && form.expiryDate && form.mfgDate > form.expiryDate) {
      errors.expiryDate = "Expiry must be after manufacturing date.";
    }
    if (!form.quantity || Number(form.quantity) <= 0) {
      errors.quantity = "Enter a valid quantity.";
    }
    if (
      !Number.isInteger(Number(form.maxValidations)) ||
      Number(form.maxValidations) < 1
    ) {
      errors.maxValidations = "Use an integer value greater than 0.";
    }
    if (form.resetAllowed) {
      if (!form.resetWindow || Number(form.resetWindow) <= 0) {
        errors.resetWindow = "Enter a valid reset window in hours.";
      }
      if (
        !Number.isInteger(Number(form.maxResets)) ||
        Number(form.maxResets) < 0
      ) {
        errors.maxResets = "Enter a valid number of max resets.";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // ===========================================
  // GAS ESTIMATION
  // ===========================================
  async function estimateGas() {
    if (!isConnected) {
      alert("Please connect wallet first.");
      return;
    }

    if (!validate()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setEstimatingGas(true);
    setEstimatedGas(null);
    setError(null);

    try {
      const gasInfo = await estimateMintGas(
        form.batchId,
        form.expiryDate,
        null // Merkle root comes from backend
      );
      setEstimatedGas(gasInfo);
    } catch (err) {
      console.error("Gas estimation error:", err);
      setError(err.message || "Failed to estimate gas");
    } finally {
      setEstimatingGas(false);
    }
  }

  // ===========================================
  // THREE-STEP MINTING FLOW
  // ===========================================

  /**
   * STEP 1: Create batch via backend
   * Backend generates bottles, QR codes, and Merkle root
   */
  async function handleStep1_CreateBatch() {
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!isConnected) {
      alert("Please connect your wallet first.");
      return;
    }

    if (!isCorrectNet) {
      alert("Please switch to the correct network.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentStep(1);

    try {
      console.log("Step 1: Creating batch on backend...");

      const batchData = {
        productName: form.productName,
        batchId: form.batchId,
        mfgDate: form.mfgDate,
        expiryDate: form.expiryDate,
        quantity: Number(form.quantity),
        disableScanAfterExpiry: form.disableScanAfterExpiry,
        maxValidations: Number(form.maxValidations),
        claimMode: form.claimMode,
        resetAllowed: form.resetAllowed,
        resetWindow: form.resetAllowed ? Number(form.resetWindow) : undefined,
        maxResets: form.resetAllowed ? Number(form.maxResets) : undefined,
        market: form.market,
        mrp: form.mrp ? Number(form.mrp) : undefined,
        description: form.description,
      };

      const response = await createBatch(batchData);

      console.log("Backend response:", response);

      // Accept either READY_TO_MINT or active (backend status naming)
      if (response.status !== "READY_TO_MINT" && response.status !== "active") {
        throw new Error(
          `Unexpected batch status: ${response.status}. Expected READY_TO_MINT or active.`
        );
      }

      setCreatedBatch(response);
      setIsLoading(false);

      // Automatically proceed to Step 2
      setTimeout(() => handleStep2_MintOnBlockchain(response), 500);
    } catch (err) {
      console.error("Step 1 error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to create batch on backend"
      );
      setIsLoading(false);
      setCurrentStep(0);
    }
  }

  /**
   * STEP 2: Mint on blockchain using user's wallet
   * Frontend signs transaction with MetaMask
   */
  async function handleStep2_MintOnBlockchain(batchData) {
    setIsLoading(true);
    setError(null);
    setCurrentStep(2);

    try {
      console.log("Step 2: Minting on blockchain...");

      const merkleRoot = batchData.merkleRoot || batchData.rulesHash || null;

      const { txHash: transactionHash } = await mintBatchOnChain(
        batchData.batchId,
        form.expiryDate,
        merkleRoot
      );

      console.log("Blockchain mint successful:", transactionHash);

      setTxHash(transactionHash);
      setIsLoading(false);

      // Automatically proceed to Step 3
      setTimeout(
        () => handleStep3_ConfirmMint(batchData.batchId, transactionHash),
        500
      );
    } catch (err) {
      console.error("Step 2 error:", err);
      setError(err.message || "Failed to mint on blockchain");
      setIsLoading(false);
      setCurrentStep(1);
    }
  }

  /**
   * STEP 3: Confirm mint with backend
   * Send transaction hash to backend for verification
   */
  async function handleStep3_ConfirmMint(batchId, transactionHash) {
    setIsLoading(true);
    setError(null);
    setCurrentStep(3);

    try {
      console.log("Step 3: Confirming mint with backend...");

      const response = await confirmBatchMint(batchId, transactionHash);

      console.log("Confirmation response:", response);

      setConfirmedBatch(response);
      setCurrentStep(4); // Success!
      setIsLoading(false);
    } catch (err) {
      console.error("Step 3 error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to confirm mint with backend"
      );
      setIsLoading(false);
      setCurrentStep(2);
    }
  }

  /**
   * Download QR codes package
   */
  async function handleDownloadQR() {
    if (!confirmedBatch?.batchId) return;

    try {
      const blob = await downloadQRPackage(confirmedBatch.batchId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${confirmedBatch.batchId}-qr-codes.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to download QR codes package");
    }
  }

  /**
   * Reset form and start over
   */
  function handleReset() {
    setForm({
      productName: "",
      batchId: "",
      mfgDate: "",
      expiryDate: "",
      quantity: "",
      description: "",
      disableScanAfterExpiry: true,
      maxValidations: 1,
      claimMode: "CONSUMER",
      resetAllowed: false,
      resetWindow: 24,
      maxResets: 0,
      mrp: "",
    });
    setFormErrors({});
    setCurrentStep(0);
    setCreatedBatch(null);
    setTxHash(null);
    setConfirmedBatch(null);
    setError(null);
    setEstimatedGas(null);
  }

  const isFormReady = useMemo(() => {
    return (
      form.productName.trim() &&
      form.batchId.trim() &&
      form.mfgDate &&
      form.expiryDate &&
      Number(form.quantity) > 0 &&
      isConnected &&
      isCorrectNet
    );
  }, [form, isConnected, isCorrectNet]);

  // ===========================================
  // RENDER
  // ===========================================
  return (
    <Sidebar>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* ========== HEADER ========== */}
          <section className="rounded-2xl border border-white/60 bg-white/90 p-5 shadow-lg backdrop-blur-sm md:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md">
                  <FaShieldAlt />
                  Manufacturer Mint Console
                </div>
                <h1 className="mt-3 text-xl sm:text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                  Create & Mint Medicine Batch
                </h1>
                <p className="mt-2 max-w-2xl text-xs sm:text-sm text-slate-600">
                  Follow the 3-step process: Backend creates batch → Blockchain
                  mint → Backend confirms
                </p>
              </div>

              {/* Wallet Card */}
              <div className="w-full rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-md lg:w-[360px] xl:w-[400px]">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Wallet Status
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {isConnected ? shortAddress : "Not connected"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Balance: {formattedBalance} ETH
                    </p>
                    {isConnected && (
                      <p className="mt-1 text-xs text-slate-600">
                        Network: {getNetworkName()}
                      </p>
                    )}
                  </div>
                  <FaWallet
                    className={`text-2xl ${
                      isConnected ? "text-emerald-500" : "text-slate-400"
                    }`}
                  />
                </div>

                {!isConnected ? (
                  <button
                    type="button"
                    onClick={connect}
                    className="mt-4 w-full rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg"
                  >
                    Connect Wallet
                  </button>
                ) : !isCorrectNet ? (
                  <button
                    type="button"
                    onClick={switchToCorrectNetwork}
                    className="mt-4 w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-amber-600"
                  >
                    Switch Network
                  </button>
                ) : (
                  <div className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-700">
                      <FaCheckCircle />
                      Ready to Mint
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ========== PROGRESS INDICATOR ========== */}
          {currentStep > 0 && (
            <section className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-lg backdrop-blur-sm">
              <h3 className="mb-4 text-sm font-semibold text-slate-700">
                Minting Progress
              </h3>
              <div className="flex items-center justify-between gap-1 sm:gap-2">
                {[
                  { step: 1, label: "Backend" },
                  { step: 2, label: "Blockchain" },
                  { step: 3, label: "Confirm" },
                  { step: 4, label: "Success" },
                ].map((item, idx) => (
                  <div key={item.step} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border-2 font-semibold text-xs sm:text-sm transition-all ${
                          currentStep >= item.step
                            ? "border-emerald-500 bg-emerald-500 text-white shadow-lg"
                            : "border-slate-300 bg-white text-slate-400"
                        }`}
                      >
                        {currentStep > item.step ? (
                          <FaCheckCircle />
                        ) : currentStep === item.step && isLoading ? (
                          <FaSpinner className="animate-spin" />
                        ) : (
                          item.step
                        )}
                      </div>
                      <span className="mt-1 sm:mt-2 text-xs font-medium text-slate-600 hidden sm:block">
                        {item.label}
                      </span>
                      <span className="mt-1 text-[10px] font-medium text-slate-600 sm:hidden">
                        {item.step}
                      </span>
                    </div>
                    {idx < 3 && (
                      <div
                        className={`h-0.5 sm:h-1 flex-1 transition-all mx-1 sm:mx-2 ${
                          currentStep > item.step
                            ? "bg-emerald-500"
                            : "bg-slate-200"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {error && (
                <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-4">
                  <div className="flex items-start gap-3">
                    <FaExclamationTriangle className="text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-800">
                        Error
                      </p>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ========== SUCCESS VIEW ========== */}
          {currentStep === 4 && confirmedBatch && (
            <section className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-lg">
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
                  <FaCheckCircle className="text-3xl" />
                </div>
                <h2 className="mt-4 text-2xl font-bold text-slate-900">
                  Batch Minted Successfully!
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Your batch has been created, minted on blockchain, and
                  confirmed.
                </p>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 text-left">
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-xs font-medium uppercase text-slate-500">
                      Batch ID
                    </p>
                    <p className="mt-1 font-mono text-sm font-semibold text-slate-900">
                      {confirmedBatch.batchId}
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-xs font-medium uppercase text-slate-500">
                      Bottles Created
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {confirmedBatch.bottlesCreated || form.quantity}
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-4 sm:col-span-2">
                    <p className="text-xs font-medium uppercase text-slate-500">
                      Transaction Hash
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="flex-1 truncate font-mono text-xs text-slate-700">
                        {txHash}
                      </p>
                      {txHash && (
                        <a
                          href={getExplorerUrl(txHash)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          <FaLink />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <button
                    type="button"
                    onClick={handleDownloadQR}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-indigo-700"
                  >
                    <FaDownload />
                    Download QR Package
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50"
                  >
                    Create New Batch
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* ========== FORM VIEW ========== */}
          {currentStep === 0 && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-1 xl:grid-cols-[1fr_380px]">
              {/* Main Form */}
              <section className="rounded-2xl border border-white/70 bg-white/95 p-5 shadow-lg backdrop-blur-sm md:p-7">
                <h2 className="text-lg font-semibold text-slate-900">
                  Batch Details
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Fill in all required fields to proceed with minting.
                </p>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Product Name */}
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">
                      Product Name <span className="text-red-500">*</span>
                    </span>
                    <input
                      name="productName"
                      value={form.productName}
                      onChange={handleChange}
                      placeholder="Paracetamol 500mg"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-indigo-200 transition focus:ring-2"
                    />
                    {formErrors.productName && (
                      <p className="text-xs text-rose-600">
                        {formErrors.productName}
                      </p>
                    )}
                  </label>

                  {/* Batch ID */}
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">
                      Batch ID <span className="text-red-500">*</span>
                    </span>
                    <input
                      name="batchId"
                      value={form.batchId}
                      onChange={handleChange}
                      placeholder="BATCH-20260208-001"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-indigo-200 transition focus:ring-2"
                    />
                    {formErrors.batchId && (
                      <p className="text-xs text-rose-600">
                        {formErrors.batchId}
                      </p>
                    )}
                  </label>

                  {/* Manufacturing Date */}
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">
                      Manufacturing Date <span className="text-red-500">*</span>
                    </span>
                    <input
                      type="date"
                      name="mfgDate"
                      value={form.mfgDate}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-indigo-200 transition focus:ring-2"
                    />
                    {formErrors.mfgDate && (
                      <p className="text-xs text-rose-600">
                        {formErrors.mfgDate}
                      </p>
                    )}
                  </label>

                  {/* Expiry Date */}
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">
                      Expiry Date <span className="text-red-500">*</span>
                    </span>
                    <input
                      type="date"
                      name="expiryDate"
                      value={form.expiryDate}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-indigo-200 transition focus:ring-2"
                    />
                    {formErrors.expiryDate && (
                      <p className="text-xs text-rose-600">
                        {formErrors.expiryDate}
                      </p>
                    )}
                  </label>

                  {/* Quantity */}
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">
                      Quantity (bottles) <span className="text-red-500">*</span>
                    </span>
                    <input
                      type="number"
                      min={1}
                      name="quantity"
                      value={form.quantity}
                      onChange={handleChange}
                      placeholder="1000"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-indigo-200 transition focus:ring-2"
                    />
                    {formErrors.quantity && (
                      <p className="text-xs text-rose-600">
                        {formErrors.quantity}
                      </p>
                    )}
                  </label>

                  {/* Max Validations */}
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">
                      Max Validation Scans
                    </span>
                    <input
                      type="number"
                      min={1}
                      name="maxValidations"
                      value={form.maxValidations}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-indigo-200 transition focus:ring-2"
                    />
                    {formErrors.maxValidations && (
                      <p className="text-xs text-rose-600">
                        {formErrors.maxValidations}
                      </p>
                    )}
                  </label>



                  {/* MRP */}
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">
                      MRP (₹)
                    </span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      name="mrp"
                      value={form.mrp}
                      onChange={handleChange}
                      placeholder="99.00"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-indigo-200 transition focus:ring-2"
                    />
                  </label>

                  {/* Description */}
                  <label className="space-y-1.5 sm:col-span-2">
                    <span className="text-sm font-medium text-slate-700">
                      Description (optional)
                    </span>
                    <textarea
                      rows={3}
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      placeholder="QC notes, packaging details, storage recommendations"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-indigo-200 transition focus:ring-2"
                    />
                  </label>

                  {/* Toggles */}
                  <div className="sm:col-span-2 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 cursor-pointer hover:bg-slate-100 transition">
                      <div>
                        <p className="text-sm font-medium text-slate-700">
                          Disable scan after expiry
                        </p>
                        <p className="text-xs text-slate-500">
                          Auto-block validations post expiry
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        name="disableScanAfterExpiry"
                        checked={form.disableScanAfterExpiry}
                        onChange={handleChange}
                        className="h-5 w-5 accent-indigo-600"
                      />
                    </label>

                    <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 cursor-pointer hover:bg-slate-100 transition">
                      <div>
                        <p className="text-sm font-medium text-slate-700">
                          Allow reset
                        </p>
                        <p className="text-xs text-slate-500">
                          Enable return/restock flow
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        name="resetAllowed"
                        checked={form.resetAllowed}
                        onChange={handleChange}
                        className="h-5 w-5 accent-indigo-600"
                      />
                    </label>
                  </div>

                  {/* Reset Options (Conditional) */}
                  {form.resetAllowed && (
                    <>
                      <label className="space-y-1.5">
                        <span className="text-sm font-medium text-slate-700">
                          Reset Window (hours)
                        </span>
                        <input
                          type="number"
                          min={1}
                          name="resetWindow"
                          value={form.resetWindow}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-indigo-200 transition focus:ring-2"
                        />
                        {formErrors.resetWindow && (
                          <p className="text-xs text-rose-600">
                            {formErrors.resetWindow}
                          </p>
                        )}
                      </label>

                      <label className="space-y-1.5">
                        <span className="text-sm font-medium text-slate-700">
                          Max Resets
                        </span>
                        <input
                          type="number"
                          min={0}
                          name="maxResets"
                          value={form.maxResets}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-indigo-200 transition focus:ring-2"
                        />
                        {formErrors.maxResets && (
                          <p className="text-xs text-rose-600">
                            {formErrors.maxResets}
                          </p>
                        )}
                      </label>
                    </>
                  )}


                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={estimateGas}
                    disabled={estimatingGas || !isConnected}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {estimatingGas ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <FaCube />
                    )}
                    {estimatingGas ? "Estimating..." : "Estimate Gas"}
                  </button>

                  <button
                    type="button"
                    disabled={!isFormReady || isLoading}
                    onClick={handleStep1_CreateBatch}
                    className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all ${
                      !isFormReady || isLoading
                        ? "cursor-not-allowed bg-slate-300"
                        : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl"
                    }`}
                  >
                    {isLoading ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <FaArrowRight />
                    )}
                    {isLoading ? "Processing..." : "Create & Mint Batch"}
                  </button>
                </div>

                {/* Gas Estimate Display */}
                {estimatedGas && (
                  <div className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                    <p className="text-xs font-semibold uppercase text-indigo-700">
                      Gas Estimate
                    </p>
                    <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-indigo-600">Gas Limit</p>
                        <p className="font-mono font-semibold text-indigo-900">
                          {estimatedGas.gasLimit}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-indigo-600">Gas Price</p>
                        <p className="font-mono font-semibold text-indigo-900">
                          {estimatedGas.gasPrice} gwei
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-indigo-600">Total Cost</p>
                        <p className="font-mono font-semibold text-indigo-900">
                          {estimatedGas.totalCost} ETH
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Sidebar */}
              <aside className="space-y-4">
                {/* Checklist */}
                <div className="rounded-2xl border border-white/70 bg-white/95 p-5 shadow-lg backdrop-blur-sm">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Pre-flight Checklist
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    <li className="flex items-start gap-2">
                      <FaCheckCircle
                        className={`mt-0.5 ${
                          isConnected ? "text-emerald-500" : "text-slate-300"
                        }`}
                      />
                      <span>Wallet connected</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheckCircle
                        className={`mt-0.5 ${
                          isCorrectNet ? "text-emerald-500" : "text-slate-300"
                        }`}
                      />
                      <span>Correct network</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheckCircle
                        className={`mt-0.5 ${
                          form.batchId ? "text-emerald-500" : "text-slate-300"
                        }`}
                      />
                      <span>Unique batch ID</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheckCircle
                        className={`mt-0.5 ${
                          form.expiryDate && form.mfgDate
                            ? "text-emerald-500"
                            : "text-slate-300"
                        }`}
                      />
                      <span>Valid dates</span>
                    </li>
                  </ul>
                </div>

                {/* Info Box */}
                <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 shadow-lg">
                  <h3 className="text-sm font-semibold text-blue-900">
                    How It Works
                  </h3>
                  <ol className="mt-3 space-y-2 text-sm text-blue-800">
                    <li className="flex gap-2">
                      <span className="font-semibold">1.</span>
                      <span>
                        Backend creates batch & generates QR codes
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold">2.</span>
                      <span>You sign blockchain transaction with MetaMask</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold">3.</span>
                      <span>Backend confirms mint with transaction hash</span>
                    </li>
                  </ol>
                </div>

                {/* Important Note */}
                <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-lg">
                  <div className="flex items-start gap-3">
                    <FaExclamationTriangle className="text-amber-600 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-amber-900">
                        Important
                      </h3>
                      <p className="mt-1 text-xs text-amber-800">
                        Do not close this page during the minting process.
                        Backend generates all QR codes and bottle IDs
                        automatically.
                      </p>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>
    </Sidebar>
  );
}
