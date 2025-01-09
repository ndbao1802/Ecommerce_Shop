const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    subtitle: String,
    description: String,
    buttonText: String,
    buttonLink: String,
    image: {
        url: String,
        public_id: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    displayOrder: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('Banner', bannerSchema); 