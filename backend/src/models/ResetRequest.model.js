import mongoose from "mongoose";

const transform = (doc, ret) => {
  delete ret._id;
  delete ret.__v;
  return ret;
};

const ResetRequestSchema = new mongoose.Schema(
  {
    bottleId: { type: String },
    status: { type: String, default: "pending" },
    reason: { type: String },
    requestedBy: { type: String },
    approvedBy: { type: String }
  },
  { timestamps: true }
);

ResetRequestSchema.index({ bottleId: 1 });
ResetRequestSchema.index({ status: 1 });
ResetRequestSchema.index({ createdAt: 1 });

ResetRequestSchema.set("toJSON", { transform });
ResetRequestSchema.set("toObject", { transform });

export const ResetRequest = mongoose.models.ResetRequest || mongoose.model("ResetRequest", ResetRequestSchema, "reset_requests");
