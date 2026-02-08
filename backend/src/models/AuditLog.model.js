import mongoose from "mongoose";

const transform = (doc, ret) => {
  delete ret._id;
  delete ret.__v;
  return ret;
};

const AuditLogSchema = new mongoose.Schema(
  {
    entityType: { type: String },
    entityId: { type: String },
    action: { type: String },
    actorId: { type: String },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

AuditLogSchema.index({ entityType: 1 });
AuditLogSchema.index({ entityId: 1 });
AuditLogSchema.index({ timestamp: -1 });

AuditLogSchema.set("toJSON", { transform });
AuditLogSchema.set("toObject", { transform });

export const AuditLog = mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema, "audit_logs");
