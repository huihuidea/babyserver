const mongoose = require('mongoose');

const CommunityImageSchema = new mongoose.Schema({
    url: { type: String, required: true, trim: true },
    publicId: { type: String, required: true, trim: true },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    format: { type: String, default: '' },
    bytes: { type: Number, default: 0 }
}, { _id: false });

const CommunityPostSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    username: { type: String, required: true, trim: true },
    userAvatar: { type: String, default: '' },
    content: { type: String, default: '', trim: true },
    images: { type: [CommunityImageSchema], default: [] },
    likeCount: { type: Number, default: 0, min: 0 },
    commentCount: { type: Number, default: 0, min: 0 },
    uploadTime: { type: Date, default: Date.now }
}, {
    timestamps: true
});

const CommunityPost = mongoose.model('CommunityPost', CommunityPostSchema);

module.exports = CommunityPost;
