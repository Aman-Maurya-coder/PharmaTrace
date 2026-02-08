import mongoose from "mongoose";

const transform = (doc, ret) => {
  delete ret._id;
  delete ret.__v;
  return ret;
};

const ScanLogSchema = new mongoose.Schema(
  {
    qrTokenHash: { type: String },
    bottleId: { type: String },
    timestamp: { type: Date, default: Date.now },
    geo: {
      location: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point"
        },
        coordinates: { type: [Number], default: [0, 0] }
      }
    },
    deviceHash: { type: String }
  },
  { timestamps: true }
);

ScanLogSchema.index({ qrTokenHash: 1 });
ScanLogSchema.index({ timestamp: -1 });
ScanLogSchema.index({ "geo.location": "2dsphere" });
ScanLogSchema.index({ deviceHash: 1 });

ScanLogSchema.set("toJSON", { transform });
ScanLogSchema.set("toObject", { transform });

export const ScanLog = mongoose.models.ScanLog || mongoose.model("ScanLog", ScanLogSchema, "scan_logs");
