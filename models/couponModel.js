const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true
    },
    value: {
        type: Number,
        required: true
    },
    minPurchase: {
        type: Number,
        default: 0
    },
    maxDiscount: Number,
    startDate: Date,
    endDate: Date,
    usageLimit: Number,
    usedCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    applicableProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    applicableCategories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }]
}, { timestamps: true }); 