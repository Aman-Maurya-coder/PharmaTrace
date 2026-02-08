import mongoose from "mongoose";

const transform = (doc, ret) => {
  delete ret._id;
  delete ret.__v;
  return ret;
};

const BatchSchema = new mongoose.Schema(
  {
    batchId: { type: String, required: true },
    manufacturerId: { type: String },
    productId: { type: String },
    name: { type: String },
    productName: { type: String },
    companyName: { type: String },
    size: { type: Number },
    quantity: { type: Number },
    expiresAt: { type: Date },
    status: { type: String, default: "active" },
    mintedAt: { type: Date },
    bottleCount: { type: Number, default: 0 },
    merkleRoot: { type: String },
    mintTxHash: { type: String }
  },
  { timestamps: true }
);

BatchSchema.index({ batchId: 1 }, { unique: true });
BatchSchema.index({ manufacturerId: 1 });
BatchSchema.index({ createdAt: 1 });

BatchSchema.set("toJSON", { transform });
BatchSchema.set("toObject", { transform });

export const Batch = mongoose.models.Batch || mongoose.model("Batch", BatchSchema);
