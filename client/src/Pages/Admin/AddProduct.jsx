import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import {
  FaWallet,
  FaUpload,
  FaCheckCircle,
  FaSpinner,
  FaDownload,
  FaQrcode,
  FaTimes,
  FaShieldAlt,
  FaCube,
} from "react-icons/fa";
import QRCode from "react-qr-code";
import { v4 as uuidv4 } from "uuid";
import Sidebar from "../Components/Sidebar";
import { createBatch, confirmBatchMint } from "../../services/api";

export default function AddProduct() {
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

  const [modalOpen, setModalOpen] = useState(false);
  const [previewDigitalId, setPreviewDigitalId] = useState("");
  const [previewMetadata, setPreviewMetadata] = useState(null);

  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState(null);

  const [estimating, setEstimating] = useState(false);
  const [estimatedGas, setEstimatedGas] = useState(null);
  const [txLoading, setTxLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    if (!window.ethereum) return;

    const browserProvider = new ethers.BrowserProvider(window.ethereum);
    setProvider(browserProvider);

    const handleAccounts = async (accounts) => {
      try {
        if (!accounts?.length) {
          setSigner(null);
          setAddress("");
          setBalance(null);
          return;
        }
        const currentSigner = await browserProvider.getSigner();
        const walletAddress = await currentSigner.getAddress();
        const walletBalance = await browserProvider.getBalance(walletAddress);

        setSigner(currentSigner);
        setAddress(walletAddress);
        setBalance(ethers.formatEther(walletBalance));
      } catch {
        setSigner(null);
        setAddress("");
        setBalance(null);
      }
    };

    browserProvider
      .listAccounts()
      .then((accounts) => handleAccounts(accounts || []))
      .catch(() => {});

    window.ethereum?.on("accountsChanged", handleAccounts);
    window.ethereum?.on("chainChanged", () => window.location.reload());

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccounts);
    };
  }, []);

  async function connectWallet() {
    if (!window.ethereum) {
      alert("MetaMask is required to continue.");
      return;
    }

    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      await browserProvider.send("eth_requestAccounts", []);
      const currentSigner = await browserProvider.getSigner();
      const walletAddress = await currentSigner.getAddress();
      const walletBalance = await browserProvider.getBalance(walletAddress);

      setProvider(browserProvider);
      setSigner(currentSigner);
      setAddress(walletAddress);
      setBalance(ethers.formatEther(walletBalance));
    } catch {
      alert("Unable to connect wallet.");
    }
  }

  function handleChange(event) {
    const { name, type, value, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function handleImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEvent) => setImagePreview(loadEvent.target?.result || null);
    reader.readAsDataURL(file);
  }

  function validate() {
    const errors = {};
    if (!form.productName.trim()) errors.productName = "Product name is required.";
    if (!form.batchId.trim()) errors.batchId = "Batch ID is required.";
    if (!form.mfgDate) errors.mfgDate = "Manufacturing date is required.";
    if (!form.expiryDate) errors.expiryDate = "Expiry date is required.";
    if (form.mfgDate && form.expiryDate && form.mfgDate > form.expiryDate) {
      errors.expiryDate = "Expiry must be after manufacturing date.";
    }
    if (!form.totalUnits || Number(form.totalUnits) <= 0) {
      errors.totalUnits = "Enter a valid unit count.";
    }
    if (!Number.isInteger(Number(form.maxValidations)) || Number(form.maxValidations) < 1) {
      errors.maxValidations = "Use an integer value greater than 0.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function estimateGas() {
    if (!provider || !address) {
      alert("Connect wallet first.");
      return;
    }

    setEstimating(true);
    setEstimatedGas(null);

    try {
      const feeData = await provider.getFeeData();
      const gasPrice = feeData?.gasPrice || 0n;
      const estimatedUnits = 120000n;
      const feeWei = gasPrice * estimatedUnits;
      const feeEth = Number(ethers.formatEther(feeWei)).toFixed(6);
      setEstimatedGas({ units: estimatedUnits.toString(), eth: feeEth });
    } catch {
      setEstimatedGas(null);
    } finally {
      setEstimating(false);
    }
  }

  function openPreviewModal() {
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const digitalId = uuidv4();
    const metadata = {
      digitalId,
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

    setPreviewDigitalId(digitalId);
    setPreviewMetadata(metadata);
    setModalOpen(true);
  }

  function downloadQR(digitalId) {
    const container = document.getElementById("qr-code-container");
    const svg = container?.querySelector("svg");
    if (!svg) return;

    const source = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${form.batchId || "batch"}-${digitalId}-qr.svg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function confirmAndMint() {
    if (!signer) {
      alert("Connect wallet first.");
      return;
    }
    if (!previewDigitalId || !previewMetadata) {
      alert("Batch preview not available.");
      return;
    }

    setTxLoading(true);
    setTxHash(null);
    setSuccessData(null);

    try {
      const tx = await signer.sendTransaction({ to: address, value: 0n });
      const receipt = await tx.wait();
      const hash = receipt?.hash ?? tx.hash;
      setTxHash(hash);

      let persistedBatchId = form.batchId;
      try {
        const createdBatch = await createBatch({
          productName: form.productName,
          batchId: form.batchId,
          mfgDate: form.mfgDate,
          expiryDate: form.expiryDate,
          totalUnits: Number(form.totalUnits),
          description: form.description,
          restAllowed: !!form.restAllowed,
          disableScanAfterExpiry: !!form.disableScanAfterExpiry,
          maxValidations: Number(form.maxValidations),
          metadata: previewMetadata,
        });

        persistedBatchId = createdBatch?.batchId || createdBatch?.id || form.batchId;

        await confirmBatchMint(persistedBatchId, {
          txHash: hash,
          walletAddress: address,
          digitalId: previewDigitalId,
          metadata: previewMetadata,
        });
      } catch {
        alert("Mint succeeded on-chain, but backend sync failed.");
      }

      setSuccessData({
        digitalId: previewDigitalId,
        backendBatchId: persistedBatchId,
        explorer: `https://sepolia.etherscan.io/tx/${hash}`,
      });
    } catch {
      alert("Transaction failed.");
    } finally {
      setTxLoading(false);
    }
  }

  const isFormReady = useMemo(() => {
    return (
      form.productName.trim() &&
      form.batchId.trim() &&
      form.mfgDate &&
      form.expiryDate &&
      Number(form.totalUnits) > 0
    );
  }, [form]);

  return (
    <Sidebar>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#e2e8f0,_#f8fafc_45%,_#eef2ff)] p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <section className="rounded-2xl border border-white/60 bg-white/90 p-5 shadow-sm backdrop-blur md:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                  <FaShieldAlt />
                  Manufacturer Mint Console
                </div>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
                  Create and mint a medicine batch
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                  Enter batch details, review generated metadata, then confirm mint on-chain with backend sync.
                </p>
              </div>

              <div className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 lg:w-[350px]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Wallet</p>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Balance: {balance ? `${Number(balance).toFixed(4)} ETH` : "-"}
                    </p>
                  </div>
                  <FaWallet className="text-slate-400" />
                </div>
                <button
                  type="button"
                  onClick={connectWallet}
                  className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
                >
                  {address ? "Wallet Connected" : "Connect Wallet"}
                </button>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
            <section className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-sm md:p-7">
              <h2 className="text-lg font-semibold text-slate-900">Batch details</h2>
              <p className="mt-1 text-sm text-slate-500">Fields marked required are needed before review.</p>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">Product name</span>
                  <input
                    name="productName"
                    value={form.productName}
                    onChange={handleChange}
                    placeholder="Paracetamol 500mg"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-indigo-200 transition focus:ring"
                  />
                  {formErrors.productName && <p className="text-xs text-rose-600">{formErrors.productName}</p>}
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">Batch ID</span>
                  <input
                    name="batchId"
                    value={form.batchId}
                    onChange={handleChange}
                    placeholder="BATCH-20260208-001"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-indigo-200 transition focus:ring"
                  />
                  {formErrors.batchId && <p className="text-xs text-rose-600">{formErrors.batchId}</p>}
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">Manufacturing date</span>
                  <input
                    type="date"
                    name="mfgDate"
                    value={form.mfgDate}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-indigo-200 transition focus:ring"
                  />
                  {formErrors.mfgDate && <p className="text-xs text-rose-600">{formErrors.mfgDate}</p>}
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">Expiry date</span>
                  <input
                    type="date"
                    name="expiryDate"
                    value={form.expiryDate}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-indigo-200 transition focus:ring"
                  />
                  {formErrors.expiryDate && <p className="text-xs text-rose-600">{formErrors.expiryDate}</p>}
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">Total units</span>
                  <input
                    type="number"
                    min={1}
                    name="totalUnits"
                    value={form.totalUnits}
                    onChange={handleChange}
                    placeholder="1000"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-indigo-200 transition focus:ring"
                  />
                  {formErrors.totalUnits && <p className="text-xs text-rose-600">{formErrors.totalUnits}</p>}
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">Max validations per unit</span>
                  <input
                    type="number"
                    min={1}
                    name="maxValidations"
                    value={form.maxValidations}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-indigo-200 transition focus:ring"
                  />
                  {formErrors.maxValidations && <p className="text-xs text-rose-600">{formErrors.maxValidations}</p>}
                </label>

                <label className="space-y-1.5 sm:col-span-2">
                  <span className="text-sm font-medium text-slate-700">Description (optional)</span>
                  <textarea
                    rows={3}
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="QC notes, packaging details, storage recommendations"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-indigo-200 transition focus:ring"
                  />
                </label>

                <div className="sm:col-span-2 grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-slate-700">Allow return or restock</p>
                      <p className="text-xs text-slate-500">Enables return flow for bottles.</p>
                    </div>
                    <input
                      type="checkbox"
                      name="restAllowed"
                      checked={!!form.restAllowed}
                      onChange={handleChange}
                      className="h-4 w-4 accent-emerald-600"
                    />
                  </label>

                  <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-slate-700">Disable scans after expiry</p>
                      <p className="text-xs text-slate-500">Auto-block late validations.</p>
                    </div>
                    <input
                      type="checkbox"
                      name="disableScanAfterExpiry"
                      checked={!!form.disableScanAfterExpiry}
                      onChange={handleChange}
                      className="h-4 w-4 accent-emerald-600"
                    />
                  </label>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-sm font-medium text-slate-700">Batch image (optional)</span>
                  <div className="mt-2 flex flex-col gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 sm:flex-row sm:items-center">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100">
                      <FaUpload />
                      Upload image
                      <input type="file" accept="image/*" onChange={handleImage} hidden />
                    </label>
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Batch preview"
                        className="h-20 w-20 rounded-lg border border-slate-200 object-cover"
                      />
                    ) : (
                      <div className="text-xs text-slate-500">No image selected.</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={estimateGas}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  {estimating ? <FaSpinner className="animate-spin" /> : <FaCube />}
                  {estimating ? "Estimating..." : "Estimate Network Fee"}
                </button>

                <button
                  type="button"
                  disabled={!isFormReady}
                  onClick={openPreviewModal}
                  className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition ${
                    !isFormReady
                      ? "cursor-not-allowed bg-slate-300"
                      : "bg-emerald-600 hover:bg-emerald-500"
                  }`}
                >
                  <FaQrcode />
                  Review Batch
                </button>

                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
                  {estimatedGas
                    ? `Estimated: ${estimatedGas.units} gas (~${estimatedGas.eth} ETH)`
                    : "Estimate fee before minting to check network cost."}
                </div>
              </div>
            </section>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900">Minting checklist</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  <li>Use a unique batch ID per production run.</li>
                  <li>Double-check dates to avoid invalid records.</li>
                  <li>Review QR and metadata before confirming mint.</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900">Last minted batch</h3>
                {!successData ? (
                  <p className="mt-3 text-sm text-slate-500">No successful mint in this session.</p>
                ) : (
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700">
                      <FaCheckCircle className="mr-2 inline" />
                      Minted successfully
                    </div>
                    <p className="text-slate-600">Digital ID: {successData.digitalId}</p>
                    <a
                      href={successData.explorer}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block text-indigo-600 underline"
                    >
                      View transaction
                    </a>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Batch review and mint confirmation</h3>
                <p className="text-xs text-slate-500">Verify details before sending transaction.</p>
              </div>
              <button
                type="button"
                onClick={() => !txLoading && setModalOpen(false)}
                className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <FaTimes />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 p-5 md:grid-cols-2">
              <div className="space-y-3 text-sm text-slate-700">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Digital ID</p>
                  <p className="mt-1 break-all font-mono">{previewDigitalId}</p>
                </div>

                <div className="rounded-lg border border-slate-200 p-3">
                  <p><strong>Product:</strong> {previewMetadata?.productName}</p>
                  <p><strong>Batch ID:</strong> {previewMetadata?.batchId}</p>
                  <p><strong>MFG:</strong> {previewMetadata?.mfgDate}</p>
                  <p><strong>EXP:</strong> {previewMetadata?.expiryDate}</p>
                  <p><strong>Total Units:</strong> {previewMetadata?.totalUnits}</p>
                  <p><strong>Max Validations:</strong> {previewMetadata?.maxValidations}</p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4">
                <div id="qr-code-container" className="rounded-xl border border-slate-200 bg-white p-4">
                  <QRCode value={`medicinebatch:${previewDigitalId}`} size={190} />
                </div>

                <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => downloadQR(previewDigitalId)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    <FaDownload />
                    Download QR
                  </button>
                  <button
                    type="button"
                    onClick={confirmAndMint}
                    disabled={txLoading}
                    className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition ${
                      txLoading ? "cursor-wait bg-indigo-300" : "bg-indigo-600 hover:bg-indigo-500"
                    }`}
                  >
                    {txLoading ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
                    {txLoading ? "Minting..." : "Confirm and Mint"}
                  </button>
                </div>

                {txHash && (
                  <a
                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-indigo-600 underline"
                  >
                    Open transaction on explorer
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Sidebar>
  );
}
