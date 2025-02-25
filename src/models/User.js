import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    roles: [{ type: String, enum: ["user", "admin", "manager"], default: ["user"] }],  // 👈 Multiple roles as an array
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);
