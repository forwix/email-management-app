// models/User.js  — ESM & default export
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, minlength: 2, maxlength: 50 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

// nodemon の再読み込み時の Overwrite 対策
const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;   // ★ これが大事
