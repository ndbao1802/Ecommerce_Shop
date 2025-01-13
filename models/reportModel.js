const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['product', 'page'],
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
        // Not required as it's only for product reports
    },
    page: {
        type: String
        // Not required as it's only for page reports
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'investigating', 'resolved', 'dismissed'],
        default: 'pending'
    },
    adminResponse: {
        type: String
    },
    resolvedAt: {
        type: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Report', reportSchema); 