import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import {
  getProvider,
  getSigner,
  getNetwork,
  isCorrectNetwork,
  switchNetwork,
  DEFAULT_NETWORK_ID,
  SUPPORTED_NETWORKS,
} from "../services/blockchain";

/**
 * Custom hook for managing MetaMask wallet connection
 * Handles connection, account changes, network changes, and balance
 */
export const useWallet = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isCorrectNet, setIsCorrectNet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize provider
  useEffect(() => {
    if (!window.ethereum) {
      setError("MetaMask is not installed");
      return;
    }

    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(browserProvider);
    } catch (err) {
      setError("Failed to initialize provider");
      console.error(err);
    }
  }, []);

  // Update wallet info
  const updateWalletInfo = useCallback(async (browserProvider) => {
    try {
      const currentSigner = await browserProvider.getSigner();
      const walletAddress = await currentSigner.getAddress();
      const walletBalance = await browserProvider.getBalance(walletAddress);
      const network = await browserProvider.getNetwork();
      const currentChainId = Number(network.chainId);

      setSigner(currentSigner);
      setAddress(walletAddress);
      setBalance(ethers.formatEther(walletBalance));
      setChainId(currentChainId);
      setIsConnected(true);
      setIsCorrectNet(currentChainId === DEFAULT_NETWORK_ID);
      setError(null);
    } catch (err) {
      setSigner(null);
      setAddress("");
      setBalance(null);
      setChainId(null);
      setIsConnected(false);
      setIsCorrectNet(false);
    }
  }, []);

  // Handle account changes
  const handleAccountsChanged = useCallback(
    async (accounts) => {
      if (!provider) return;

      if (!accounts || accounts.length === 0) {
        setSigner(null);
        setAddress("");
        setBalance(null);
        setIsConnected(false);
        return;
      }

      await updateWalletInfo(provider);
    },
    [provider, updateWalletInfo]
  );

  // Handle chain changes
  const handleChainChanged = useCallback(() => {
    window.location.reload();
  }, []);

  // Setup event listeners
  useEffect(() => {
    if (!window.ethereum || !provider) return;

    // Check if already connected
    provider
      .listAccounts()
      .then((accounts) => {
        if (accounts && accounts.length > 0) {
          updateWalletInfo(provider);
        }
      })
      .catch(console.error);

    // Listen for account changes
    window.ethereum.on("accountsChanged", handleAccountsChanged);

    // Listen for chain changes
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, [provider, updateWalletInfo, handleAccountsChanged, handleChainChanged]);

  // Connect wallet
  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError("MetaMask is not installed");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      await browserProvider.send("eth_requestAccounts", []);
      await browserProvider.getSigner();
      await updateWalletInfo(browserProvider);
      setProvider(browserProvider);
      return true;
    } catch (err) {
      console.error("Failed to connect wallet:", err);
      setError(err.message || "Failed to connect wallet");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [updateWalletInfo]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setSigner(null);
    setAddress("");
    setBalance(null);
    setChainId(null);
    setIsConnected(false);
    setIsCorrectNet(false);
  }, []);

  // Switch to correct network
  const switchToCorrectNetwork = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await switchNetwork(DEFAULT_NETWORK_ID);
      
      // Check if switch was successful
      const correct = await isCorrectNetwork(DEFAULT_NETWORK_ID);
      setIsCorrectNet(correct);
      setIsLoading(false);
      return correct;
    } catch (err) {
      console.error("Failed to switch network:", err);
      setError(err.message || "Failed to switch network");
      setIsLoading(false);
      return false;
    }
  }, []);

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    if (!provider || !address) return;

    try {
      const walletBalance = await provider.getBalance(address);
      setBalance(ethers.formatEther(walletBalance));
    } catch (err) {
      console.error("Failed to refresh balance:", err);
    }
  }, [provider, address]);

  // Get network name
  const getNetworkName = useCallback(() => {
    if (!chainId) return "Unknown";
    return SUPPORTED_NETWORKS[chainId]?.name || `Chain ID: ${chainId}`;
  }, [chainId]);

  return {
    // State
    provider,
    signer,
    address,
    balance,
    chainId,
    isConnected,
    isCorrectNet,
    isLoading,
    error,

    // Methods
    connect,
    disconnect,
    switchToCorrectNetwork,
    refreshBalance,
    getNetworkName,

    // Computed
    shortAddress: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "",
    formattedBalance: balance ? parseFloat(balance).toFixed(4) : "0.0000",
  };
};
