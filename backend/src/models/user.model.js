import mongoose from "mongoose";

const transform = (doc, ret) => {
  delete ret._id;
  delete ret.__v;
  return ret;
};

const UserSchema = new mongoose.Schema(
  {
    clerkUserId: { type: String, index: true },
    walletAddress: { type: String, unique: true, sparse: true },
    role: { type: String, index: true, default: "user" },
    email: { type: String },
    name: { type: String }
  },
  { timestamps: true }
);

UserSchema.set("toJSON", { transform });
UserSchema.set("toObject", { transform });

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
