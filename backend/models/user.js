import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  googleId: { type: String },
  avatar: { type: String },
  authProvider: {
    type: String,
    enum: ['local', 'google', 'both'],
    default: 'local',
  },
}, { timestamps: true });

const UserModel = mongoose.model('User', userSchema);
export default UserModel;
