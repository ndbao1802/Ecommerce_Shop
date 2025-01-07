const mongoose = require('mongoose');

const advertisementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    image: String,
    url: String,
    position: String,
    startDate: Date,
    endDate: Date,
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Advertisement', advertisementSchema); 