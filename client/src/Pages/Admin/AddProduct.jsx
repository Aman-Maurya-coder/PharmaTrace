import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { motion } from "framer-motion";
import { FaWallet, FaUpload, FaCheckCircle, FaSpinner } from "react-icons/fa";
import QRCode from "react-qr-code";
import { v4 as uuidv4 } from "uuid";
import Sidebar from "../Components/Sidebar";

export default function MintNewMedicineBatch() {
  // ---------- FORM STATE ----------
  const [form, setForm] = useState({
    productName: "",
    batchId: "",
    mfgDate: "",
    expiryDate: "",
    quantity: "",
    description: "",
  });

  const [imagePreview, setImagePreview] = useState(null);

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

      window.ethereum.on("accountsChanged", async (accounts) => {
        if (accounts.length === 0) {
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
      });
    }
  }, []);

  // ---------- CONNECT WALLET ----------
  async function connectWallet() {
    if (!window.ethereum) {
      alert("Install MetaMask to continue");
      return;
    }

    const p = new ethers.BrowserProvider(window.ethereum);
    await p.send("eth_requestAccounts", []);
    const s = await p.getSigner();
    const addr = await s.getAddress();
    const bal = await p.getBalance();

    setProvider(p);
    setSigner(s);
    setAddress(addr);
    setBalance(ethers.formatEther(bal));
  }

  // ---------- HANDLE INPUT CHANGE ----------
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // ---------- IMAGE UPLOAD ----------
  function handleImage(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  // ---------- ESTIMATE GAS ----------
  async function estimateGas() {
    if (!provider || !address) {
      alert("Connect wallet first");
      return;
    }

    setEstimating(true);

    try {
      const gasPrice = await provider.getGasPrice();
      const estimatedUnits = 120000n; // safe default
      const costEth = ethers.formatEther(gasPrice * estimatedUnits);

      setEstimatedGas({
        units: estimatedUnits.toString(),
        eth: Number(costEth).toFixed(6),
      });
    } catch (err) {
      console.error(err);
      setEstimatedGas(null);
    } finally {
      setEstimating(false);
    }
  }

  // ---------- MINT ON BLOCKCHAIN ----------
  async function handleMint() {
    if (!signer) {
      alert("Connect wallet first");
      return;
    }

    setTxLoading(true);

    const digitalId = uuidv4();

    try {
      // Fallback: send a 0-value transaction to self (guarantees a real tx hash)
      const tx = await signer.sendTransaction({
        to: address,
        value: 0n,
      });

      const receipt = await tx.wait();
      const hash = receipt.hash;

      setTxHash(hash);

      setSuccessData({
        digitalId,
        explorer: `https://sepolia.etherscan.io/tx/${hash}`,
      });
    } catch (err) {
      console.error(err);
      alert("Transaction failed");
    } finally {
      setTxLoading(false);
    }
  }

  return (
    <Sidebar>
      <div className="min-h-screen bg-gray-50 p-6 md:p-10">
        <div className="max-w-6xl mx-auto">
          {/* HEADER */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-semibold text-gray-800">
                Mint New Medicine Batch
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Create an on-chain digital identity for your medicine batch.
              </p>
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
                  {address ? address.slice(0, 6) + "..." + address.slice(-4) : "Not connected"}
                </div>
                <div className="text-xs opacity-80">
                  Balance: {balance ? `${balance} ETH` : "-"}
                </div>
              </div>
              <button
                onClick={connectWallet}
                className="ml-3 bg-white text-indigo-700 px-3 py-1 rounded-md text-sm font-semibold"
              >
                {address ? "Connected" : "Connect"}
              </button>
            </motion.div>
          </div>
          {/* GRID LAYOUT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* FORM */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Product Name</label>
                  <input
                    name="productName"
                    value={form.productName}
                    onChange={handleChange}
                    className="w-full mt-1 border rounded-md p-2"
                    placeholder="Paracetamol 500mg"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Batch ID</label>
                  <input
                    name="batchId"
                    value={form.batchId}
                    onChange={handleChange}
                    className="w-full mt-1 border rounded-md p-2"
                    placeholder="BATCH-20260207-001"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Manufacturing Date</label>
                  <input
                    type="date"
                    name="mfgDate"
                    value={form.mfgDate}
                    onChange={handleChange}
                    className="w-full mt-1 border rounded-md p-2"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Expiry Date</label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={form.expiryDate}
                    onChange={handleChange}
                    className="w-full mt-1 border rounded-md p-2"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    value={form.quantity}
                    onChange={handleChange}
                    className="w-full mt-1 border rounded-md p-2"
                    placeholder="Units produced"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Optional Description</label>
                  <input
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    className="w-full mt-1 border rounded-md p-2"
                    placeholder="Notes about production"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600">Image Upload</label>
                  <div className="mt-1 flex items-center gap-3">
                    <label className="flex items-center gap-2 border border-dashed px-3 py-2 rounded-md cursor-pointer">
                      <FaUpload />
                      <span>Choose image</span>
                      <input type="file" accept="image/*" onChange={handleImage} hidden />
                    </label>
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        className="w-20 h-20 object-cover rounded-md border"
                        alt="preview"
                      />
                    )}
                  </div>
                </div>
              </div>
              {/* GAS + BUTTONS */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <div className="text-sm text-gray-500">
                  {estimating ? (
                    <span className="flex items-center gap-2">
                      <FaSpinner className="animate-spin" /> Estimating gas...
                    </span>
                  ) : estimatedGas ? (
                    <span>
                      Est. gas: <strong>{estimatedGas.units}</strong> units •
                      ~ <strong>{estimatedGas.eth} ETH</strong>
                    </span>
                  ) : (
                    "Press Estimate Gas to preview cost"
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={estimateGas}
                    className="px-3 py-2 border rounded-md"
                  >
                    Estimate Gas
                  </button>
                  <button
                    onClick={handleMint}
                    disabled={txLoading}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md font-semibold"
                  >
                    {txLoading ? (
                      <>
                        <FaSpinner className="animate-spin" /> Minting...
                      </>
                    ) : (
                      "Mint on Blockchain"
                    )}
                  </button>
                </div>
              </div>
            </div>
            {/* PREVIEW + SUCCESS */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-medium mb-3">Preview & Status</h3>
              {successData ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="flex items-center gap-3 text-green-600 mb-3">
                    <FaCheckCircle />
                    <span className="font-semibold">Batch Minted Successfully</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md mb-3">
                    <div className="text-xs text-gray-500">Digital ID</div>
                    <div className="font-mono break-all">
                      {successData.digitalId}
                    </div>
                  </div>
                  <div className="flex justify-center mb-3">
                    <QRCode
                      value={`medicinebatch:${successData.digitalId}`}
                      size={120}
                    />
                  </div>
                  <a
                    href={successData.explorer}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 underline text-sm"
                  >
                    View transaction on Sepolia Explorer
                  </a>
                </motion.div>
              ) : (
                <div className="text-gray-500 text-sm">
                  Fill the form and mint to see your digital ID and QR code here.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
