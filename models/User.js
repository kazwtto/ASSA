const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  rawPassword: { type: String, required: false },
  role: { type: String, enum: ['admin', 'student'], default: 'student' },
  expiresAt: { type: Date }, // Data limite de acesso
});
module.exports = mongoose.model('User', UserSchema);