# Smart Contract Update Guide

## 🔧 Adding mintBatch Function to PharmaTrace.sol

The frontend implementation requires a `mintBatch()` function in your smart contract. Here's what needs to be added:

---

## 📝 Changes Required

### 1. Add Batch Storage Structure

```solidity
struct Batch {
    string batchId;
    uint256 expiryTimestamp;
    bytes32 merkleRoot;
    address minter;
    bool exists;
}

mapping(string => Batch) public batches;
```

### 2. Add BatchMinted Event

```solidity
event BatchMinted(
    string indexed batchId,
    uint256 expiryTimestamp,
    bytes32 merkleRoot,
    address indexed minter
);
```

### 3. Add mintBatch Function

```solidity
function mintBatch(
    string memory batchId,
    uint256 expiryTimestamp,
    bytes32 merkleRoot
) external onlyManufacturer returns (bool) {
    require(!batches[batchId].exists, "Batch already minted");
    require(expiryTimestamp > block.timestamp, "Expiry must be in future");
    require(bytes(batchId).length > 0, "Batch ID cannot be empty");

    batches[batchId] = Batch({
        batchId: batchId,
        expiryTimestamp: expiryTimestamp,
        merkleRoot: merkleRoot,
        minter: msg.sender,
        exists: true
    });

    emit BatchMinted(batchId, expiryTimestamp, merkleRoot, msg.sender);
    return true;
}
```

### 4. Add Helper Functions (Optional but Recommended)

```solidity
function getBatch(string memory batchId) external view returns (Batch memory) {
    require(batches[batchId].exists, "Batch does not exist");
    return batches[batchId];
}

function isBatchValid(string memory batchId) external view returns (bool) {
    if (!batches[batchId].exists) return false;
    if (batches[batchId].expiryTimestamp < block.timestamp) return false;
    return true;
}
```

---

## 🚀 Deployment Steps

### 1. Update Contract File

Replace your existing `contracts/PharmaTrace.sol` with the updated version in `PharmaTrace_Updated.sol`

### 2. Compile Contract

```bash
cd contracts
npx hardhat compile
```

### 3. Deploy to Network

```bash
# For local testing
npx hardhat run scripts/deploy.js --network localhost

# For Sepolia testnet
npx hardhat run scripts/deploy.js --network sepolia

# For mainnet (production)
npx hardhat run scripts/deploy.js --network mainnet
```

### 4. Update Frontend Configuration

After deployment, update the contract address in the frontend:

```bash
cd ../client
```

Edit `.env` file:
```env
VITE_CONTRACT_ADDRESS=0xYourNewContractAddress
```

Or set it in the Settings page of the application.

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Contract deployed successfully
- [ ] Contract address noted and saved
- [ ] Frontend `.env` updated with new address
- [ ] Test mint a sample batch
- [ ] Verify transaction on block explorer
- [ ] Check BatchMinted event is emitted
- [ ] Test getBatch() function returns correct data

---

## 🧪 Testing the Contract

### Using Hardhat Console

```javascript
// Attach to deployed contract
const PharmaTrace = await ethers.getContractFactory("PharmaTrace");
const contract = await PharmaTrace.attach("0xYourContractAddress");

// Test minting a batch
const batchId = "TEST-BATCH-001";
const expiryTimestamp = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60); // 1 year from now
const merkleRoot = "0x0000000000000000000000000000000000000000000000000000000000000001";

const tx = await contract.mintBatch(batchId, expiryTimestamp, merkleRoot);
await tx.wait();

// Check if batch was minted
const batch = await contract.getBatch(batchId);
console.log("Batch:", batch);

// Check if batch is valid
const isValid = await contract.isBatchValid(batchId);
console.log("Is Valid:", isValid);
```

---

## 📊 Gas Estimation

Approximate gas costs for mintBatch function:
- **Deployment**: ~1,500,000 gas
- **First mint**: ~100,000 gas
- **Subsequent mints**: ~85,000 gas

On Sepolia:
- At 1 gwei: ~0.0001 ETH per mint
- At 10 gwei: ~0.001 ETH per mint

---

## 🔐 Security Considerations

1. ✅ `onlyManufacturer` modifier ensures only authorized address can mint
2. ✅ Duplicate batch prevention with `exists` check
3. ✅ Expiry validation prevents backdated batches
4. ✅ Empty batch ID rejection
5. ✅ Immutable batch data once minted

---

## 📖 Full Updated Contract

See `PharmaTrace_Updated.sol` for the complete contract with all changes integrated.

---

## 🆘 Need Help?

If you encounter issues:

1. **Compilation errors**: Check Solidity version (^0.8.20)
2. **Deployment fails**: Ensure sufficient ETH in deployer wallet
3. **Transaction reverts**: Check error message in console
4. **Frontend can't connect**: Verify contract address in `.env`

---

## 🎯 Next Steps

After successful deployment:

1. Update frontend `.env` with new contract address
2. Test the full flow: Create batch → Mint → Confirm
3. Verify all 3 steps complete successfully
4. Download QR package and verify bottles created
5. Move to production when ready

---

**Ready to deploy!** 🚀
