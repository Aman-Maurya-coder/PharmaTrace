import { ethers } from "ethers";
import pharmaTraceAbi from "../abis/PharmaTrace.json";

// ============================================
// CONTRACT CONFIGURATION
// ============================================

// Get contract details from environment variables or settings
// In production, these should come from your Settings page or .env file
const getContractConfig = () => {
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || 
    localStorage.getItem("contractAddress") ||
    "0x0000000000000000000000000000000000000000"; // Placeholder

  const contractABI = pharmaTraceAbi;

  return { contractAddress, contractABI };
};

// ============================================
// NETWORK CONFIGURATION
// ============================================

const SUPPORTED_NETWORKS = {
  // Sepolia Testnet
  11155111: {
    name: "Sepolia Testnet",
    rpcUrl: "https://ethereum-sepolia.publicnode.com",
    blockExplorer: "https://sepolia.etherscan.io",
    chainId: "0xaa36a7",
  },
  // Localhost / Hardhat
  31337: {
    name: "Localhost",
    rpcUrl: "http://127.0.0.1:8545",
    blockExplorer: null,
    chainId: "0x7a69",
  },
  // Add more networks as needed
};

const DEFAULT_NETWORK_ID = 11155111; // Sepolia by default

// ============================================
// WALLET & PROVIDER
// ============================================

/**
 * Check if MetaMask is installed
 */
export const isMetaMaskInstalled = () => {
  return typeof window !== "undefined" && Boolean(window.ethereum?.isMetaMask);
};

/**
 * Get the current provider
 */
export const getProvider = () => {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }
  return new ethers.BrowserProvider(window.ethereum);
};

/**
 * Get the current signer (connected wallet)
 */
export const getSigner = async () => {
  const provider = getProvider();
  return await provider.getSigner();
};

/**
 * Get the current network
 */
export const getNetwork = async () => {
  const provider = getProvider();
  return await provider.getNetwork();
};

/**
 * Check if user is on the correct network
 */
export const isCorrectNetwork = async (expectedChainId = DEFAULT_NETWORK_ID) => {
  try {
    const network = await getNetwork();
    return Number(network.chainId) === expectedChainId;
  } catch (error) {
    console.error("Error checking network:", error);
    return false;
  }
};

/**
 * Switch to the correct network
 */
export const switchNetwork = async (chainId = DEFAULT_NETWORK_ID) => {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  const networkConfig = SUPPORTED_NETWORKS[chainId];
  if (!networkConfig) {
    throw new Error(`Network ${chainId} is not supported`);
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: networkConfig.chainId }],
    });
    return true;
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: networkConfig.chainId,
              chainName: networkConfig.name,
              rpcUrls: [networkConfig.rpcUrl],
              blockExplorerUrls: networkConfig.blockExplorer ? [networkConfig.blockExplorer] : [],
            },
          ],
        });
        return true;
      } catch (addError) {
        throw new Error("Failed to add network to MetaMask");
      }
    }
    throw switchError;
  }
};

// ============================================
// CONTRACT INTERACTION
// ============================================

/**
 * Get contract instance
 */
export const getContract = async () => {
  const { contractAddress, contractABI } = getContractConfig();
  
  if (contractAddress === "0x0000000000000000000000000000000000000000") {
    throw new Error("Contract address not configured. Please set it in Settings.");
  }

  const signer = await getSigner();
  return new ethers.Contract(contractAddress, contractABI, signer);
};

/**
 * Step 2: Mint batch on blockchain
 * This is called AFTER backend creates the batch
 * 
 * @param {string} batchId - The batch ID from backend
 * @param {string} expiryDate - Expiry date in YYYY-MM-DD format
 * @param {string} merkleRoot - Merkle root from backend (as hex string)
 * @returns {Promise<{txHash: string, receipt: object}>}
 */
export const mintBatchOnChain = async (batchId, expiryDate, merkleRoot) => {
  try {
    // Check if on correct network
    const correctNetwork = await isCorrectNetwork();
    if (!correctNetwork) {
      throw new Error("Please switch to the correct network");
    }

    // Get contract instance
    const contract = await getContract();

    // Ensure caller is the manufacturer (contract owner)
    const signer = await getSigner();
    const signerAddress = (await signer.getAddress()).toLowerCase();
    const manufacturer = (await contract.manufacturer()).toLowerCase();
    if (signerAddress !== manufacturer) {
      throw new Error("Connected wallet is not the contract manufacturer");
    }

    // Convert expiry date to timestamp
    const expiryTimestamp = Math.floor(new Date(expiryDate).getTime() / 1000);
    if (!Number.isFinite(expiryTimestamp) || expiryTimestamp <= Math.floor(Date.now() / 1000)) {
      throw new Error("Expiry date must be a valid future date");
    }

    // Ensure merkleRoot is properly formatted
    const zeroHash = "0x0000000000000000000000000000000000000000000000000000000000000000";
    let formattedMerkleRoot = merkleRoot || zeroHash;
    if (typeof formattedMerkleRoot !== "string") {
      formattedMerkleRoot = zeroHash;
    }
    if (!formattedMerkleRoot.startsWith("0x")) {
      formattedMerkleRoot = "0x" + formattedMerkleRoot;
    }
    if (formattedMerkleRoot.length !== 66) {
      // If merkleRoot is not provided or invalid, use zero hash
      formattedMerkleRoot = zeroHash;
    }

    console.log("Minting batch on blockchain:", {
      batchId,
      expiryTimestamp,
      merkleRoot: formattedMerkleRoot,
    });

    // Call the mintBatch function
    const tx = await contract.mintBatch(
      batchId,
      expiryTimestamp,
      formattedMerkleRoot
    );

    console.log("Transaction sent:", tx.hash);

    // Wait for transaction confirmation
    const receipt = await tx.wait();

    console.log("Transaction confirmed:", receipt);

    return {
      txHash: receipt.hash,
      receipt,
    };
  } catch (error) {
    console.error("Blockchain mint error:", error);
    
    // Parse error messages
    if (error.code === "ACTION_REJECTED") {
      throw new Error("Transaction was rejected by user");
    } else if (error.code === "INSUFFICIENT_FUNDS") {
      throw new Error("Insufficient funds for transaction");
    } else if (error.message.includes("Contract address not configured")) {
      throw error;
    } else {
      throw new Error(error.message || "Failed to mint batch on blockchain");
    }
  }
};

/**
 * Get transaction details
 */
export const getTransaction = async (txHash) => {
  const provider = getProvider();
  return await provider.getTransaction(txHash);
};

/**
 * Get transaction receipt
 */
export const getTransactionReceipt = async (txHash) => {
  const provider = getProvider();
  return await provider.getTransactionReceipt(txHash);
};

/**
 * Estimate gas for minting
 */
export const estimateMintGas = async (batchId, expiryDate, merkleRoot) => {
  try {
    const contract = await getContract();
    const expiryTimestamp = Math.floor(new Date(expiryDate).getTime() / 1000);
    
    let formattedMerkleRoot = merkleRoot || "0x0000000000000000000000000000000000000000000000000000000000000000";
    if (!formattedMerkleRoot.startsWith("0x")) {
      formattedMerkleRoot = "0x" + formattedMerkleRoot;
    }

    const gasEstimate = await contract.mintBatch.estimateGas(
      batchId,
      expiryTimestamp,
      formattedMerkleRoot
    );

    const provider = getProvider();
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice || 0n;
    
    const totalCost = gasEstimate * gasPrice;
    const totalCostEth = ethers.formatEther(totalCost);

    return {
      gasLimit: gasEstimate.toString(),
      gasPrice: ethers.formatUnits(gasPrice, "gwei"),
      totalCost: totalCostEth,
    };
  } catch (error) {
    console.error("Gas estimation error:", error);
    throw new Error("Failed to estimate gas");
  }
};

/**
 * Get block explorer URL for transaction
 */
export const getExplorerUrl = (txHash, chainId = DEFAULT_NETWORK_ID) => {
  const network = SUPPORTED_NETWORKS[chainId];
  if (!network?.blockExplorer) {
    return null;
  }
  return `${network.blockExplorer}/tx/${txHash}`;
};

// Export network configuration
export { SUPPORTED_NETWORKS, DEFAULT_NETWORK_ID };
