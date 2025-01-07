const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    image: String,
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    category: String,
    tags: [String],
    viewCount: {
        type: Number,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('News', newsSchema); 