const mongoose = require('mongoose');

function generateUserId() {
    return new mongoose.Types.ObjectId().toString();
}

const VipSchema = new mongoose.Schema({
    level: { type: Number, default: 0 },
    isActive: { type: Boolean, default: false },
    expireAt: { type: Date, default: null }
}, { _id: false });

const UserSchema = new mongoose.Schema({
    id: { type: String, unique: true, required: true, default: generateUserId },
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    gender: { type: String, default: '' },
    avatar: { type: String, default: '' },
    vip: { type: VipSchema, default: () => ({}) },
    token: { type: String, default: '' },
    address: { type: String, default: '' },
    email: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
}, { id: false });

const User = mongoose.model('User', UserSchema);

module.exports = User;
