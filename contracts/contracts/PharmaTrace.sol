// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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
    // Medicine State Machine
    // ─────────────────────────────────────────────

    enum MedicineState {
        ACTIVE,        // Can be sold / claimed
        CLAIMED,       // Sold to consumer (one-time)
        INVALIDATED    // Recalled / unsafe / expired
    }

    mapping(bytes32 => MedicineState) public medicineState;
    mapping(bytes32 => uint256) public medicineBatch;

    // ─────────────────────────────────────────────
    // Events (analytics & audit)
    // ─────────────────────────────────────────────

    event MedicineActivated(bytes32 indexed medicineHash, uint256 batchId);
    event MedicineClaimed(bytes32 indexed medicineHash, address indexed claimer);
    event MedicineInvalidated(bytes32 indexed medicineHash, string reason);

    // ─────────────────────────────────────────────
    // Manufacturer Actions
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

    // ─────────────────────────────────────────────
    // Consumer Action (ONE TIME)
    // ─────────────────────────────────────────────

    function claimMedicine(bytes32 medicineHash) external {
        require(
            medicineState[medicineHash] == MedicineState.ACTIVE,
            "Medicine not claimable"
        );

        medicineState[medicineHash] = MedicineState.CLAIMED;
        emit MedicineClaimed(medicineHash, msg.sender);
    }

    // ─────────────────────────────────────────────
    // Read-only Validation
    // ─────────────────────────────────────────────

    function validateMedicine(bytes32 medicineHash)
        external
        view
        returns (MedicineState)
    {
        return medicineState[medicineHash];
    }
}
