const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    content: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now }
});

const Feedback = mongoose.model('Feedback', FeedbackSchema);

module.exports = Feedback;
