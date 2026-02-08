import axios from "axios";

export const validateMedicine = (medicineHash) =>
  axios.post("/scan/validate", { medicineHash });

export const claimMedicine = (medicineHash) =>
  axios.post("/scan/claim", { medicineHash });
