// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * PharmaTrace - Enhanced with Batch Minting
 * 
 * This is an updated version of your existing contract with the mintBatch function added.
 * The mintBatch function is required for the frontend batch minting flow.
 */
contract PharmaTrace {

    address public manufacturer;

    constructor() {
        manufacturer = msg.sender;
    }

    modifier onlyManufacturer() {
        require(msg.sender == manufacturer, "Not authorized");
        _;
    }

    // ─────────────────────────────────────────────
    // Batch Information Storage
    // ─────────────────────────────────────────────

    struct Batch {
        string batchId;
        uint256 expiryTimestamp;
        bytes32 merkleRoot;
        address minter;
        bool exists;
    }

    mapping(string => Batch) public batches;

    // ─────────────────────────────────────────────
    // Medicine State Machine (Existing)
    // ─────────────────────────────────────────────

    enum MedicineState {
        ACTIVE,        // Can be sold / claimed
        CLAIMED,       // Sold to consumer (one-time)
        INVALIDATED    // Recalled / unsafe / expired
    }

    mapping(bytes32 => MedicineState) public medicineState;
    mapping(bytes32 => uint256) public medicineBatch;

    // ─────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────

    event MedicineActivated(bytes32 indexed medicineHash, uint256 batchId);
    event MedicineClaimed(bytes32 indexed medicineHash, address indexed claimer);
    event MedicineInvalidated(bytes32 indexed medicineHash, string reason);

    // NEW: Event for batch minting
    event BatchMinted(
        string indexed batchId,
        uint256 expiryTimestamp,
        bytes32 merkleRoot,
        address indexed minter
    );

    // ─────────────────────────────────────────────
    // NEW: Batch Minting Function
    // ─────────────────────────────────────────────

    /**
     * @dev Mint a new batch on the blockchain
     * This function is called by the frontend after backend creates the batch
     * 
     * @param batchId Unique batch identifier from backend
     * @param expiryTimestamp Unix timestamp of batch expiry
     * @param merkleRoot Root hash of all bottles in the batch (from backend)
     * @return success Boolean indicating successful mint
     */
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

    /**
     * @dev Get batch information
     * @param batchId The batch identifier
     * @return Batch struct with all information
     */
    function getBatch(string memory batchId) external view returns (Batch memory) {
        require(batches[batchId].exists, "Batch does not exist");
        return batches[batchId];
    }

    /**
     * @dev Check if batch exists and is not expired
     * @param batchId The batch identifier
     * @return Boolean indicating if batch is valid
     */
    function isBatchValid(string memory batchId) external view returns (bool) {
        if (!batches[batchId].exists) return false;
        if (batches[batchId].expiryTimestamp < block.timestamp) return false;
        return true;
    }

    // ─────────────────────────────────────────────
    // Existing Functions (Keep these as-is)
    // ─────────────────────────────────────────────

    function activateMedicine(bytes32 medicineHash, uint256 batchId)
        external
        onlyManufacturer
    {
        medicineState[medicineHash] = MedicineState.ACTIVE;
        medicineBatch[medicineHash] = batchId;

        emit MedicineActivated(medicineHash, batchId);
    }

    function invalidateMedicine(bytes32 medicineHash, string calldata reason)
        external
        onlyManufacturer
    {
        medicineState[medicineHash] = MedicineState.INVALIDATED;
        emit MedicineInvalidated(medicineHash, reason);
    }

    function claimMedicine(bytes32 medicineHash) external {
        require(
            medicineState[medicineHash] == MedicineState.ACTIVE,
            "Medicine not claimable"
        );

        medicineState[medicineHash] = MedicineState.CLAIMED;
        emit MedicineClaimed(medicineHash, msg.sender);
    }

    function validateMedicine(bytes32 medicineHash)
        external
        view
        returns (MedicineState)
    {
        return medicineState[medicineHash];
    }
}
