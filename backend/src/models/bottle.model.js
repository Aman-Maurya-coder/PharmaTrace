import mongoose from "mongoose";

const transform = (doc, ret) => {
  delete ret._id;
  delete ret.__v;
  return ret;
};

const BottleSchema = new mongoose.Schema(
  {
    bottleId: { type: String, required: true },
    batchId: { type: String, required: true },
    qrTokenHash: { type: String, required: true },
    state: { type: String, default: "active" },
    manufacturedAt: { type: Date },
    claimedAt: { type: Date },
    claimedBy: { type: String },
    resetAt: { type: Date }
  },
  { timestamps: true }
);

BottleSchema.index({ bottleId: 1 }, { unique: true });
BottleSchema.index({ qrTokenHash: 1 }, { unique: true });
BottleSchema.index({ batchId: 1 });
BottleSchema.index({ state: 1 });
BottleSchema.index({ batchId: 1, state: 1 });

BottleSchema.set("toJSON", { transform });
BottleSchema.set("toObject", { transform });

export const Bottle = mongoose.models.Bottle || mongoose.model("Bottle", BottleSchema);
